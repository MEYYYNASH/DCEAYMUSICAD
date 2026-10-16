package com.xeceay.music;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Khmer & Global Music Catalog Search Service.
 * Queries Cambodia (country=KH) iTunes Server, Deezer Khmer/Global MP3 Server,
 * and Audius Full-Track Server with built-in Khmer Unicode <-> Sing-Khmer transliteration.
 */
public class MusicCatalogService {

    public interface SearchCallback {
        void onSearchResults(JSONObject result);
    }

    private final SearchCallback callback;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    private static final String[][] KHMER_DICTIONARY = new String[][]{
            {"khmer", "VannDa Tena Suly Pheng វណ្ណដា បទខ្មែរ"},
            {"khmer song", "VannDa Tena Suly Pheng វណ្ណដា ថេណា"},
            {"khmer music", "VannDa Tena Suly Pheng Sinn Sisamouth"},
            {"បទខ្មែរ", "VannDa វណ្ណដា ថេណា Suly Pheng"},
            {"ចម្រៀងខ្មែរ", "VannDa Suly Pheng Tena ស៊ីន ស៊ីសាមុត"},
            {"បទសេដ", "Suly Pheng Tena Khmer Sad Song"},
            {"vannda", "VannDa វណ្ណដា"},
            {"វណ្ណដា", "VannDa វណ្ណដា"},
            {"tena", "Tena ថេណា"},
            {"ថេណា", "Tena ថេណា"},
            {"suly pheng", "Suly Pheng ស៊ូលីផេង"},
            {"sulypheng", "Suly Pheng ស៊ូលីផេង"},
            {"ស៊ូលីផេង", "Suly Pheng ស៊ូលីផេង"},
            {"sinn sisamouth", "Sinn Sisamouth ស៊ីន ស៊ីសាមុត"},
            {"sin sisamuth", "Sinn Sisamouth ស៊ីន ស៊ីសាមុត"},
            {"ស៊ីន ស៊ីសាមុត", "Sinn Sisamouth ស៊ីន ស៊ីសាមុត"},
            {"g-devith", "G-Devith Dit Way"},
            {"g devith", "G-Devith Dit Way"},
            {"ជី ដេវីត", "G-Devith"},
            {"khemarak", "Khemarak Sereymon ខេមរៈ សិរីមន្ត"},
            {"ខេមរៈ", "Khemarak Sereymon ខេមរៈ សិរីមន្ត"},
            {"ខេមរៈ សិរីមន្ត", "Khemarak Sereymon ខេមរៈ សិរីមន្ត"},
            {"meas soksophea", "Meas Soksophea មាស សុខសោភា"},
            {"មាស សុខសោភា", "Meas Soksophea មាស សុខសោភា"},
            {"pich solika", "Pich Solika ពេជ្រ សូលីកា"},
            {"ពេជ្រ សូលីកា", "Pich Solika ពេជ្រ សូលីកា"},
            {"preap sovath", "Preap Sovath ព្រាប សុវត្ថិ"},
            {"ព្រាប សុវត្ថិ", "Preap Sovath ព្រាប សុវត្ថិ"},
            {"kmeng khmer", "Kmeng Khmer ក្មេងខ្មែរ"},
            {"ក្មេងខ្មែរ", "Kmeng Khmer ក្មេងខ្មែរ"},
            {"chen", "Chen ចេន Khmer"},
            {"ចេន", "Chen ចេន"},
            {"noly", "Noly Record ណូលី"},
            {"ណូលី", "Noly Record"},
            {"chhin ratanak", "Chhin Ratanak ឈិន រតនៈ"},
            {"ឈិន រតនៈ", "Chhin Ratanak"}
    };

    public MusicCatalogService(SearchCallback callback) {
        this.callback = callback;
    }

    public static String expandKhmerQuery(String rawQuery) {
        if (rawQuery == null || rawQuery.trim().isEmpty()) {
            return "VannDa Tena Suly Pheng";
        }
        String q = rawQuery.trim();
        String lower = q.toLowerCase();
        for (String[] pair : KHMER_DICTIONARY) {
            if (lower.equals(pair[0])) {
                return pair[1];
            }
        }
        return q;
    }

    public void searchCatalog(final String query, final String requestType) {
        final String rawClean = (query == null || query.trim().isEmpty()) ? "VannDa Khmer" : query.trim();
        final String expandedQuery = expandKhmerQuery(rawClean);

        executor.execute(() -> {
            java.util.List<JSONObject> list = new java.util.ArrayList<>();
            Set<String> seenKeys = new HashSet<>();

            try {
                // 1. Deezer Cambodia / Global MP3 Catalog
                fetchDeezerTracks(rawClean, list, seenKeys);
                if (!expandedQuery.equalsIgnoreCase(rawClean) && list.size() < 12) {
                    fetchDeezerTracks(expandedQuery, list, seenKeys);
                }

                // 2. iTunes Cambodia Server (country=KH)
                fetchItunesCambodiaTracks(rawClean, list, seenKeys);
                if (!expandedQuery.equalsIgnoreCase(rawClean) && list.size() < 20) {
                    fetchItunesCambodiaTracks(expandedQuery, list, seenKeys);
                }

                // 3. Audius Full-Track Streaming Server
                if (list.size() < 25) {
                    fetchAudiusFullTracks(rawClean, list, seenKeys);
                }
            } catch (Exception ignored) {
            }

            // Sort by relevance score against the user's raw query
            final String qLower = rawClean.toLowerCase();
            java.util.Collections.sort(list, (a, b) -> {
                int scoreA = computeRelevanceScore(a.optString("title", ""), a.optString("artist", ""), qLower);
                int scoreB = computeRelevanceScore(b.optString("title", ""), b.optString("artist", ""), qLower);
                return Integer.compare(scoreB, scoreA);
            });

            JSONArray results = new JSONArray();
            for (JSONObject item : list) {
                results.put(item);
            }

            try {
                JSONObject payload = new JSONObject();
                payload.put("query", rawClean);
                payload.put("requestType", requestType != null ? requestType : "search");
                payload.put("results", results);
                callback.onSearchResults(payload);
            } catch (Exception ignored) {
            }
        });
    }

    private static int computeRelevanceScore(String title, String artist, String query) {
        if (query == null || query.isEmpty()) return 0;
        String t = (title != null ? title : "").toLowerCase();
        String a = (artist != null ? artist : "").toLowerCase();
        if (t.equals(query)) return 1000;
        if (t.startsWith(query)) return 800;
        if (t.contains(query)) return 500;
        if (a.equals(query)) return 400;
        if (a.startsWith(query)) return 300;
        if (a.contains(query)) return 200;
        return 0;
    }

    private void fetchDeezerTracks(String term, java.util.List<JSONObject> out, Set<String> seenKeys) {
        try {
            String encoded = URLEncoder.encode(term, "UTF-8");
            String deezerUrl = "https://api.deezer.com/search?q=" + encoded + "&limit=18";
            JSONObject dzData = fetchJson(deezerUrl);
            if (dzData == null) return;
            JSONArray arr = dzData.optJSONArray("data");
            if (arr == null) return;

            for (int i = 0; i < arr.length(); i++) {
                JSONObject r = arr.getJSONObject(i);
                String previewUrl = r.optString("preview", "");
                if (previewUrl.isEmpty()) continue;

                JSONObject artistObj = r.optJSONObject("artist");
                JSONObject albumObj = r.optJSONObject("album");
                String title = r.optString("title", "Track");
                String artist = artistObj != null ? artistObj.optString("name", "Artist") : "Artist";
                String album = albumObj != null ? albumObj.optString("title", "Single") : "Single";
                String art = albumObj != null ? albumObj.optString("cover_big", "") : "";
                if (art.isEmpty() && albumObj != null) {
                    art = albumObj.optString("cover_medium", "");
                }

                String dedupKey = (title + "|" + artist).toLowerCase();
                if (seenKeys.contains(dedupKey)) continue;
                seenKeys.add(dedupKey);

                long durSec = Math.max(30L, r.optLong("duration", 205L));
                long durMs = durSec * 1000L;

                JSONObject item = new JSONObject();
                item.put("id", "dz_" + r.optLong("id", System.currentTimeMillis() + i));
                item.put("title", title);
                item.put("artist", artist);
                item.put("album", album);
                item.put("genre", "Khmer & Global");
                item.put("duration", durMs);
                item.put("previewDuration", 30000L);
                item.put("isPreview", true);
                item.put("format", "MP3");
                item.put("quality", "320kbps");
                item.put("fileSize", 480000L);
                item.put("artworkUri", art);
                item.put("sourceReference", previewUrl);
                item.put("downloadable", true);
                out.add(item);
            }
        } catch (Exception ignored) {
        }
    }

    private void fetchItunesCambodiaTracks(String term, java.util.List<JSONObject> out, Set<String> seenKeys) {
        try {
            String encoded = URLEncoder.encode(term, "UTF-8");
            String itunesUrl = "https://itunes.apple.com/search?term=" + encoded + "&country=KH&media=music&entity=song&limit=18";
            JSONObject itunesData = fetchJson(itunesUrl);
            if (itunesData == null) return;
            JSONArray arr = itunesData.optJSONArray("results");
            if (arr == null) return;

            for (int i = 0; i < arr.length(); i++) {
                JSONObject r = arr.getJSONObject(i);
                String previewUrl = r.optString("previewUrl", "");
                if (previewUrl.isEmpty()) continue;

                long trackId = r.optLong("trackId", System.currentTimeMillis() + i);
                String title = r.optString("trackName", "Unknown Track");
                String artist = r.optString("artistName", "Artist");
                String album = r.optString("collectionName", "Single");
                String genre = r.optString("primaryGenreName", "Khmer Music");
                long durationMs = Math.max(30000L, r.optLong("trackTimeMillis", 210000L));
                String art = r.optString("artworkUrl100", "").replace("100x100bb", "400x400bb");

                String dedupKey = (title + "|" + artist).toLowerCase();
                if (seenKeys.contains(dedupKey)) continue;
                seenKeys.add(dedupKey);

                JSONObject item = new JSONObject();
                item.put("id", "kh_" + trackId);
                item.put("title", title);
                item.put("artist", artist);
                item.put("album", album);
                item.put("genre", genre);
                item.put("duration", durationMs);
                item.put("previewDuration", 30000L);
                item.put("isPreview", true);
                item.put("format", "M4A");
                item.put("quality", "256kbps AAC");
                item.put("fileSize", 480000L);
                item.put("artworkUri", art);
                item.put("sourceReference", previewUrl);
                item.put("downloadable", true);
                out.add(item);
            }
        } catch (Exception ignored) {
        }
    }

    private void fetchAudiusFullTracks(String term, java.util.List<JSONObject> out, Set<String> seenKeys) {
        try {
            String encoded = URLEncoder.encode(term, "UTF-8");
            String audiusUrl = "https://discoveryprovider.audius.co/v1/tracks/search?query=" + encoded + "&app_name=XECEAY";
            JSONObject audData = fetchJson(audiusUrl);
            if (audData == null) return;
            JSONArray arr = audData.optJSONArray("data");
            if (arr == null) return;

            for (int i = 0; i < Math.min(arr.length(), 10); i++) {
                JSONObject r = arr.getJSONObject(i);
                String id = r.optString("id", "");
                if (id.isEmpty()) continue;

                String title = r.optString("title", "Track");
                JSONObject user = r.optJSONObject("user");
                String artist = user != null ? user.optString("name", "Artist") : "Artist";

                String tLow = title.toLowerCase();
                String aLow = artist.toLowerCase();
                String termLow = term.toLowerCase();
                boolean matchesTerm = tLow.contains(termLow) || aLow.contains(termLow)
                        || termLow.contains(tLow) || termLow.contains(aLow);
                if (!matchesTerm) continue;

                JSONObject artwork = r.optJSONObject("artwork");
                String art = artwork != null ? artwork.optString("480x480", artwork.optString("150x150", "")) : "";
                long durSec = Math.max(120L, r.optLong("duration", 195L));
                String streamUrl = "https://discoveryprovider.audius.co/v1/tracks/" + id + "/stream?app_name=XECEAY";

                String dedupKey = (title + "|" + artist).toLowerCase();
                if (seenKeys.contains(dedupKey)) continue;
                seenKeys.add(dedupKey);

                JSONObject item = new JSONObject();
                item.put("id", "aud_" + id);
                item.put("title", title);
                item.put("artist", artist);
                item.put("album", "Full Length Stream");
                item.put("genre", r.optString("genre", "Music"));
                item.put("duration", durSec * 1000L);
                item.put("isPreview", false);
                item.put("isFullTrack", true);
                item.put("format", "MP3");
                item.put("quality", "320kbps");
                item.put("fileSize", durSec * 28000L);
                item.put("artworkUri", art);
                item.put("sourceReference", streamUrl);
                item.put("downloadable", true);
                out.add(item);
            }
        } catch (Exception ignored) {
        }
    }

    private JSONObject fetchJson(String urlStr) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(9000);
            conn.setReadTimeout(9000);
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
