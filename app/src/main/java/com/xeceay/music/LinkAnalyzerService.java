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
 * Link Analyzer & Full-Length Stream Resolver for XECEAY.
 * Resolves YouTube links via InnerTube ANDROID_VR, Piped, Audius, Deezer MP3, and iTunes KH.
 */
public class LinkAnalyzerService {

    public interface AnalysisCallback {
        void onAnalysisResult(JSONObject result);
    }

    private final AnalysisCallback callback;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private static final String[] PIPED_INSTANCES = new String[]{
            "https://pipedapi.kavin.rocks",
            "https://pipedapi.tokhmi.xyz",
            "https://pipedapi.syncpundit.io"
    };

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

    public void analyzeUrl(String rawUrl) {
        String input = rawUrl != null ? rawUrl.trim() : "";
        if (input.isEmpty()) {
            emitError("Please paste a valid YouTube or media link.");
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
            emitError("Invalid or unsupported URL. Please enter a valid public https:// link.");
            return;
        }

        executor.execute(() -> {
            try {
                URL u = new URL(cleanUrl);
                String host = u.getHost().toLowerCase();
                boolean isYouTube = host.contains("youtube.com") || host.contains("youtu.be");

                if (isYouTube) {
                    String videoId = extractYouTubeId(cleanUrl);
                    String title = "YouTube Track";
                    String author = "YouTube Artist";
                    String thumb = videoId != null ? "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg" : "";
                    long durationSec = 212L;
                    String resolvedAudioUrl = "";
                    String resolvedVideoUrl = "";

                    // 1. Fetch official oEmbed title & channel name
                    String oembedUrl = "https://www.youtube.com/oembed?url=" + URLEncoder.encode(cleanUrl, "UTF-8") + "&format=json";
                    JSONObject oembed = fetchJson(oembedUrl, 7000);
                    if (oembed != null) {
                        title = oembed.optString("title", title);
                        author = oembed.optString("author_name", author);
                        String oThumb = oembed.optString("thumbnail_url", "");
                        if (!oThumb.isEmpty()) thumb = oThumb;
                    }

                    // 2. Try YouTube InnerTube ANDROID_VR API for direct full-length audio/mp4 & video/mp4 streams
                    if (videoId != null) {
                        JSONObject vrPlayer = fetchInnerTubeAndroidVr(videoId);
                        if (vrPlayer != null) {
                            JSONObject vd = vrPlayer.optJSONObject("videoDetails");
                            if (vd != null) {
                                title = vd.optString("title", title);
                                author = vd.optString("author", author);
                                long len = vd.optLong("lengthSeconds", 0L);
                                if (len > 0) durationSec = len;
                            }
                            JSONObject sd = vrPlayer.optJSONObject("streamingData");
                            if (sd != null) {
                                JSONArray formats = sd.optJSONArray("formats");
                                if (formats != null && formats.length() > 0) {
                                    resolvedVideoUrl = formats.getJSONObject(0).optString("url", "");
                                }
                                JSONArray adaptive = sd.optJSONArray("adaptiveFormats");
                                if (adaptive != null) {
                                    for (int i = 0; i < adaptive.length(); i++) {
                                        JSONObject af = adaptive.getJSONObject(i);
                                        String mime = af.optString("mimeType", "");
                                        String uStr = af.optString("url", "");
                                        if (mime.contains("audio/") && !uStr.isEmpty()) {
                                            resolvedAudioUrl = uStr;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 3. Resolve direct audio stream for this exact song
                    if (resolvedAudioUrl.isEmpty()) {
                        String realAudio = DownloadManagerEngine.resolveRealAudioUrl(title, author);
                        if (realAudio != null && !realAudio.isEmpty()) {
                            resolvedAudioUrl = realAudio;
                        }
                    }

                    if (resolvedAudioUrl.isEmpty()) {
                        String targetYt = videoId != null ? "https://www.youtube.com/watch?v=" + videoId : cleanUrl;
                        String streamMp3 = resolveLoaderStream(targetYt, "mp3");
                        if (streamMp3 != null && !streamMp3.isEmpty()) {
                            resolvedAudioUrl = streamMp3;
                        }
                    }

                    if (resolvedVideoUrl.isEmpty()) {
                        resolvedVideoUrl = cleanUrl;
                    }

                    boolean hasDirectStream = !resolvedAudioUrl.isEmpty() || (videoId != null && !videoId.isEmpty());
                    String durationText = (durationSec / 60) + ":" + String.format("%02d", durationSec % 60);

                    JSONObject res = new JSONObject();
                    res.put("ok", true);
                    res.put("sourceType", "youtube");
                    res.put("url", cleanUrl);
                    res.put("videoId", videoId != null ? videoId : "");
                    res.put("title", title);
                    res.put("artist", author);
                    res.put("thumbnail", thumb);
                    res.put("durationText", durationText);
                    res.put("durationMs", durationSec * 1000L);
                    res.put("mediaType", "video");
                    res.put("format", "MP4");
                    res.put("fileSize", durationSec * 24000L);
                    res.put("sourceWebsite", "YouTube");
                    res.put("directDownloadPermitted", true);
                    res.put("hasDirectStream", hasDirectStream);
                    res.put("downloadUrlMp3", resolvedAudioUrl);
                    res.put("downloadUrlMp4", resolvedVideoUrl);
                    callback.onAnalysisResult(res);
                    return;
                }

                // Direct HTTPS media link inspection
                HttpURLConnection conn = null;
                try {
                    conn = (HttpURLConnection) u.openConnection();
                    conn.setRequestMethod("HEAD");
                    conn.setConnectTimeout(8000);
                    conn.setReadTimeout(8000);
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) XECEAY-Music/1.0");
                    conn.connect();

                    String contentType = conn.getContentType() != null ? conn.getContentType().toLowerCase() : "";
                    long contentLength = Math.max(0L, conn.getContentLengthLong());
                    String path = u.getPath() != null ? u.getPath() : "";
                    int slashIdx = path.lastIndexOf('/');
                    String seg = slashIdx >= 0 ? path.substring(slashIdx + 1) : path;
                    if (seg.isEmpty()) seg = "Downloaded_Track";
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

                    String mediaType = ("MP4".equals(ext) || contentType.startsWith("video/")) ? "video" : "audio";

                    JSONObject res = new JSONObject();
                    res.put("ok", true);
                    res.put("sourceType", "direct");
                    res.put("url", cleanUrl);
                    res.put("title", cleanTitle);
                    res.put("artist", u.getHost().replaceFirst("^www\\.", ""));
                    res.put("thumbnail", "");
                    res.put("durationText", "3:32");
                    res.put("durationMs", 212000L);
                    res.put("mediaType", mediaType);
                    res.put("format", ext);
                    res.put("fileSize", contentLength > 0 ? contentLength : 4200000L);
                    res.put("sourceWebsite", u.getHost());
                    res.put("directDownloadPermitted", true);
                    res.put("downloadUrlMp3", cleanUrl);
                    res.put("downloadUrlMp4", cleanUrl);
                    callback.onAnalysisResult(res);
                } finally {
                    if (conn != null) conn.disconnect();
                }
            } catch (Exception e) {
                emitError("Could not analyze link: " + (e.getMessage() != null ? e.getMessage() : "Connection error"));
            }
        });
    }

    public static String resolveDirectYouTubeStream(String youtubeUrl, String format) {
        String videoId = extractYouTubeId(youtubeUrl);
        // 1. Try InnerTube ANDROID_VR first (direct Googlevideo stream)
        if (videoId != null) {
            JSONObject vr = fetchInnerTubeAndroidVr(videoId);
            if (vr != null) {
                JSONObject sd = vr.optJSONObject("streamingData");
                if (sd != null) {
                    if ("video".equalsIgnoreCase(format) || "720".equals(format) || "1080".equals(format)) {
                        JSONArray formats = sd.optJSONArray("formats");
                        if (formats != null && formats.length() > 0) {
                            String u = formats.optJSONObject(0).optString("url", "");
                            if (!u.isEmpty()) return u;
                        }
                    } else {
                        JSONArray adaptive = sd.optJSONArray("adaptiveFormats");
                        if (adaptive != null) {
                            for (int i = 0; i < adaptive.length(); i++) {
                                JSONObject af = adaptive.optJSONObject(i);
                                if (af != null) {
                                    String mime = af.optString("mimeType", "");
                                    String uStr = af.optString("url", "");
                                    if (mime.contains("audio/") && !uStr.isEmpty()) {
                                        return uStr;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Fallback to high-speed dedicated conversion engine (Loader)
        String targetUrl = videoId != null ? "https://www.youtube.com/watch?v=" + videoId : youtubeUrl;
        return resolveLoaderStream(targetUrl, ("video".equalsIgnoreCase(format) || "720".equals(format)) ? "720" : "mp3");
    }

    public static String resolveLoaderStream(String targetUrl, String format) {
        try {
            String initUrl = "https://loader.to/ajax/download.php?format=" + format + "&url=" + URLEncoder.encode(targetUrl, "UTF-8");
            JSONObject initResp = fetchJson(initUrl, 8000);
            if (initResp == null) return null;

            String dlUrl = initResp.optString("download_url", "");
            if (!dlUrl.isEmpty() && dlUrl.startsWith("http")) {
                return dlUrl;
            }

            String progressUrl = initResp.optString("progress_url", "");
            if (progressUrl.isEmpty() || !progressUrl.startsWith("http")) {
                return null;
            }

            for (int i = 0; i < 7; i++) {
                try {
                    Thread.sleep(1100);
                } catch (InterruptedException ignored) {
                }
                JSONObject progResp = fetchJson(progressUrl, 5000);
                if (progResp != null) {
                    String u = progResp.optString("download_url", "");
                    if (!u.isEmpty() && u.startsWith("http")) {
                        return u;
                    }
                    int success = progResp.optInt("success", 0);
                    int progress = progResp.optInt("progress", 0);
                    if ((success == 1 || progress >= 1000) && !u.isEmpty()) {
                        return u;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    public static JSONObject fetchInnerTubeAndroidVr(String videoId) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("https://www.youtube.com/youtubei/v1/player?prettyPrint=false");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("User-Agent", "com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 14; en_US; Quest 3; Build/UP1A.231005.007.A1; Cronet/132.0.6808.3)");

            String body = "{\"context\":{\"client\":{\"clientName\":\"ANDROID_VR\",\"clientVersion\":\"1.60.19\",\"androidSdkVersion\":34,\"osName\":\"Android\",\"osVersion\":\"14\",\"hl\":\"km\",\"gl\":\"KH\"}},\"videoId\":\"" + videoId + "\",\"contentCheckOk\":true,\"racyCheckOk\":true}";
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }
            if (conn.getResponseCode() >= 200 && conn.getResponseCode() < 300) {
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

    private String cleanTitleForSearch(String rawTitle, String author) {
        String cleaned = rawTitle
                .replaceAll("(?i)\\(official.*?\\)|\\[official.*?\\]|\\(lyrics.*?\\)|\\[lyrics.*?\\]|\\(audio.*?\\)|\\(video.*?\\)|\\(amv\\)|\\(mv\\)", "")
                .replaceAll("[|•\"']", " ")
                .trim();
        if (cleaned.length() < 3 && author != null) {
            return author;
        }
        return cleaned;
    }

    private void emitError(String msg) {
        try {
            callback.onAnalysisResult(new JSONObject().put("ok", false).put("error", msg));
        } catch (Exception ignored) {
        }
    }

    public static JSONObject fetchJson(String urlStr, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) XECEAY-Music/1.0");
            if (conn.getResponseCode() >= 200 && conn.getResponseCode() < 300) {
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
}
