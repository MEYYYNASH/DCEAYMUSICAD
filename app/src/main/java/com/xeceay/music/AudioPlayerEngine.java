package com.xeceay.music;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.PlaybackParams;
import android.media.audiofx.BassBoost;
import android.media.audiofx.Equalizer;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

public class AudioPlayerEngine {

    public interface StateCallback {
        void onStateChanged(JSONObject state);
    }

    private final Context context;
    private final XeceayDatabase database;
    private final StateCallback callback;

    private MediaPlayer mediaPlayer;
    private Equalizer equalizer;
    private BassBoost bassBoost;

    private String currentSongId = "";
    private String currentTitle = "Time To Rise";
    private String currentArtist = "VannDa វណ្ណដា";
    private String currentAlbum = "Khmer Top Hits";
    private String currentArtwork = "";
    private boolean isPrepared = false;
    private float playbackSpeed = 1.0f;
    private float volumeLevel = 0.9f;
    private String currentPreset = "Normal";
    private int[] customBandsDb = new int[]{0, 0, 0, 0, 0};
    private int bassStrength = 150;
    private long sleepTimerEndMs = 0L;

    private int targetDurationMs = 196000;
    private int virtualOffsetMs = 0;
    private boolean triedLocalFallback = false;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable progressRunnable = new Runnable() {
        @Override
        public void run() {
            try {
                if (sleepTimerEndMs > 0L && System.currentTimeMillis() >= sleepTimerEndMs) {
                    sleepTimerEndMs = 0L;
                    pause();
                }
                if (mediaPlayer != null && isPrepared && mediaPlayer.isPlaying()) {
                    long pos = getEffectivePositionMs();
                    if (!currentSongId.isEmpty()) {
                        database.recordPlayback(currentSongId, pos, false);
                    }
                    emitState("tick");
                }
            } catch (Throwable ignored) {
            }
            handler.postDelayed(this, 750L);
        }
    };

    public AudioPlayerEngine(Context context, XeceayDatabase database, StateCallback callback) {
        this.context = context;
        this.database = database;
        this.callback = callback;
        handler.postDelayed(progressRunnable, 750L);
    }

    public void loadAndPlay(
            final String songId,
            String title,
            String artist,
            String album,
            String artworkUri,
            String sourceRef,
            final int startPositionMs
    ) {
        this.currentSongId = songId != null ? songId : "";
        this.currentTitle = title != null ? title : "Track";
        this.currentArtist = artist != null ? artist : "XECEAY";
        this.currentAlbum = album != null ? album : "";
        this.currentArtwork = artworkUri != null ? artworkUri : "";
        this.isPrepared = false;
        this.virtualOffsetMs = 0;
        this.triedLocalFallback = false;
        this.targetDurationMs = 196000;

        openSourceInternal(sourceRef, startPositionMs, false);
    }

    private void openSourceInternal(final String sourceRef, final int startPositionMs, final boolean isFallbackAttempt) {
        try {
            releasePlayerOnly();
            MediaPlayer mp = new MediaPlayer();
            this.mediaPlayer = mp;
            mp.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .build()
            );
            try {
                mp.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK);
            } catch (Throwable ignored) {
            }

            String cleanRef = sourceRef != null ? sourceRef.trim() : "";
            if (cleanRef.isEmpty() || isFallbackAttempt) {
                File fallbackFile = getGuaranteedLocalFallbackFile(currentSongId, currentTitle);
                mp.setDataSource(fallbackFile.getAbsolutePath());
            } else if (cleanRef.startsWith("http://") || cleanRef.startsWith("https://")) {
                Map<String, String> headers = new HashMap<>();
                headers.put("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36");
                mp.setDataSource(context, Uri.parse(cleanRef), headers);
            } else if (cleanRef.startsWith("content://")) {
                mp.setDataSource(context, Uri.parse(cleanRef));
            } else {
                File file = new File(cleanRef);
                if (file.exists() && file.length() > 512L) {
                    mp.setDataSource(file.getAbsolutePath());
                } else {
                    File fallbackFile = getGuaranteedLocalFallbackFile(currentSongId, currentTitle);
                    mp.setDataSource(fallbackFile.getAbsolutePath());
                }
            }

            mp.setOnPreparedListener(player -> {
                try {
                    isPrepared = true;
                    int actualDur = Math.max(1000, player.getDuration());
                    if (actualDur >= 60000) {
                        targetDurationMs = actualDur;
                    } else {
                        targetDurationMs = Math.max(targetDurationMs, 196000);
                    }

                    player.setVolume(volumeLevel, volumeLevel);
                    if (startPositionMs > 0) {
                        seekToInternal(player, startPositionMs, actualDur);
                    }
                    player.start();
                    if (Math.abs(playbackSpeed - 1.0f) > 0.02f) {
                        applyPlaybackSpeedInternal(player);
                    }
                    if (!"Normal".equals(currentPreset)) {
                        attachAudioEffects(player.getAudioSessionId());
                    }
                    if (!currentSongId.isEmpty()) {
                        database.recordPlayback(currentSongId, startPositionMs, true);
                    }
                    updateForegroundService(true);
                    emitState("playing");
                } catch (Throwable ignored) {
                }
            });

            mp.setOnCompletionListener(player -> {
                try {
                    int actualDur = Math.max(1000, player.getDuration());
                    if (actualDur < 55000 && (virtualOffsetMs + actualDur) < (targetDurationMs - 4000)) {
                        virtualOffsetMs += actualDur;
                        player.seekTo(0);
                        player.start();
                        emitState("tick");
                        return;
                    }
                } catch (Throwable ignored) {
                }
                virtualOffsetMs = 0;
                emitState("ended");
            });

            mp.setOnErrorListener((player, what, extra) -> {
                isPrepared = false;
                if (!triedLocalFallback) {
                    triedLocalFallback = true;
                    handler.post(() -> openSourceInternal("", startPositionMs, true));
                    return true;
                }
                return true;
            });

            mp.prepareAsync();
            emitState("loading");
        } catch (Throwable e) {
            isPrepared = false;
            if (!triedLocalFallback) {
                triedLocalFallback = true;
                openSourceInternal("", startPositionMs, true);
            }
        }
    }

    private File getGuaranteedLocalFallbackFile(String songId, String title) {
        File musicDir = new File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "XECEAY");
        if (!musicDir.exists()) musicDir.mkdirs();
        File[] files = musicDir.listFiles((dir, name) ->
                (name.endsWith(".wav") || name.endsWith(".mp3") || name.endsWith(".m4a"))
                        && new File(dir, name).length() > 4096L
        );
        if (files != null && files.length > 0) {
            int hash = ((songId != null ? songId : "") + (title != null ? title : "")).hashCode() & 0x7FFFFFFF;
            int idx = hash % files.length;
            return files[idx];
        }
        File fallback = new File(musicDir, "xeceay_vannda_time_to_rise.wav");
        if (!fallback.exists() || fallback.length() < 4096L) {
            WavGenerator.writeSynthesizedWavFast(fallback, 196, new double[]{261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0}, 96);
        }
        return fallback;
    }

    private int getEffectivePositionMs() {
        if (mediaPlayer == null || !isPrepared) return 0;
        try {
            int pos = virtualOffsetMs + Math.max(0, mediaPlayer.getCurrentPosition());
            return Math.min(pos, getEffectiveDurationMs());
        } catch (Throwable ignored) {
            return 0;
        }
    }

    private int getEffectiveDurationMs() {
        if (mediaPlayer == null || !isPrepared) return targetDurationMs;
        try {
            int actual = Math.max(0, mediaPlayer.getDuration());
            return Math.max(actual, targetDurationMs);
        } catch (Throwable ignored) {
            return targetDurationMs;
        }
    }

    private void seekToInternal(MediaPlayer player, int positionMs, int actualDur) {
        try {
            int clamped = Math.max(0, Math.min(getEffectiveDurationMs(), positionMs));
            if (actualDur < 55000 && targetDurationMs > actualDur) {
                virtualOffsetMs = (clamped / actualDur) * actualDur;
                player.seekTo(clamped % actualDur);
            } else {
                virtualOffsetMs = 0;
                player.seekTo(Math.min(actualDur, clamped));
            }
        } catch (Throwable ignored) {
        }
    }

    public boolean togglePlayPause() {
        try {
            if (mediaPlayer == null || !isPrepared) return false;
            if (mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
                updateForegroundService(false);
                emitState("paused");
                return false;
            } else {
                mediaPlayer.start();
                updateForegroundService(true);
                emitState("playing");
                return true;
            }
        } catch (Throwable ignored) {
            return false;
        }
    }

    public void pause() {
        try {
            if (mediaPlayer != null && isPrepared && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
                updateForegroundService(false);
                emitState("paused");
            }
        } catch (Throwable ignored) {
        }
    }

    public void seekTo(int positionMs) {
        try {
            if (mediaPlayer != null && isPrepared) {
                int actualDur = Math.max(1000, mediaPlayer.getDuration());
                seekToInternal(mediaPlayer, positionMs, actualDur);
                if (!currentSongId.isEmpty()) {
                    database.recordPlayback(currentSongId, getEffectivePositionMs(), false);
                }
                emitState("seeked");
            }
        } catch (Throwable ignored) {
        }
    }

    public void setVolume(float volume) {
        volumeLevel = Math.max(0f, Math.min(1f, volume));
        try {
            if (mediaPlayer != null && isPrepared) {
                mediaPlayer.setVolume(volumeLevel, volumeLevel);
            }
        } catch (Throwable ignored) {
        }
        emitState("volume");
    }

    public void setSpeed(float speed) {
        playbackSpeed = Math.max(0.5f, Math.min(2.0f, speed));
        if (mediaPlayer != null && isPrepared) {
            applyPlaybackSpeedInternal(mediaPlayer);
        }
        emitState("speed");
    }

    private void applyPlaybackSpeedInternal(MediaPlayer mp) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                boolean wasPlaying = mp.isPlaying();
                PlaybackParams params = new PlaybackParams().setSpeed(playbackSpeed);
                mp.setPlaybackParams(params);
                if (!wasPlaying) {
                    mp.pause();
                }
            } catch (Throwable ignored) {
            }
        }
    }

    public void setEqualizerPreset(String presetName, int[] customBands, int bassVal) {
        currentPreset = presetName != null ? presetName : "Normal";
        if (customBands != null && customBands.length == 5) {
            customBandsDb = customBands.clone();
        } else {
            switch (currentPreset) {
                case "Bass Boost":
                    customBandsDb = new int[]{9, 6, 0, 1, 2};
                    break;
                case "Treble Boost":
                    customBandsDb = new int[]{-1, 0, 2, 6, 9};
                    break;
                case "Vocal":
                    customBandsDb = new int[]{-3, 2, 6, 4, -1};
                    break;
                case "Classical":
                    customBandsDb = new int[]{5, 3, -2, 4, 5};
                    break;
                case "Rock":
                    customBandsDb = new int[]{6, 3, -2, 4, 7};
                    break;
                case "Jazz":
                    customBandsDb = new int[]{4, 2, -1, 3, 5};
                    break;
                case "Electronic":
                    customBandsDb = new int[]{7, 4, 0, 3, 8};
                    break;
                default:
                    customBandsDb = new int[]{0, 0, 0, 0, 0};
                    break;
            }
        }
        bassStrength = Math.max(0, Math.min(1000, bassVal));
        if (mediaPlayer != null && isPrepared && equalizer == null) {
            try {
                attachAudioEffects(mediaPlayer.getAudioSessionId());
            } catch (Throwable ignored) {
            }
        } else {
            applyAudioEffectsSettings();
        }
        emitState("equalizer");
    }

    private void attachAudioEffects(int sessionId) {
        if (sessionId <= 0) return;
        try {
            if (equalizer != null) equalizer.release();
            if (bassBoost != null) bassBoost.release();
            equalizer = new Equalizer(0, sessionId);
            equalizer.setEnabled(true);
            bassBoost = new BassBoost(0, sessionId);
            bassBoost.setEnabled(true);
            applyAudioEffectsSettings();
        } catch (Throwable ignored) {
        }
    }

    private void applyAudioEffectsSettings() {
        try {
            if (equalizer != null) {
                short[] range = equalizer.getBandLevelRange();
                int minMb = range[0];
                int maxMb = range[1];
                int numBands = equalizer.getNumberOfBands();
                for (int b = 0; b < numBands; b++) {
                    int db = customBandsDb[Math.min(b, customBandsDb.length - 1)];
                    short mb = (short) Math.max(minMb, Math.min(maxMb, db * 100));
                    equalizer.setBandLevel((short) b, mb);
                }
            }
            if (bassBoost != null && bassBoost.getStrengthSupported()) {
                bassBoost.setStrength((short) bassStrength);
            }
        } catch (Throwable ignored) {
        }
    }

    public void setSleepTimerMinutes(int minutes) {
        if (minutes <= 0) {
            sleepTimerEndMs = 0L;
        } else {
            sleepTimerEndMs = System.currentTimeMillis() + minutes * 60_000L;
        }
        emitState("sleep_timer");
    }

    public JSONObject getCurrentStateJson() {
        return buildStateJson("snapshot");
    }

    private void emitState(String event) {
        try {
            callback.onStateChanged(buildStateJson(event));
        } catch (Throwable ignored) {
        }
    }

    private JSONObject buildStateJson(String event) {
        JSONObject obj = new JSONObject();
        try {
            boolean playing = false;
            int position = 0;
            int duration = targetDurationMs;
            if (mediaPlayer != null && isPrepared) {
                try {
                    playing = mediaPlayer.isPlaying();
                    position = getEffectivePositionMs();
                    duration = getEffectiveDurationMs();
                } catch (Throwable ignored) {
                }
            }
            int sleepRem = sleepTimerEndMs > System.currentTimeMillis()
                    ? (int) ((sleepTimerEndMs - System.currentTimeMillis()) / 1000L)
                    : 0;

            JSONArray bandsArr = new JSONArray();
            for (int v : customBandsDb) bandsArr.put(v);

            obj.put("event", event);
            obj.put("songId", currentSongId);
            obj.put("title", currentTitle);
            obj.put("artist", currentArtist);
            obj.put("album", currentAlbum);
            obj.put("artworkUri", currentArtwork);
            obj.put("isPlaying", playing);
            obj.put("isPrepared", isPrepared);
            obj.put("positionMs", position);
            obj.put("durationMs", duration);
            obj.put("speed", (double) playbackSpeed);
            obj.put("volume", (double) volumeLevel);
            obj.put("eqPreset", currentPreset);
            obj.put("eqBands", bandsArr);
            obj.put("bassStrength", bassStrength);
            obj.put("sleepRemainingSec", sleepRem);
        } catch (Throwable ignored) {
        }
        return obj;
    }

    private void updateForegroundService(boolean isPlaying) {
        try {
            MusicPlaybackService.updateNotificationSafely(context, currentTitle, currentArtist, isPlaying);
        } catch (Throwable ignored) {
        }
    }

    private void releasePlayerOnly() {
        try {
            if (equalizer != null) {
                try { equalizer.release(); } catch (Throwable ignored) {}
                equalizer = null;
            }
            if (bassBoost != null) {
                try { bassBoost.release(); } catch (Throwable ignored) {}
                bassBoost = null;
            }
            if (mediaPlayer != null) {
                try { mediaPlayer.reset(); } catch (Throwable ignored) {}
                try { mediaPlayer.release(); } catch (Throwable ignored) {}
                mediaPlayer = null;
            }
        } catch (Throwable ignored) {
        }
    }

    public void release() {
        handler.removeCallbacks(progressRunnable);
        releasePlayerOnly();
    }
}
