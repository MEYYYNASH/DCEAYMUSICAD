package com.xeceay.music;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.PlaybackParams;
import android.media.audiofx.BassBoost;
import android.media.audiofx.Equalizer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Robust, genuine Audio Player Engine for XECEAY.
 * Features:
 * - Direct playback with automatic multi-hop HTTP/HTTPS redirect resolution (handles 301, 302, 303, 307, 308).
 * - Honest duration reporting (never fakes or loops 30s clips).
 * - Zero fallback hijacking (NEVER plays random unrelated audio from disk when a stream fails).
 */
public class AudioPlayerEngine {

    public interface StateCallback {
        void onStateChanged(JSONObject state);
    }

    private final Context context;
    private final XeceayDatabase database;
    private final StateCallback callback;
    private final ExecutorService networkExecutor = Executors.newSingleThreadExecutor();

    private MediaPlayer mediaPlayer;
    private Equalizer equalizer;
    private BassBoost bassBoost;

    private String currentSongId = "";
    private String currentTitle = "XECEAY Music";
    private String currentArtist = "XECEAY";
    private String currentAlbum = "";
    private String currentArtwork = "";
    private boolean isPrepared = false;
    private float playbackSpeed = 1.0f;
    private float volumeLevel = 0.9f;
    private String currentPreset = "Normal";
    private int[] customBandsDb = new int[]{0, 0, 0, 0, 0};
    private int bassStrength = 150;
    private long sleepTimerEndMs = 0L;
    private int currentDurationMs = 0;
    private String lastErrorMessage = "";

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
        this.currentDurationMs = 0;
        this.lastErrorMessage = "";

        openSourceInternal(sourceRef, startPositionMs);
    }

    private void openSourceInternal(final String sourceRef, final int startPositionMs) {
        releasePlayerOnly();
        emitState("loading");

        String cleanRef = sourceRef != null ? sourceRef.trim() : "";

        // Check if we have this song locally downloaded in the database
        if (cleanRef.isEmpty() && !currentSongId.isEmpty()) {
            cleanRef = resolveLocalDownloadedPath(currentSongId);
        }

        if (cleanRef.isEmpty()) {
            lastErrorMessage = "No stream or local file found for " + currentTitle;
            emitState("error");
            return;
        }

        final String finalSource = cleanRef;

        if (finalSource.startsWith("http://") || finalSource.startsWith("https://")) {
            // Resolve any HTTP redirect chains (such as Audius 302 -> 307 or CDN redirects) in background
            networkExecutor.execute(() -> {
                String resolvedUrl = resolveFinalStreamUrl(finalSource);
                handler.post(() -> prepareMediaPlayer(resolvedUrl, startPositionMs, true));
            });
        } else {
            prepareMediaPlayer(finalSource, startPositionMs, false);
        }
    }

    private void prepareMediaPlayer(final String source, final int startPositionMs, final boolean isNetwork) {
        try {
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

            if (isNetwork) {
                Map<String, String> headers = new HashMap<>();
                headers.put("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
                headers.put("Accept", "*/*");
                mp.setDataSource(context, Uri.parse(source), headers);
            } else if (source.startsWith("content://")) {
                mp.setDataSource(context, Uri.parse(source));
            } else {
                File file = new File(source);
                if (file.exists() && file.length() > 256L) {
                    mp.setDataSource(file.getAbsolutePath());
                } else {
                    lastErrorMessage = "Audio file does not exist on device";
                    emitState("error");
                    return;
                }
            }

            mp.setOnPreparedListener(player -> {
                try {
                    isPrepared = true;
                    currentDurationMs = Math.max(0, player.getDuration());
                    player.setVolume(volumeLevel, volumeLevel);
                    if (startPositionMs > 0 && startPositionMs < currentDurationMs) {
                        player.seekTo(startPositionMs);
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
                updateForegroundService(false);
                emitState("ended");
            });

            mp.setOnErrorListener((player, what, extra) -> {
                isPrepared = false;
                lastErrorMessage = "Playback error (code " + what + ", extra " + extra + ")";
                updateForegroundService(false);
                emitState("error");
                return true;
            });

            mp.prepareAsync();
        } catch (Throwable e) {
            isPrepared = false;
            lastErrorMessage = e.getMessage() != null ? e.getMessage() : "Playback initialization error";
            updateForegroundService(false);
            emitState("error");
        }
    }

    private String resolveLocalDownloadedPath(String songId) {
        try {
            SQLiteDatabase db = database.getReadableDatabase();
            try (Cursor c = db.rawQuery("SELECT destinationUri FROM Downloads WHERE (songId = ? OR id = ?) AND status = 'Completed'", new String[]{songId, songId})) {
                if (c.moveToFirst()) {
                    String path = c.getString(0);
                    if (path != null && new File(path).exists()) return path;
                }
            }
            try (Cursor c = db.rawQuery("SELECT dataUri FROM Songs WHERE id = ? AND source = 'downloaded'", new String[]{songId})) {
                if (c.moveToFirst()) {
                    String path = c.getString(0);
                    if (path != null && new File(path).exists()) return path;
                }
            }
        } catch (Throwable ignored) {
        }
        return "";
    }

    private static String resolveFinalStreamUrl(String urlStr) {
        if (urlStr == null || !urlStr.startsWith("http")) return urlStr;
        String cur = urlStr;
        try {
            for (int hop = 0; hop < 6; hop++) {
                URL u = new URL(cur);
                HttpURLConnection conn = (HttpURLConnection) u.openConnection();
                conn.setRequestMethod("HEAD");
                conn.setInstanceFollowRedirects(false);
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
                conn.setRequestProperty("Accept", "*/*");
                conn.connect();
                int code = conn.getResponseCode();
                if (code >= 300 && code <= 308) {
                    String loc = conn.getHeaderField("Location");
                    conn.disconnect();
                    if (loc != null && !loc.isEmpty()) {
                        if (!loc.startsWith("http")) {
                            loc = new URL(u, loc).toString();
                        }
                        cur = loc;
                        continue;
                    }
                }
                conn.disconnect();
                break;
            }
        } catch (Throwable ignored) {
        }
        return cur;
    }

    private int getEffectivePositionMs() {
        if (mediaPlayer == null || !isPrepared) return 0;
        try {
            return Math.max(0, mediaPlayer.getCurrentPosition());
        } catch (Throwable ignored) {
            return 0;
        }
    }

    private int getEffectiveDurationMs() {
        if (mediaPlayer != null && isPrepared) {
            try {
                int d = mediaPlayer.getDuration();
                if (d > 0) return d;
            } catch (Throwable ignored) {
            }
        }
        return currentDurationMs;
    }

    public boolean togglePlayPause() {
        if (mediaPlayer == null || !isPrepared) return false;
        try {
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
        if (mediaPlayer != null && isPrepared) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.pause();
                    updateForegroundService(false);
                    emitState("paused");
                }
            } catch (Throwable ignored) {
            }
        }
    }

    public void resume() {
        if (mediaPlayer != null && isPrepared) {
            try {
                if (!mediaPlayer.isPlaying()) {
                    mediaPlayer.start();
                    updateForegroundService(true);
                    emitState("playing");
                }
            } catch (Throwable ignored) {
            }
        }
    }

    public void seekTo(int positionMs) {
        if (mediaPlayer != null && isPrepared) {
            try {
                int clamped = Math.max(0, Math.min(getEffectiveDurationMs(), positionMs));
                mediaPlayer.seekTo(clamped);
                emitState("tick");
            } catch (Throwable ignored) {
            }
        }
    }

    public void setVolume(float volume) {
        this.volumeLevel = Math.max(0.0f, Math.min(1.0f, volume));
        if (mediaPlayer != null) {
            try {
                mediaPlayer.setVolume(volumeLevel, volumeLevel);
            } catch (Throwable ignored) {
            }
        }
        emitState("volume");
    }

    public void setSpeed(float speed) {
        this.playbackSpeed = Math.max(0.25f, Math.min(2.5f, speed));
        if (mediaPlayer != null && isPrepared) {
            applyPlaybackSpeedInternal(mediaPlayer);
        }
        emitState("speed");
    }

    private void applyPlaybackSpeedInternal(MediaPlayer player) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PlaybackParams params = player.getPlaybackParams();
                if (params == null) params = new PlaybackParams();
                params.setSpeed(playbackSpeed);
                player.setPlaybackParams(params);
            }
        } catch (Throwable ignored) {
        }
    }

    public void setEqualizerPreset(String presetName, int[] bands, int bass) {
        this.currentPreset = presetName != null ? presetName : "Normal";
        if (bands != null && bands.length == 5) {
            System.arraycopy(bands, 0, this.customBandsDb, 0, 5);
        }
        this.bassStrength = Math.max(0, Math.min(1000, bass));
        if (mediaPlayer != null && isPrepared) {
            attachAudioEffects(mediaPlayer.getAudioSessionId());
        }
        emitState("equalizer");
    }

    private void attachAudioEffects(int audioSessionId) {
        try {
            if (equalizer != null) {
                try { equalizer.release(); } catch (Throwable ignored) {}
                equalizer = null;
            }
            if (bassBoost != null) {
                try { bassBoost.release(); } catch (Throwable ignored) {}
                bassBoost = null;
            }
            if (audioSessionId == 0) return;

            equalizer = new Equalizer(0, audioSessionId);
            equalizer.setEnabled(true);

            bassBoost = new BassBoost(0, audioSessionId);
            bassBoost.setEnabled(true);

            short[] range = equalizer.getBandLevelRange();
            if (range != null && range.length >= 2) {
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
            int duration = currentDurationMs;
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
            if (!lastErrorMessage.isEmpty()) {
                obj.put("error", lastErrorMessage);
            }
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
        networkExecutor.shutdownNow();
        releasePlayerOnly();
    }
}
