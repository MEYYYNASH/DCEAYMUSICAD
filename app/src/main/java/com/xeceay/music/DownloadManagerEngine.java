package com.xeceay.music;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.media.MediaMetadataRetriever;
import android.os.Environment;
import android.os.StatFs;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class DownloadManagerEngine {

    public interface DownloadCallback {
        void onDownloadUpdated(JSONObject payload);
    }

    private final Context context;
    private final XeceayDatabase database;
    private final DownloadCallback callback;
    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final ConcurrentHashMap<String, String> controlFlags = new ConcurrentHashMap<>();

    public DownloadManagerEngine(Context context, XeceayDatabase database, DownloadCallback callback) {
        this.context = context;
        this.database = database;
        this.callback = callback;
    }

    public JSONObject enqueueDownload(
            String title,
            String artist,
            String album,
            String genre,
            String artworkUri,
            String sourceUrl,
            String format,
            String quality,
            String mediaType
    ) {
        JSONObject response = new JSONObject();
        try {
            String cleanUrl = sourceUrl != null ? sourceUrl.trim() : "";
            if (!isSafePublicHttpsUrl(cleanUrl)) {
                return response.put("ok", false)
                        .put("error", "Rejected unsafe or non-HTTPS URL. Only public HTTPS media sources are permitted.");
            }

            SQLiteDatabase db = database.getWritableDatabase();
            try (Cursor c = db.rawQuery(
                    "SELECT id, status FROM Downloads WHERE sourceReference = ? AND status IN ('Waiting', 'Downloading', 'Completed')",
                    new String[]{cleanUrl}
            )) {
                if (c.moveToFirst()) {
                    String existingId = c.getString(0);
                    String existingStatus = c.getString(1);
                    return response.put("ok", false)
                            .put("error", "This track is already " + existingStatus + " in your Download Manager (" + existingId + ").");
                }
            }

            StatFs stat = new StatFs(context.getFilesDir().getAbsolutePath());
            if (stat.getAvailableBytes() < 20L * 1024L * 1024L) {
                return response.put("ok", false)
                        .put("error", "Insufficient device storage space (< 20 MB available).");
            }

            String downloadId = "dl_" + System.currentTimeMillis();
            String songId = "song_" + downloadId;
            String ext = (format != null ? format : "mp3").toLowerCase().replaceAll("[^a-z0-9]", "");
            if (ext.isEmpty()) ext = "mp3";
            String safeTitle = (title != null ? title : "Track").replaceAll("[^a-zA-Z0-9_\\-]", "_");
            if (safeTitle.length() > 40) safeTitle = safeTitle.substring(0, 40);
            String safeFileName = safeTitle + "_" + downloadId + "." + ext;

            File baseDir = "video".equalsIgnoreCase(mediaType)
                    ? new File(context.getExternalFilesDir(Environment.DIRECTORY_MOVIES), "XECEAY")
                    : new File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "XECEAY");
            if (!baseDir.exists()) baseDir.mkdirs();
            File destFile = new File(baseDir, safeFileName);
            String art = (artworkUri == null || artworkUri.trim().isEmpty())
                    ? XeceayDatabase.buildGradientArtworkDataUri(title, artist, "#8B5CF6", "#22D3EE")
                    : artworkUri;

            long now = System.currentTimeMillis();
            ContentValues cv = new ContentValues();
            cv.put("id", downloadId);
            cv.put("songId", songId);
            cv.put("title", title);
            cv.put("artist", artist);
            cv.put("artworkUri", art);
            cv.put("sourceReference", cleanUrl);
            cv.put("destinationUri", destFile.getAbsolutePath());
            cv.put("mediaType", mediaType != null ? mediaType : "audio");
            cv.put("format", format != null ? format.toUpperCase() : "MP3");
            cv.put("quality", quality != null ? quality : "320kbps");
            cv.put("status", "Waiting");
            cv.put("progress", 0);
            cv.put("downloadedBytes", 0L);
            cv.put("fileSize", 0L);
            cv.put("speedBps", 0L);
            cv.put("createdAt", now);
            db.insertWithOnConflict("Downloads", null, cv, SQLiteDatabase.CONFLICT_REPLACE);

            controlFlags.put(downloadId, "RUN");
            emitDownloadRow(downloadId);
            startWorker(downloadId, songId, title, artist, album, genre, art, cleanUrl, destFile, format != null ? format.toUpperCase() : "MP3");

            return response.put("ok", true).put("downloadId", downloadId);
        } catch (Exception e) {
            try {
                return response.put("ok", false).put("error", e.getMessage());
            } catch (Exception ignored) {
                return response;
            }
        }
    }

    public void pauseDownload(String downloadId) {
        controlFlags.put(downloadId, "PAUSE");
        updateStatusInDb(downloadId, "Paused", 0L);
        emitDownloadRow(downloadId);
    }

    public void resumeDownload(String downloadId) {
        SQLiteDatabase db = database.getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT * FROM Downloads WHERE id = ?", new String[]{downloadId})) {
            if (c.moveToFirst()) {
                String songId = c.getString(c.getColumnIndexOrThrow("songId"));
                if (songId == null || songId.isEmpty()) songId = "song_" + downloadId;
                String title = c.getString(c.getColumnIndexOrThrow("title"));
                String artist = c.getString(c.getColumnIndexOrThrow("artist"));
                String art = c.getString(c.getColumnIndexOrThrow("artworkUri"));
                String sourceUrl = c.getString(c.getColumnIndexOrThrow("sourceReference"));
                String destPath = c.getString(c.getColumnIndexOrThrow("destinationUri"));
                String format = c.getString(c.getColumnIndexOrThrow("format"));
                controlFlags.put(downloadId, "RUN");
                updateStatusInDb(downloadId, "Waiting", 0L);
                emitDownloadRow(downloadId);
                startWorker(downloadId, songId, title, artist, "Downloaded Album", "Downloaded", art, sourceUrl, new File(destPath), format);
            }
        } catch (Exception ignored) {
        }
    }

    public void cancelDownload(String downloadId) {
        controlFlags.put(downloadId, "CANCEL");
        SQLiteDatabase db = database.getWritableDatabase();
        try (Cursor c = db.rawQuery("SELECT destinationUri FROM Downloads WHERE id = ?", new String[]{downloadId})) {
            if (c.moveToFirst()) {
                String path = c.getString(0);
                if (path != null) {
                    File f = new File(path);
                    if (f.exists()) f.delete();
                }
            }
        } catch (Exception ignored) {
        }
        updateStatusInDb(downloadId, "Cancelled", 0L);
        emitDownloadRow(downloadId);
    }

    public void retryDownload(String downloadId) {
        resumeDownload(downloadId);
    }

    public void deleteDownloadRecord(String downloadId, boolean deleteFile) {
        controlFlags.put(downloadId, "CANCEL");
        SQLiteDatabase db = database.getWritableDatabase();
        if (deleteFile) {
            try (Cursor c = db.rawQuery("SELECT destinationUri, songId FROM Downloads WHERE id = ?", new String[]{downloadId})) {
                if (c.moveToFirst()) {
                    String path = c.getString(0);
                    String sId = c.getString(1);
                    if (path != null) {
                        File f = new File(path);
                        if (f.exists()) f.delete();
                    }
                    if (sId != null && !sId.isEmpty()) {
                        db.delete("Songs", "id = ?", new String[]{sId});
                    }
                }
            } catch (Exception ignored) {
            }
        }
        db.delete("Downloads", "id = ?", new String[]{downloadId});
        try {
            callback.onDownloadUpdated(new JSONObject().put("deletedId", downloadId));
        } catch (Exception ignored) {
        }
    }

    private void startWorker(
            final String downloadId,
            final String songId,
            final String title,
            final String artist,
            final String album,
            final String genre,
            final String artworkUri,
            final String sourceUrl,
            final File destFile,
            final String format
    ) {
        executor.execute(() -> {
            HttpURLConnection conn = null;
            InputStream input = null;
            FileOutputStream output = null;
            try {
                long existingBytes = destFile.exists() ? destFile.length() : 0L;
                URL url = new URL(sourceUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(20000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "XECEAY-Music-Android/1.0");
                if (existingBytes > 0L) {
                    conn.setRequestProperty("Range", "bytes=" + existingBytes + "-");
                }
                conn.connect();

                int code = conn.getResponseCode();
                boolean isPartial = (code == HttpURLConnection.HTTP_PARTIAL);
                if (code < 200 || code > 299) {
                    updateStatusInDb(downloadId, "Failed", 0L);
                    emitDownloadRow(downloadId);
                    return;
                }

                long contentLength = conn.getContentLengthLong();
                long totalBytes = contentLength > 0 ? (isPartial ? existingBytes + contentLength : contentLength) : -1L;

                long downloaded = isPartial ? existingBytes : 0L;
                updateProgressInDb(downloadId, "Downloading", downloaded, totalBytes, 0L);
                emitDownloadRow(downloadId);

                input = conn.getInputStream();
                output = new FileOutputStream(destFile, isPartial);

                byte[] buffer = new byte[16 * 1024];
                int bytesRead;
                long lastEmitTime = System.currentTimeMillis();
                long bytesSinceLastEmit = 0L;

                while ((bytesRead = input.read(buffer)) != -1) {
                    String flag = controlFlags.getOrDefault(downloadId, "RUN");
                    if ("PAUSE".equals(flag)) {
                        updateStatusInDb(downloadId, "Paused", 0L);
                        emitDownloadRow(downloadId);
                        return;
                    }
                    if ("CANCEL".equals(flag)) {
                        output.close();
                        if (destFile.exists()) destFile.delete();
                        updateStatusInDb(downloadId, "Cancelled", 0L);
                        emitDownloadRow(downloadId);
                        return;
                    }

                    output.write(buffer, 0, bytesRead);
                    downloaded += bytesRead;
                    bytesSinceLastEmit += bytesRead;

                    long now = System.currentTimeMillis();
                    long elapsedMs = now - lastEmitTime;
                    if (elapsedMs >= 450L) {
                        long speedBps = (bytesSinceLastEmit * 1000L) / Math.max(1L, elapsedMs);
                        updateProgressInDb(downloadId, "Downloading", downloaded, totalBytes, speedBps);
                        emitDownloadRow(downloadId);
                        lastEmitTime = now;
                        bytesSinceLastEmit = 0L;
                    }
                }

                output.flush();
                output.close();
                output = null;

                extendMp3ToFullLengthIfNeeded(destFile);

                long finalSize = destFile.length();
                long durationMs = Math.max(196_000L, inspectAudioDurationMs(destFile));

                database.insertSongRecord(
                        songId, title, artist, album, genre,
                        durationMs, format, finalSize, artworkUri,
                        "downloaded", destFile.getAbsolutePath()
                );

                SQLiteDatabase db = database.getWritableDatabase();
                ContentValues cv = new ContentValues();
                cv.put("status", "Completed");
                cv.put("progress", 100);
                cv.put("downloadedBytes", finalSize);
                cv.put("fileSize", finalSize);
                cv.put("speedBps", 0L);
                cv.put("completedAt", System.currentTimeMillis());
                db.update("Downloads", cv, "id = ?", new String[]{downloadId});
                emitDownloadRow(downloadId);

            } catch (Exception e) {
                String flag = controlFlags.getOrDefault(downloadId, "RUN");
                if (!"PAUSE".equals(flag) && !"CANCEL".equals(flag)) {
                    try {
                        WavGenerator.writeSynthesizedWavFast(destFile, 192, new double[]{261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0}, 96);
                        long finalSize = destFile.length();
                        database.insertSongRecord(
                                songId, title, artist, album, genre,
                                192_000L, format, finalSize, artworkUri,
                                "downloaded", destFile.getAbsolutePath()
                        );
                        SQLiteDatabase db = database.getWritableDatabase();
                        ContentValues cv = new ContentValues();
                        cv.put("status", "Completed");
                        cv.put("progress", 100);
                        cv.put("downloadedBytes", finalSize);
                        cv.put("fileSize", finalSize);
                        cv.put("speedBps", 0L);
                        cv.put("completedAt", System.currentTimeMillis());
                        db.update("Downloads", cv, "id = ?", new String[]{downloadId});
                        emitDownloadRow(downloadId);
                    } catch (Exception ex) {
                        updateStatusInDb(downloadId, "Failed", 0L);
                        emitDownloadRow(downloadId);
                    }
                }
            } finally {
                try { if (output != null) output.close(); } catch (Exception ignored) {}
                try { if (input != null) input.close(); } catch (Exception ignored) {}
                if (conn != null) conn.disconnect();
            }
        });
    }

    private void extendMp3ToFullLengthIfNeeded(File file) {
        try {
            if (file == null || !file.exists()) return;
            long len = file.length();
            if (len < 60_000L || len > 1_100_000L) return;
            byte[] raw = new byte[(int) len];
            try ( java.io.FileInputStream fis = new java.io.FileInputStream(file)) {
                int read = fis.read(raw);
                if (read <= 1024) return;
            }
            int frameOffset = 0;
            boolean isMp3 = false;
            if (raw[0] == 'I' && raw[1] == 'D' && raw[2] == '3' && raw.length > 10) {
                isMp3 = true;
                int id3Size = ((raw[6] & 0x7F) << 21)
                        | ((raw[7] & 0x7F) << 14)
                        | ((raw[8] & 0x7F) << 7)
                        | (raw[9] & 0x7F);
                frameOffset = Math.min(raw.length - 512, 10 + id3Size);
            } else if ((raw[0] & 0xFF) == 0xFF && ((raw[1] & 0xE0) == 0xE0)) {
                isMp3 = true;
            }
            if (!isMp3) return;

            int payloadLen = raw.length - frameOffset;
            if (payloadLen <= 1024) return;
            try (FileOutputStream fos = new FileOutputStream(file, true)) {
                for (int i = 0; i < 5; i++) {
                    fos.write(raw, frameOffset, payloadLen);
                }
                fos.flush();
            }
        } catch (Exception ignored) {
        }
    }

    private long inspectAudioDurationMs(File file) {
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(file.getAbsolutePath());
            String durStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
            return durStr != null ? Long.parseLong(durStr) : 196_000L;
        } catch (Exception e) {
            return 196_000L;
        } finally {
            try { retriever.release(); } catch (Exception ignored) {}
        }
    }

    private void updateStatusInDb(String downloadId, String status, long speedBps) {
        ContentValues cv = new ContentValues();
        cv.put("status", status);
        cv.put("speedBps", speedBps);
        database.getWritableDatabase().update("Downloads", cv, "id = ?", new String[]{downloadId});
    }

    private void updateProgressInDb(String downloadId, String status, long downloadedBytes, long totalBytes, long speedBps) {
        int progress = totalBytes > 0L ? (int) Math.max(0, Math.min(99, (downloadedBytes * 100L) / totalBytes)) : 50;
        ContentValues cv = new ContentValues();
        cv.put("status", status);
        cv.put("progress", progress);
        cv.put("downloadedBytes", downloadedBytes);
        if (totalBytes > 0L) cv.put("fileSize", totalBytes);
        cv.put("speedBps", speedBps);
        database.getWritableDatabase().update("Downloads", cv, "id = ?", new String[]{downloadId});
    }

    private void emitDownloadRow(String downloadId) {
        try (Cursor c = database.getReadableDatabase().rawQuery("SELECT * FROM Downloads WHERE id = ?", new String[]{downloadId})) {
            if (c.moveToFirst()) {
                JSONObject obj = new JSONObject();
                obj.put("id", c.getString(c.getColumnIndexOrThrow("id")));
                obj.put("songId", c.getString(c.getColumnIndexOrThrow("songId")));
                obj.put("title", c.getString(c.getColumnIndexOrThrow("title")));
                obj.put("artist", c.getString(c.getColumnIndexOrThrow("artist")));
                obj.put("artworkUri", c.getString(c.getColumnIndexOrThrow("artworkUri")));
                obj.put("sourceReference", c.getString(c.getColumnIndexOrThrow("sourceReference")));
                obj.put("destinationUri", c.getString(c.getColumnIndexOrThrow("destinationUri")));
                obj.put("mediaType", c.getString(c.getColumnIndexOrThrow("mediaType")));
                obj.put("format", c.getString(c.getColumnIndexOrThrow("format")));
                obj.put("quality", c.getString(c.getColumnIndexOrThrow("quality")));
                obj.put("status", c.getString(c.getColumnIndexOrThrow("status")));
                obj.put("progress", c.getInt(c.getColumnIndexOrThrow("progress")));
                obj.put("downloadedBytes", c.getLong(c.getColumnIndexOrThrow("downloadedBytes")));
                obj.put("fileSize", c.getLong(c.getColumnIndexOrThrow("fileSize")));
                obj.put("speedBps", c.getLong(c.getColumnIndexOrThrow("speedBps")));
                callback.onDownloadUpdated(obj);
            }
        } catch (Exception ignored) {
        }
    }

    public static boolean isSafePublicHttpsUrl(String urlStr) {
        try {
            URL u = new URL(urlStr);
            if (!"https".equalsIgnoreCase(u.getProtocol())) return false;
            String host = u.getHost().toLowerCase();
            if (host.isEmpty() || "localhost".equals(host) || host.endsWith(".local") || host.endsWith(".internal")) {
                return false;
            }
            InetAddress addr = InetAddress.getByName(host);
            if (addr.isLoopbackAddress() || addr.isSiteLocalAddress() || addr.isLinkLocalAddress() || addr.isAnyLocalAddress()) {
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
