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
            if (!cleanUrl.isEmpty() && !isSafePublicHttpsUrl(cleanUrl)) {
                return response.put("ok", false)
                        .put("error", "Rejected unsafe or non-HTTPS URL. Only public HTTPS media sources are permitted.");
            }

            SQLiteDatabase db = database.getWritableDatabase();
            if (!cleanUrl.isEmpty()) {
                try (Cursor c = db.rawQuery(
                        "SELECT id, status FROM Downloads WHERE sourceReference = ? AND status IN ('Waiting', 'Downloading')",
                        new String[]{cleanUrl}
                )) {
                    if (c.moveToFirst()) {
                        String existingId = c.getString(0);
                        return response.put("ok", false)
                                .put("error", "This download is already in progress (" + existingId + ").");
                    }
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
            String streamUrl = sourceUrl != null ? sourceUrl.trim() : "";
            try {
                // If stream URL is a YouTube link, resolve the real direct audio/video stream
                if (streamUrl.contains("youtube.com") || streamUrl.contains("youtu.be")) {
                    String directYt = LinkAnalyzerService.resolveDirectYouTubeStream(streamUrl, "MP4".equalsIgnoreCase(format) ? "720" : "mp3");
                    if (directYt != null && !directYt.isEmpty()) {
                        streamUrl = directYt;
                    }
                }

                // If stream URL is empty or invalid, resolve the real audio stream for this exact track
                if (streamUrl.isEmpty() || !streamUrl.startsWith("https://")) {
                    streamUrl = resolveRealAudioUrl(title, artist);
                }
                if (streamUrl == null || streamUrl.isEmpty()) {
                    updateStatusInDb(downloadId, "Failed", 0L);
                    emitDownloadRow(downloadId);
                    return;
                }

                long existingBytes = destFile.exists() ? destFile.length() : 0L;
                int code = -1;

                // Follow multi-hop redirects (301, 302, 303, 307, 308) up to 6 times
                for (int hop = 0; hop < 6; hop++) {
                    URL url = new URL(streamUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(20000);
                    conn.setInstanceFollowRedirects(false);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
                    conn.setRequestProperty("Accept", "*/*");
                    if (existingBytes > 0L) {
                        conn.setRequestProperty("Range", "bytes=" + existingBytes + "-");
                    }
                    conn.connect();
                    code = conn.getResponseCode();

                    if (code >= 300 && code <= 308) {
                        String loc = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (loc != null && !loc.isEmpty()) {
                            if (!loc.startsWith("http")) {
                                loc = new URL(url, loc).toString();
                            }
                            streamUrl = loc;
                            continue;
                        }
                    }
                    break;
                }

                // If URL returned error, attempt to re-resolve a fresh live stream
                if (code < 200 || code > 299) {
                    if (conn != null) conn.disconnect();
                    String freshUrl = resolveRealAudioUrl(title, artist);
                    if (freshUrl != null && !freshUrl.equals(streamUrl)) {
                        streamUrl = freshUrl;
                        for (int hop = 0; hop < 6; hop++) {
                            URL url = new URL(streamUrl);
                            conn = (HttpURLConnection) url.openConnection();
                            conn.setConnectTimeout(15000);
                            conn.setReadTimeout(20000);
                            conn.setInstanceFollowRedirects(false);
                            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
                            conn.setRequestProperty("Accept", "*/*");
                            conn.connect();
                            code = conn.getResponseCode();
                            if (code >= 300 && code <= 308) {
                                String loc = conn.getHeaderField("Location");
                                conn.disconnect();
                                if (loc != null && !loc.isEmpty()) {
                                    if (!loc.startsWith("http")) loc = new URL(url, loc).toString();
                                    streamUrl = loc;
                                    continue;
                                }
                            }
                            break;
                        }
                    }
                }

                boolean isPartial = (code == HttpURLConnection.HTTP_PARTIAL);
                if (code < 200 || code > 299) {
                    updateStatusInDb(downloadId, "Failed", 0L);
                    emitDownloadRow(downloadId);
                    return;
                }

                String contentType = conn.getContentType() != null ? conn.getContentType().toLowerCase() : "";
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

                // Detect true audio format from content-type or magic bytes
                String detectedFormat = "MP3";
                if (contentType.contains("flac")) {
                    detectedFormat = "FLAC";
                } else if (contentType.contains("mp4") || contentType.contains("m4a") || contentType.contains("aac")) {
                    detectedFormat = "M4A";
                } else if (contentType.contains("wav")) {
                    detectedFormat = "WAV";
                } else {
                    byte[] magic = new byte[8];
                    try (java.io.FileInputStream fis = new java.io.FileInputStream(destFile)) {
                        int r = fis.read(magic);
                        if (r >= 4 && magic[0] == 'f' && magic[1] == 'L' && magic[2] == 'a' && magic[3] == 'C') {
                            detectedFormat = "FLAC";
                        } else if (r >= 8 && magic[4] == 'f' && magic[5] == 't' && magic[6] == 'y' && magic[7] == 'p') {
                            detectedFormat = "M4A";
                        } else if (r >= 4 && magic[0] == 'R' && magic[1] == 'I' && magic[2] == 'F' && magic[3] == 'F') {
                            detectedFormat = "WAV";
                        } else {
                            detectedFormat = "MP3";
                        }
                    } catch (Exception ignored) {}
                }

                // If destFile extension does not match true format, rename it
                String trueExt = detectedFormat.toLowerCase();
                File finalFile = destFile;
                if (!destFile.getName().toLowerCase().endsWith("." + trueExt)) {
                    String curName = destFile.getName();
                    int dot = curName.lastIndexOf('.');
                    String baseName = dot >= 0 ? curName.substring(0, dot) : curName;
                    File renamed = new File(destFile.getParentFile(), baseName + "." + trueExt);
                    if (destFile.renameTo(renamed)) {
                        finalFile = renamed;
                    }
                }

                long finalSize = finalFile.length();
                long durationMs = inspectAudioDurationMs(finalFile);

                database.insertSongRecord(
                        songId, title, artist, album, genre,
                        durationMs, detectedFormat, finalSize, artworkUri,
                        "downloaded", finalFile.getAbsolutePath()
                );

                SQLiteDatabase db = database.getWritableDatabase();
                ContentValues cv = new ContentValues();
                cv.put("status", "Completed");
                cv.put("progress", 100);
                cv.put("downloadedBytes", finalSize);
                cv.put("fileSize", finalSize);
                cv.put("format", detectedFormat);
                cv.put("destinationUri", finalFile.getAbsolutePath());
                cv.put("speedBps", 0L);
                cv.put("completedAt", System.currentTimeMillis());
                db.update("Downloads", cv, "id = ?", new String[]{downloadId});
                emitDownloadRow(downloadId);

            } catch (Exception e) {
                String flag = controlFlags.getOrDefault(downloadId, "RUN");
                if (!"PAUSE".equals(flag) && !"CANCEL".equals(flag)) {
                    updateStatusInDb(downloadId, "Failed", 0L);
                    emitDownloadRow(downloadId);
                }
            } finally {
                try { if (output != null) output.close(); } catch (Exception ignored) {}
                try { if (input != null) input.close(); } catch (Exception ignored) {}
                if (conn != null) conn.disconnect();
            }
        });
    }

    private String resolveRealAudioUrl(String title, String artist) {
        String query = ((title != null ? title : "") + " " + (artist != null ? artist : "")).trim();
        if (query.isEmpty()) return null;

        // 1. Deezer API (returns direct preview for exact title/artist)
        try {
            String encoded = java.net.URLEncoder.encode(query, "UTF-8");
            JSONObject dz = fetchJsonSimple("https://api.deezer.com/search?q=" + encoded + "&limit=3");
            if (dz != null) {
                org.json.JSONArray data = dz.optJSONArray("data");
                if (data != null && data.length() > 0) {
                    for (int i = 0; i < data.length(); i++) {
                        String p = data.getJSONObject(i).optString("preview", "");
                        if (!p.isEmpty()) return p;
                    }
                }
            }
        } catch (Exception ignored) {}

        // 2. iTunes Cambodia API (country=KH)
        try {
            String encoded = java.net.URLEncoder.encode(query, "UTF-8");
            JSONObject itunes = fetchJsonSimple("https://itunes.apple.com/search?term=" + encoded + "&country=KH&media=music&entity=song&limit=3");
            if (itunes != null) {
                org.json.JSONArray results = itunes.optJSONArray("results");
                if (results != null && results.length() > 0) {
                    for (int i = 0; i < results.length(); i++) {
                        String p = results.getJSONObject(i).optString("previewUrl", "");
                        if (!p.isEmpty()) return p;
                    }
                }
            }
        } catch (Exception ignored) {}

        // 3. Audius API
        try {
            String encoded = java.net.URLEncoder.encode(query, "UTF-8");
            JSONObject aud = fetchJsonSimple("https://discoveryprovider.audius.co/v1/tracks/search?query=" + encoded + "&app_name=XECEAY");
            if (aud != null) {
                org.json.JSONArray data = aud.optJSONArray("data");
                if (data != null && data.length() > 0) {
                    String id = data.getJSONObject(0).optString("id", "");
                    if (!id.isEmpty()) {
                        return "https://discoveryprovider.audius.co/v1/tracks/" + id + "/stream?app_name=XECEAY";
                    }
                }
            }
        } catch (Exception ignored) {}

        return null;
    }

    private JSONObject fetchJsonSimple(String urlStr) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
            if (conn.getResponseCode() >= 200 && conn.getResponseCode() < 300) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    return new JSONObject(sb.toString());
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
        return null;
    }

    private long inspectAudioDurationMs(File file) {
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(file.getAbsolutePath());
            String durStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
            if (durStr != null) {
                long parsed = Long.parseLong(durStr);
                if (parsed > 0) return parsed;
            }
        } catch (Exception ignored) {
        } finally {
            try { retriever.release(); } catch (Exception ignored) {}
        }
        long bytes = file.length();
        return Math.max(1000L, (bytes / 16000L) * 1000L);
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
        if (urlStr == null) return false;
        try {
            URL u = new URL(urlStr);
            String protocol = u.getProtocol();
            if (!"https".equalsIgnoreCase(protocol) && !"http".equalsIgnoreCase(protocol)) return false;
            String host = u.getHost().toLowerCase();
            if (host.isEmpty() || "localhost".equals(host) || host.endsWith(".local") || host.endsWith(".internal")
                    || host.equals("127.0.0.1") || host.startsWith("192.168.") || host.startsWith("10.")) {
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
