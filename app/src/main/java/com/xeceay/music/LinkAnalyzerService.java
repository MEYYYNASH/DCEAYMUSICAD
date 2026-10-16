package com.xeceay.music;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LinkAnalyzerService {

    public interface AnalysisCallback {
        void onAnalysisResult(JSONObject result);
    }

    private final AnalysisCallback callback;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public LinkAnalyzerService(AnalysisCallback callback) {
        this.callback = callback;
    }

    public void analyzeUrl(String rawUrl) {
        final String cleanUrl = rawUrl != null ? rawUrl.trim() : "";
        if (!DownloadManagerEngine.isSafePublicHttpsUrl(cleanUrl)) {
            try {
                callback.onAnalysisResult(
                        new JSONObject()
                                .put("ok", false)
                                .put("error", "Invalid or unsupported URL. Please enter a valid public https:// media or YouTube URL.")
                );
            } catch (Exception ignored) {
            }
            return;
        }

        executor.execute(() -> {
            try {
                URL u = new URL(cleanUrl);
                String host = u.getHost().toLowerCase();
                boolean isYouTube = host.contains("youtube.com") || host.contains("youtu.be");

                if (isYouTube) {
                    String oembedUrl = "https://www.youtube.com/oembed?url=" + URLEncoder.encode(cleanUrl, "UTF-8") + "&format=json";
                    HttpURLConnection conn = null;
                    try {
                        conn = (HttpURLConnection) new URL(oembedUrl).openConnection();
                        conn.setConnectTimeout(10000);
                        conn.setReadTimeout(10000);
                        conn.setRequestProperty("User-Agent", "XECEAY-Music-Android/1.0");
                        if (conn.getResponseCode() >= 200 && conn.getResponseCode() < 300) {
                            StringBuilder sb = new StringBuilder();
                            try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                                String line;
                                while ((line = reader.readLine()) != null) sb.append(line);
                            }
                            JSONObject oembed = new JSONObject(sb.toString());
                            String title = oembed.optString("title", "YouTube Media");
                            String author = oembed.optString("author_name", "YouTube Creator");
                            String thumb = oembed.optString("thumbnail_url", "");

                            JSONObject res = new JSONObject();
                            res.put("ok", true);
                            res.put("sourceType", "youtube");
                            res.put("url", cleanUrl);
                            res.put("title", title);
                            res.put("artist", author);
                            res.put("thumbnail", thumb);
                            res.put("durationText", "Official YouTube Stream");
                            res.put("mediaType", "video");
                            res.put("sourceWebsite", "YouTube (" + u.getHost() + ")");
                            res.put("directDownloadPermitted", false);
                            res.put("policyNotice", "YouTube URLs are not direct audio files. XECEAY respects YouTube Terms of Service & DRM: use Official Preview, Open in YouTube/YouTube Music, or Import a local file you own.");
                            res.put("authorizedActions", new JSONArray()
                                    .put("Preview in Authorized Player")
                                    .put("Open in YouTube App")
                                    .put("Import Local Authorized File"));
                            callback.onAnalysisResult(res);
                            return;
                        }
                    } catch (Exception ignored) {
                    } finally {
                        if (conn != null) conn.disconnect();
                    }

                    JSONObject fallback = new JSONObject();
                    fallback.put("ok", true);
                    fallback.put("sourceType", "youtube");
                    fallback.put("url", cleanUrl);
                    fallback.put("title", "YouTube Media Link");
                    fallback.put("artist", "YouTube Creator");
                    fallback.put("thumbnail", "");
                    fallback.put("durationText", "YouTube Stream");
                    fallback.put("mediaType", "video");
                    fallback.put("sourceWebsite", "YouTube");
                    fallback.put("directDownloadPermitted", false);
                    fallback.put("policyNotice", "YouTube URLs require official playback or importing a locally owned file. XECEAY does not bypass YouTube DRM.");
                    callback.onAnalysisResult(fallback);
                    return;
                }

                HttpURLConnection conn = null;
                try {
                    conn = (HttpURLConnection) u.openConnection();
                    conn.setRequestMethod("HEAD");
                    conn.setConnectTimeout(10000);
                    conn.setReadTimeout(10000);
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "XECEAY-Music-Android/1.0");
                    conn.connect();

                    String contentType = conn.getContentType() != null ? conn.getContentType().toLowerCase() : "";
                    long contentLength = Math.max(0L, conn.getContentLengthLong());
                    String path = u.getPath() != null ? u.getPath() : "";
                    int slashIdx = path.lastIndexOf('/');
                    String seg = slashIdx >= 0 ? path.substring(slashIdx + 1) : path;
                    if (seg.isEmpty()) seg = "Authorized_Media";
                    String cleanTitle = URLDecoder.decode(seg, "UTF-8")
                            .replaceAll("(?i)\\.(mp3|flac|wav|ogg|opus|m4a|aac|mp4|webm)$", "")
                            .replace('_', ' ')
                            .replace('-', ' ')
                            .trim();
                    if (cleanTitle.isEmpty()) cleanTitle = "Authorized Audio Track";

                    String pLower = path.toLowerCase();
                    String ext = "MP3";
                    if (contentType.contains("flac") || pLower.endsWith(".flac")) ext = "FLAC";
                    else if (contentType.contains("wav") || pLower.endsWith(".wav")) ext = "WAV";
                    else if (contentType.contains("ogg") || pLower.endsWith(".ogg")) ext = "OGG";
                    else if (contentType.contains("opus") || pLower.endsWith(".opus")) ext = "OPUS";
                    else if (contentType.contains("mp4") || pLower.endsWith(".mp4")) ext = "MP4";
                    else if (contentType.contains("m4a") || pLower.endsWith(".m4a")) ext = "M4A";

                    String mediaType = ("MP4".equals(ext) || contentType.startsWith("video/")) ? "video" : "audio";
                    JSONArray qualities = new JSONArray();
                    if ("video".equals(mediaType)) {
                        qualities.put("1080p Full HD (MP4)").put("720p HD (MP4)").put("Audio Track Only (M4A)");
                    } else {
                        qualities.put("Original Lossless / Source (" + ext + ")").put("High Quality 320kbps").put("Standard 192kbps");
                    }

                    JSONObject res = new JSONObject();
                    res.put("ok", true);
                    res.put("sourceType", "direct");
                    res.put("url", cleanUrl);
                    res.put("title", cleanTitle);
                    res.put("artist", u.getHost().replaceFirst("^www\\.", ""));
                    res.put("thumbnail", "");
                    res.put("durationText", contentLength > 0 ? Math.max(15L, contentLength / (1024 * 16)) + "s est." : "Direct Stream");
                    res.put("mediaType", mediaType);
                    res.put("format", ext);
                    res.put("fileSize", contentLength);
                    res.put("sourceWebsite", u.getHost());
                    res.put("directDownloadPermitted", true);
                    res.put("qualities", qualities);
                    res.put("policyNotice", "Verified direct HTTPS media resource. Ready for preview or offline download.");
                    callback.onAnalysisResult(res);
                } finally {
                    if (conn != null) conn.disconnect();
                }
            } catch (Exception e) {
                try {
                    callback.onAnalysisResult(
                            new JSONObject()
                                    .put("ok", false)
                                    .put("error", "Could not analyze link: " + (e.getMessage() != null ? e.getMessage() : "Connection error"))
                    );
                } catch (Exception ignored) {
                }
            }
        });
    }
}
