package com.xeceay.music;

import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.PlaybackParams;
import android.media.audiofx.BassBoost;
import android.media.audiofx.Equalizer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;

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
    private String currentTitle = "Select a Track";
    private String currentArtist = "XECEAY Audio Engine";
    private String currentAlbum = "";
    private String currentArtwork = "";
    private boolean isPrepared = false;
    private float playbackSpeed = 1.0f;
    private float volumeLevel = 0.9f;
    private String currentPreset = "Normal";
    private int[] customBandsDb = new int[]{0, 0, 0, 0, 0};
    private int bassStrength = 150;
    private long sleepTimerEndMs = 0L;

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
                    long pos = mediaPlayer.getCurrentPosition();
                    if (!currentSongId.isEmpty()) {
                        database.recordPlayback(currentSongId, pos, false);
                    }
                    emitState("tick");
                }
            } catch (Exception ignored) {
            }
            handler.postDelayed(this, 800L);
        }
    };

    public AudioPlayerEngine(Context context, XeceayDatabase database, StateCallback callback) {
        this.context = context;
        this.database = database;
        this.callback = callback;
        handler.postDelayed(progressRunnable, 800L);
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

            if (sourceRef.startsWith("content://") || sourceRef.startsWith("http://") || sourceRef.startsWith("https://")) {
                mp.setDataSource(context, Uri.parse(sourceRef));
            } else {
                File file = new File(sourceRef);
                mp.setDataSource(file.getAbsolutePath());
            }

            mp.setOnPreparedListener(player -> {
                isPrepared = true;
                player.setVolume(volumeLevel, volumeLevel);
                applyPlaybackSpeedInternal(player);
                attachAudioEffects(player.getAudioSessionId());
                if (startPositionMs > 0 && startPositionMs < player.getDuration()) {
                    player.seekTo(startPositionMs);
                }
                player.start();
                if (!currentSongId.isEmpty()) {
                    database.recordPlayback(currentSongId, startPositionMs, true);
                }
                updateForegroundService(true);
                emitState("playing");
            });

            mp.setOnCompletionListener(player -> emitState("ended"));

            mp.setOnErrorListener((player, what, extra) -> {
                isPrepared = false;
                try {
                    JSONObject errState = buildStateJson("error");
                    errState.put("errorMessage", "Audio decoder error (" + what + "/" + extra + ")");
                    callback.onStateChanged(errState);
                } catch (Exception ignored) {
                }
                return true;
            });

            mp.prepareAsync();
            emitState("loading");
        } catch (Exception e) {
            isPrepared = false;
            try {
                JSONObject errState = buildStateJson("error");
                errState.put("errorMessage", e.getMessage() != null ? e.getMessage() : "Unable to open audio source");
                callback.onStateChanged(errState);
            } catch (Exception ignored) {
            }
        }
    }

    public boolean togglePlayPause() {
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
    }

    public void pause() {
        if (mediaPlayer != null && isPrepared && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
            updateForegroundService(false);
            emitState("paused");
        }
    }

    public void seekTo(int positionMs) {
        if (mediaPlayer != null && isPrepared) {
            int max = Math.max(1, mediaPlayer.getDuration());
            int target = Math.max(0, Math.min(max, positionMs));
            mediaPlayer.seekTo(target);
            if (!currentSongId.isEmpty()) {
                database.recordPlayback(currentSongId, target, false);
            }
            emitState("seeked");
        }
    }

    public void setVolume(float volume) {
        volumeLevel = Math.max(0f, Math.min(1f, volume));
        if (mediaPlayer != null) {
            mediaPlayer.setVolume(volumeLevel, volumeLevel);
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
            } catch (Exception ignored) {
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
        applyAudioEffectsSettings();
        emitState("equalizer");
    }

    private void attachAudioEffects(int sessionId) {
        try {
            if (equalizer != null) equalizer.release();
            if (bassBoost != null) bassBoost.release();
            equalizer = new Equalizer(0, sessionId);
            equalizer.setEnabled(true);
            bassBoost = new BassBoost(0, sessionId);
            bassBoost.setEnabled(true);
            applyAudioEffectsSettings();
        } catch (Exception ignored) {
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
        } catch (Exception ignored) {
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
        callback.onStateChanged(buildStateJson(event));
    }

    private JSONObject buildStateJson(String event) {
        JSONObject obj = new JSONObject();
        try {
            boolean playing = false;
            int position = 0;
            int duration = 0;
            if (mediaPlayer != null && isPrepared) {
                try {
                    playing = mediaPlayer.isPlaying();
                    position = mediaPlayer.getCurrentPosition();
                    duration = Math.max(0, mediaPlayer.getDuration());
                } catch (Exception ignored) {
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
        } catch (Exception ignored) {
        }
        return obj;
    }

    private void updateForegroundService(boolean isPlaying) {
        try {
            Intent intent = new Intent(context, MusicPlaybackService.class);
            intent.putExtra("title", currentTitle);
            intent.putExtra("artist", currentArtist);
            intent.putExtra("isPlaying", isPlaying);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isPlaying) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Exception ignored) {
        }
    }

    private void releasePlayerOnly() {
        try {
            if (equalizer != null) {
                equalizer.release();
                equalizer = null;
            }
            if (bassBoost != null) {
                bassBoost.release();
                bassBoost = null;
            }
            if (mediaPlayer != null) {
                mediaPlayer.reset();
                mediaPlayer.release();
                mediaPlayer = null;
            }
        } catch (Exception ignored) {
        }
    }

    public void release() {
        handler.removeCallbacks(progressRunnable);
        releasePlayerOnly();
    }
}
