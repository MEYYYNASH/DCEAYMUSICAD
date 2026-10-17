package com.xeceay.music;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * DCEAY Universal Link Engine & Analyzer.
 * Parses and verifies YouTube videos & playlists, Spotify tracks & playlists,
 * direct audio streams (MP3/FLAC/WAV/M4A), and local audio files.
 */
public class LinkAnalyzerService {

    public interface AnalysisCallback {
        void onAnalysisResult(JSONObject result);
    }

    private final AnalysisCallback callback;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public LinkAnalyzerService(AnalysisCallback callback) {
        this.callback = callback;
    }

    public static String extractYouTubeId(String url) {
        if (url == null) return null;
        Pattern p = Pattern.compile("(?:youtu\\.be/|youtube\\.com/(?:watch\\?.*v=|embed/|v/|shorts/|live/))([A-Za-z0-9_-]{11})");
        Matcher m = p.matcher(url);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    public static String extractYouTubePlaylistId(String url) {
        if (url == null) return null;
        Pattern p = Pattern.compile("[?&]list=([A-Za-z0-9_-]+)");
        Matcher m = p.matcher(url);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    public static String extractSpotifyId(String url) {
        if (url == null) return null;
        Pattern p = Pattern.compile("open\\.spotify\\.com/(track|playlist|album)/([a-zA-Z0-9]+)");
        Matcher m = p.matcher(url);
        if (m.find()) {
            return m.group(2);
        }
        return null;
    }

    public static String extractSpotifyType(String url) {
        if (url == null) return null;
        Pattern p = Pattern.compile("open\\.spotify\\.com/(track|playlist|album)/");
        Matcher m = p.matcher(url);
        if (m.find()) {
            return m.group(1);
        }
        return null;
    }

    public void analyzeUrl(String rawUrl) {
        String input = rawUrl != null ? rawUrl.trim() : "";
        if (input.isEmpty()) {
            emitError("Please paste a valid media URL, YouTube link, or Spotify link.");
            return;
        }
        if (!input.startsWith("http://") && !input.startsWith("https://")) {
            input = "https://" + input;
        }
        if (input.startsWith("http://")) {
            input = "https://" + input.substring(7);
        }

        final String cleanUrl = input;
        if (!DownloadManagerEngine.isSafePublicHttpsUrl(cleanUrl)) {
            emitError("Invalid URL. DCEAY only imports secure public https:// links.");
            return;
        }

        executor.execute(() -> {
            try {
                URL u = new URL(cleanUrl);
                String host = u.getHost().toLowerCase();

                // 1. YouTube Link (Video, Short, or Playlist)
                if (host.contains("youtube.com") || host.contains("youtu.be")) {
                    String playlistId = extractYouTubePlaylistId(cleanUrl);
                    String videoId = extractYouTubeId(cleanUrl);

                    if (playlistId != null && !playlistId.isEmpty() && (videoId == null || cleanUrl.contains("/playlist"))) {
                        // YouTube Playlist
                        JSONObject plRes = new JSONObject();
                        plRes.put("ok", true);
                        plRes.put("sourceType", "youtube_playlist");
                        plRes.put("provider", "YouTube Playlist");
                        plRes.put("url", cleanUrl);
                        plRes.put("playlistId", playlistId);
                        plRes.put("title", "YouTube Playlist (" + playlistId + ")");
                        plRes.put("artist", "YouTube Curator");
                        plRes.put("thumbnail", "https://i.ytimg.com/vi_webp/default/hqdefault.webp");
                        plRes.put("durationText", "Curated Collection");
                        plRes.put("isPlaylist", true);
                        plRes.put("canImportToLibrary", true);
                        plRes.put("notes", "Imports available track titles, ordering, and metadata into DCEAY My Library.");
                        callback.onAnalysisResult(plRes);
                        return;
                    }

                    // YouTube Single Video / Audio
                    String title = "YouTube Track";
                    String author = "YouTube Creator";
                    String thumb = videoId != null ? "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg" : "";

                    // Query official YouTube oEmbed for instant title & author
                    String oembedUrl = "https://www.youtube.com/oembed?url=" + URLEncoder.encode(cleanUrl, "UTF-8") + "&format=json";
                    JSONObject oembed = fetchJson(oembedUrl, 3500);
                    if (oembed != null) {
                        title = oembed.optString("title", title);
                        author = oembed.optString("author_name", author);
                        String oThumb = oembed.optString("thumbnail_url", "");
                        if (!oThumb.isEmpty()) thumb = oThumb;
                    }

                    JSONObject res = new JSONObject();
                    res.put("ok", true);
                    res.put("sourceType", "youtube");
                    res.put("provider", "YouTube");
                    res.put("url", cleanUrl);
                    res.put("videoId", videoId != null ? videoId : "");
                    res.put("title", title);
                    res.put("artist", author);
                    res.put("thumbnail", thumb);
                    res.put("durationText", "Full-Length");
                    res.put("mediaType", "video");
                    res.put("format", "MP4");
                    res.put("fileSize", 5200000L);
                    res.put("sourceWebsite", "YouTube");
                    res.put("directDownloadPermitted", true);
                    res.put("hasDirectStream", true);
                    res.put("downloadUrlMp3", cleanUrl);
                    res.put("downloadUrlMp4", cleanUrl);
                    callback.onAnalysisResult(res);
                    return;
                }

                // 2. Spotify Track, Playlist, or Album
                if (host.contains("spotify.com")) {
                    String spType = extractSpotifyType(cleanUrl);
                    String spId = extractSpotifyId(cleanUrl);
                    String title = "Spotify Item";
                    String author = "Spotify Artist";
                    String thumb = "";

                    // Query official Spotify oEmbed API
                    String oembedUrl = "https://open.spotify.com/oembed?url=" + URLEncoder.encode(cleanUrl, "UTF-8");
                    JSONObject oembed = fetchJson(oembedUrl, 4000);
                    if (oembed != null) {
                        title = oembed.optString("title", title);
                        thumb = oembed.optString("thumbnail_url", "");
                    }

                    boolean isPlaylist = "playlist".equals(spType) || "album".equals(spType);

                    JSONObject res = new JSONObject();
                    res.put("ok", true);
                    res.put("sourceType", isPlaylist ? "spotify_playlist" : "spotify_track");
                    res.put("provider", "Spotify " + (spType != null ? spType.substring(0, 1).toUpperCase() + spType.substring(1) : "Link"));
                    res.put("url", cleanUrl);
                    res.put("spotifyId", spId != null ? spId : "");
                    res.put("spotifyType", spType != null ? spType : "track");
                    res.put("title", title);
                    res.put("artist", author);
                    res.put("thumbnail", thumb);
                    res.put("durationText", isPlaylist ? "Playlist Album" : "Single Track");
                    res.put("isPlaylist", isPlaylist);
                    res.put("openExternalUrl", cleanUrl);
                    res.put("canImportToLibrary", true);
                    res.put("notes", "Imports metadata to DCEAY. Playback opens lawfully in Spotify.");
                    callback.onAnalysisResult(res);
                    return;
                }

                // 3. Direct Audio URL (MP3, FLAC, WAV, M4A, OGG, OPUS, AAC)
                HttpURLConnection conn = null;
                try {
                    conn = (HttpURLConnection) u.openConnection();
                    conn.setRequestMethod("HEAD");
                    conn.setConnectTimeout(8000);
                    conn.setReadTimeout(8000);
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) DCEAY-Music/1.2.1");
                    conn.connect();

                    String contentType = conn.getContentType() != null ? conn.getContentType().toLowerCase() : "";
                    long contentLength = Math.max(0L, conn.getContentLengthLong());
                    String path = u.getPath() != null ? u.getPath() : "";
                    int slashIdx = path.lastIndexOf('/');
                    String seg = slashIdx >= 0 ? path.substring(slashIdx + 1) : path;
                    if (seg.isEmpty()) seg = "Direct_Audio";
                    String cleanTitle = URLDecoder.decode(seg, "UTF-8")
                            .replaceAll("(?i)\\.(mp3|flac|wav|ogg|opus|m4a|aac|mp4|webm)$", "")
                            .replace('_', ' ')
                            .replace('-', ' ')
                            .trim();
                    if (cleanTitle.isEmpty()) cleanTitle = "Audio Track";

                    String pLower = path.toLowerCase();
                    String ext = "MP3";
                    if (contentType.contains("flac") || pLower.endsWith(".flac")) ext = "FLAC";
                    else if (contentType.contains("wav") || pLower.endsWith(".wav")) ext = "WAV";
                    else if (contentType.contains("ogg") || pLower.endsWith(".ogg")) ext = "OGG";
                    else if (contentType.contains("opus") || pLower.endsWith(".opus")) ext = "OPUS";
                    else if (contentType.contains("mp4") || pLower.endsWith(".mp4")) ext = "MP4";
                    else if (contentType.contains("m4a") || pLower.endsWith(".m4a")) ext = "M4A";
                    else if (contentType.contains("aac") || pLower.endsWith(".aac")) ext = "AAC";

                    String mediaType = ("MP4".equals(ext) || contentType.startsWith("video/")) ? "video" : "audio";

                    JSONObject res = new JSONObject();
                    res.put("ok", true);
                    res.put("sourceType", "direct");
                    res.put("provider", "Direct " + ext + " Stream");
                    res.put("url", cleanUrl);
                    res.put("title", cleanTitle);
                    res.put("artist", u.getHost().replaceFirst("^www\\.", ""));
                    res.put("thumbnail", "");
                    res.put("durationText", "Direct Stream");
                    res.put("mediaType", mediaType);
                    res.put("format", ext);
                    res.put("fileSize", contentLength > 0 ? contentLength : 4500000L);
                    res.put("sourceWebsite", u.getHost());
                    res.put("directDownloadPermitted", true);
                    res.put("hasDirectStream", true);
                    res.put("downloadUrlMp3", cleanUrl);
                    res.put("downloadUrlMp4", cleanUrl);
                    callback.onAnalysisResult(res);
                } finally {
                    if (conn != null) conn.disconnect();
                }

            } catch (Exception e) {
                emitError("Could not inspect link: " + (e.getMessage() != null ? e.getMessage() : "Network error") + ". You can still open it externally.");
            }
        });
    }

    public static String resolveDirectYouTubeStream(String youtubeUrl, String format) {
        String videoId = extractYouTubeId(youtubeUrl);
        String targetUrl = videoId != null ? "https://www.youtube.com/watch?v=" + videoId : youtubeUrl;
        String fmt = ("video".equalsIgnoreCase(format) || "720".equals(format) || "1080".equals(format) || "MP4".equalsIgnoreCase(format)) ? "720" : "mp3";

        // 1. High-speed audio/video stream resolver
        String stream = resolveLoaderStream(targetUrl, fmt);
        if (stream != null && !stream.isEmpty()) {
            return stream;
        }

        // 2. InnerTube stream fallback
        if (videoId != null) {
            JSONObject vr = fetchInnerTubeAndroidVr(videoId);
            if (vr != null) {
                JSONObject sd = vr.optJSONObject("streamingData");
                if (sd != null) {
                    if ("720".equals(fmt)) {
                        JSONArray formats = sd.optJSONArray("formats");
                        if (formats != null && formats.length() > 0) {
                            String u = formats.optJSONObject(0).optString("url", "");
                            if (!u.isEmpty()) return u;
                        }
                    }
                    JSONArray adaptive = sd.optJSONArray("adaptiveFormats");
                    if (adaptive != null) {
                        for (int i = 0; i < adaptive.length(); i++) {
                            JSONObject f = adaptive.optJSONObject(i);
                            String mime = f != null ? f.optString("mimeType", "") : "";
                            if ("720".equals(fmt) && mime.contains("video/mp4")) {
                                String u = f.optString("url", "");
                                if (!u.isEmpty()) return u;
                            } else if (!"720".equals(fmt) && (mime.contains("audio/mp4") || mime.contains("audio/webm"))) {
                                String u = f.optString("url", "");
                                if (!u.isEmpty()) return u;
                            }
                        }
                    }
                }
            }
        }

        return "";
    }

    public static String resolveLoaderStream(String youtubeUrl, String format) {
        HttpURLConnection conn = null;
        try {
            String apiUrl = "https://loader.to/ajax/download.php?format=" + format + "&url=" + URLEncoder.encode(youtubeUrl, "UTF-8");
            URL url = new URL(apiUrl);
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(10000);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DCEAY/1.2.1");
            conn.setRequestProperty("Accept", "application/json, text/plain, */*");

            if (conn.getResponseCode() == 200) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    JSONObject json = new JSONObject(sb.toString());
                    String downloadUrl = json.optString("download_url", "");
                    if (!downloadUrl.isEmpty()) return downloadUrl;

                    String id = json.optString("id", "");
                    if (!id.isEmpty()) {
                        for (int poll = 0; poll < 10; poll++) {
                            Thread.sleep(800);
                            String progressUrl = "https://loader.to/ajax/progress.php?id=" + id;
                            JSONObject pJson = fetchJson(progressUrl, 5000);
                            if (pJson != null) {
                                String dUrl = pJson.optString("download_url", "");
                                if (!dUrl.isEmpty()) return dUrl;
                                int success = pJson.optInt("success", 0);
                                if (success == 1) {
                                    dUrl = pJson.optString("download_url", "");
                                    if (!dUrl.isEmpty()) return dUrl;
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
        return "";
    }

    private static JSONObject fetchInnerTubeAndroidVr(String videoId) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("https://www.youtube.com/youtubei/v1/player?prettyPrint=false");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "com.google.android.apps.youtube.vr/1.56.21 (Linux; U; Android 12; Quest 2) gzip");
            conn.setDoOutput(true);

            JSONObject body = new JSONObject();
            JSONObject ctx = new JSONObject();
            JSONObject client = new JSONObject();
            client.put("clientName", "ANDROID_VR");
            client.put("clientVersion", "1.56.21");
            client.put("deviceMake", "Oculus");
            client.put("deviceModel", "Quest 2");
            ctx.put("client", client);
            body.put("context", ctx);
            body.put("videoId", videoId);

            byte[] out = body.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(out);
            }

            if (conn.getResponseCode() == 200) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
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

    private static JSONObject fetchJson(String urlStr, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("User-Agent", "DCEAY-Music-Android/1.2.1");
            if (conn.getResponseCode() == 200) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
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

    private void emitError(String message) {
        try {
            JSONObject err = new JSONObject();
            err.put("ok", false);
            err.put("error", message);
            callback.onAnalysisResult(err);
        } catch (Exception ignored) {
        }
    }
}
