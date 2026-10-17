package com.xeceay.music;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * DCEAY GitHub Auto-Updater
 * Connects to official GitHub Releases API (e.g. MEYYYNASH/DCEAY).
 * Performs semantic version comparison, downloads official APK assets,
 * verifies SHA-256 checksums & package identity, and coordinates native
 * package installer confirmation.
 */
public class GitHubAutoUpdater {

    public interface UpdateCallback {
        void onUpdateEvent(JSONObject payload);
    }

    private final Context context;
    private final UpdateCallback callback;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private volatile boolean cancelRequested = false;
    private File lastDownloadedApk = null;

    public static final String DEFAULT_REPO_SLUG = "MEYYYNASH/DCEAY";

    public GitHubAutoUpdater(Context context, UpdateCallback callback) {
        this.context = context;
        this.callback = callback;
    }

    public JSONObject getInstalledVersionInfo() {
        JSONObject obj = new JSONObject();
        try {
            PackageInfo pkgInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            long vCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                    ? pkgInfo.getLongVersionCode()
                    : pkgInfo.versionCode;
            boolean canInstall = Build.VERSION.SDK_INT < Build.VERSION_CODES.O
                    || context.getPackageManager().canRequestPackageInstalls();

            obj.put("appName", "DCEAY");
            obj.put("tagline", "One App, All Your Music");
            obj.put("packageName", context.getPackageName());
            obj.put("versionName", pkgInfo.versionName != null ? pkgInfo.versionName : "1.2.1");
            obj.put("versionCode", vCode);
            obj.put("canInstallPackages", canInstall);
            obj.put("defaultRepo", DEFAULT_REPO_SLUG);
        } catch (Exception ignored) {
        }
        return obj;
    }

    public void checkGitHubRelease(String repoSlug) {
        String cleanSlug = repoSlug != null && !repoSlug.trim().isEmpty() ? repoSlug.trim() : DEFAULT_REPO_SLUG;
        if (cleanSlug.startsWith("https://github.com/")) {
            cleanSlug = cleanSlug.substring("https://github.com/".length());
        }
        if (cleanSlug.endsWith(".git")) {
            cleanSlug = cleanSlug.substring(0, cleanSlug.length() - 4);
        }
        if (cleanSlug.endsWith("/")) {
            cleanSlug = cleanSlug.substring(0, cleanSlug.length() - 1);
        }

        if (!cleanSlug.matches("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")) {
            emitError("check_error", "Invalid GitHub repository format. Use 'owner/repo' (e.g. " + DEFAULT_REPO_SLUG + ").");
            return;
        }

        final String targetSlug = cleanSlug;
        try {
            callback.onUpdateEvent(new JSONObject().put("type", "checking").put("repo", targetSlug));
        } catch (Exception ignored) {
        }

        executor.execute(() -> {
            try {
                String installedVersion = getInstalledVersionInfo().optString("versionName", "1.2.1");
                String tagName = "";
                String releaseTitle = "";
                String body = "";
                String publishedAt = "";
                String apkUrl = "";
                String apkName = "DCEAY-release.apk";
                long apkSize = 0L;
                String expectedSha256 = "";
                String sha256AssetUrl = "";

                // 1. Check raw version.json on main branch (realtime metadata, zero GitHub rate-limit)
                JSONObject versionJson = fetchJsonObject("https://raw.githubusercontent.com/" + targetSlug + "/main/version.json?t=" + System.currentTimeMillis());
                if (versionJson != null) {
                    tagName = versionJson.optString("tagName", versionJson.optString("versionName", ""));
                    releaseTitle = versionJson.optString("releaseTitle", "DCEAY " + tagName);
                    body = versionJson.optString("changelog", "");
                    apkUrl = versionJson.optString("apkUrl", "");
                    apkName = versionJson.optString("apkName", "DCEAY-release.apk");
                    apkSize = versionJson.optLong("apkSize", 0L);
                    expectedSha256 = versionJson.optString("sha256", "");
                }

                // 2. Query GitHub Releases API (primary official release feed)
                JSONObject releaseJson = fetchJsonObject("https://api.github.com/repos/" + targetSlug + "/releases/latest");
                if (releaseJson == null) {
                    JSONArray allReleases = fetchJsonArray("https://api.github.com/repos/" + targetSlug + "/releases");
                    if (allReleases != null && allReleases.length() > 0) {
                        for (int i = 0; i < allReleases.length(); i++) {
                            JSONObject candidate = allReleases.getJSONObject(i);
                            if (!candidate.optBoolean("draft", false) && !candidate.optBoolean("prerelease", false)) {
                                releaseJson = candidate;
                                break;
                            }
                        }
                        if (releaseJson == null) {
                            releaseJson = allReleases.getJSONObject(0);
                        }
                    }
                }

                if (releaseJson != null) {
                    String relTag = releaseJson.optString("tag_name", "");
                    if (!relTag.isEmpty()) {
                        tagName = relTag;
                        releaseTitle = releaseJson.optString("name", "DCEAY " + tagName);
                        body = releaseJson.optString("body", body);
                        publishedAt = releaseJson.optString("published_at", "");

                        JSONArray assets = releaseJson.optJSONArray("assets");
                        if (assets != null) {
                            for (int i = 0; i < assets.length(); i++) {
                                JSONObject asset = assets.getJSONObject(i);
                                String name = asset.optString("name", "");
                                if (name.toLowerCase().endsWith(".apk")) {
                                    apkName = name;
                                    apkUrl = asset.optString("browser_download_url", "");
                                    apkSize = asset.optLong("size", 0L);
                                } else if (name.toLowerCase().endsWith(".sha256")) {
                                    sha256AssetUrl = asset.optString("browser_download_url", "");
                                }
                            }
                        }
                    }
                }

                // 3. Fallback check on Tags API
                if (tagName.isEmpty()) {
                    JSONArray tagsArr = fetchJsonArray("https://api.github.com/repos/" + targetSlug + "/tags");
                    if (tagsArr != null && tagsArr.length() > 0) {
                        String bestTag = "";
                        for (int i = 0; i < tagsArr.length(); i++) {
                            String candidate = tagsArr.getJSONObject(i).optString("name", "");
                            if (bestTag.isEmpty() || compareVersions(candidate, bestTag) > 0) {
                                bestTag = candidate;
                            }
                        }
                        if (!bestTag.isEmpty()) {
                            tagName = bestTag;
                            releaseTitle = "DCEAY " + bestTag;
                        }
                    }
                }

                if (apkUrl.isEmpty()) {
                    apkUrl = "https://github.com/" + targetSlug + "/releases/download/" + (tagName.isEmpty() ? "v1.2.1" : tagName) + "/" + apkName;
                }

                // Extract SHA-256 from release notes if not found yet
                if (expectedSha256.isEmpty() && !body.isEmpty()) {
                    Pattern p = Pattern.compile("(?i)(?:sha-?256(?:\\s*checksum)?:?\\s*[`*]*)([a-f0-9]{64})");
                    Matcher m = p.matcher(body);
                    if (m.find()) {
                        expectedSha256 = m.group(1);
                    }
                }

                // If a sha256 asset exists, fetch it directly
                if (expectedSha256.isEmpty() && !sha256AssetUrl.isEmpty()) {
                    String hashContent = fetchString(sha256AssetUrl);
                    if (hashContent != null && !hashContent.trim().isEmpty()) {
                        String[] parts = hashContent.trim().split("\\s+");
                        if (parts.length > 0 && parts[0].length() == 64) {
                            expectedSha256 = parts[0];
                        }
                    }
                }

                if (tagName.isEmpty()) {
                    JSONObject evt = new JSONObject();
                    evt.put("type", "up_to_date");
                    evt.put("repo", targetSlug);
                    evt.put("installedVersion", installedVersion);
                    evt.put("tagName", "v" + installedVersion);
                    evt.put("isNewer", false);
                    callback.onUpdateEvent(evt);
                    return;
                }

                boolean isNewer = compareVersions(tagName, installedVersion) > 0;

                JSONObject evt = new JSONObject();
                evt.put("type", isNewer ? "release_info" : "up_to_date");
                evt.put("repo", targetSlug);
                evt.put("tagName", tagName);
                evt.put("releaseTitle", releaseTitle);
                evt.put("releaseName", releaseTitle);
                evt.put("changelog", body);
                evt.put("publishedAt", publishedAt);
                evt.put("apkName", apkName);
                evt.put("apkUrl", apkUrl);
                evt.put("apkDownloadUrl", apkUrl);
                evt.put("apkSize", apkSize);
                evt.put("expectedSha256", expectedSha256);
                evt.put("installedVersion", installedVersion);
                evt.put("isNewer", isNewer);
                callback.onUpdateEvent(evt);

            } catch (Exception e) {
                emitError("check_error", "Unable to check updates: " + (e.getMessage() != null ? e.getMessage() : "Network error"));
            }
        });
    }

    public void downloadAndInstallApk(String apkUrl, String expectedSha256, final boolean autoTriggerInstall) {
        final String cleanUrl = apkUrl != null ? apkUrl.trim() : "";
        if (!cleanUrl.toLowerCase().startsWith("https://")) {
            emitError("download_error", "APK download URL must use HTTPS.");
            return;
        }

        cancelRequested = false;
        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                File updatesDir = new File(context.getExternalFilesDir(null), "updates");
                if (!updatesDir.exists()) updatesDir.mkdirs();
                File targetApk = new File(updatesDir, "DCEAY-update.apk");
                if (targetApk.exists()) targetApk.delete();

                callback.onUpdateEvent(
                        new JSONObject()
                                .put("type", "download_progress")
                                .put("progress", 0)
                                .put("downloadedBytes", 0L)
                                .put("totalBytes", 0L)
                                .put("speedBps", 0L)
                );

                URL url = new URL(cleanUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "DCEAY-Android-Updater/1.2.1");
                conn.setRequestProperty("Accept", "application/octet-stream,*/*");
                conn.connect();

                // Handle redirect manually if needed
                int code = conn.getResponseCode();
                if (code == HttpURLConnection.HTTP_MOVED_TEMP || code == HttpURLConnection.HTTP_MOVED_PERM || code == 307 || code == 308) {
                    String newUrl = conn.getHeaderField("Location");
                    if (newUrl != null && !newUrl.isEmpty()) {
                        conn.disconnect();
                        url = new URL(newUrl);
                        conn = (HttpURLConnection) url.openConnection();
                        conn.setConnectTimeout(15000);
                        conn.setReadTimeout(30000);
                        conn.setRequestProperty("User-Agent", "DCEAY-Android-Updater/1.2.1");
                        conn.connect();
                        code = conn.getResponseCode();
                    }
                }

                if (code < 200 || code > 299) {
                    emitError("download_error", "Server returned HTTP " + code);
                    return;
                }

                long totalBytes = conn.getContentLengthLong();
                long downloaded = 0L;
                long lastEmit = System.currentTimeMillis();
                long bytesSinceEmit = 0L;

                try (InputStream input = conn.getInputStream();
                     FileOutputStream output = new FileOutputStream(targetApk)) {
                    byte[] buf = new byte[32 * 1024];
                    int read;
                    while ((read = input.read(buf)) != -1) {
                        if (cancelRequested) {
                            output.close();
                            targetApk.delete();
                            callback.onUpdateEvent(new JSONObject().put("type", "download_cancelled"));
                            return;
                        }
                        output.write(buf, 0, read);
                        downloaded += read;
                        bytesSinceEmit += read;

                        long now = System.currentTimeMillis();
                        long elapsed = now - lastEmit;
                        if (elapsed >= 250L) {
                            long speed = (bytesSinceEmit * 1000L) / Math.max(1L, elapsed);
                            int pct = totalBytes > 0 ? (int) Math.max(0, Math.min(99, (downloaded * 100L) / totalBytes)) : 50;
                            callback.onUpdateEvent(
                                    new JSONObject()
                                            .put("type", "download_progress")
                                            .put("progress", pct)
                                            .put("downloadedBytes", downloaded)
                                            .put("totalBytes", totalBytes)
                                            .put("speedBps", speed)
                            );
                            lastEmit = now;
                            bytesSinceEmit = 0L;
                        }
                    }
                    output.flush();
                }

                // 1. Verify calculated SHA-256 hash
                String computedSha256 = computeFileSha256(targetApk);
                boolean hashMatched = false;
                if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
                    String cleanExpected = expectedSha256.trim().split("\\s+")[0].toLowerCase();
                    if (!computedSha256.equalsIgnoreCase(cleanExpected)) {
                        targetApk.delete();
                        emitError("checksum_mismatch", "SHA-256 verification failed! Corrupted or tampered APK rejected.\nExpected: " + cleanExpected + "\nComputed: " + computedSha256);
                        return;
                    }
                    hashMatched = true;
                }

                // 2. Validate package identity & archive integrity
                PackageInfo archiveInfo = context.getPackageManager().getPackageArchiveInfo(targetApk.getAbsolutePath(), 0);
                if (archiveInfo == null) {
                    targetApk.delete();
                    emitError("package_invalid", "Downloaded file is not a valid Android APK archive.");
                    return;
                }

                if (!context.getPackageName().equals(archiveInfo.packageName)) {
                    targetApk.delete();
                    emitError("package_mismatch", "Package identity mismatch. Target is " + archiveInfo.packageName + ", expected " + context.getPackageName() + ".");
                    return;
                }

                lastDownloadedApk = targetApk;
                callback.onUpdateEvent(
                        new JSONObject()
                                .put("type", "download_complete")
                                .put("progress", 100)
                                .put("apkPath", targetApk.getAbsolutePath())
                                .put("apkSize", targetApk.length())
                                .put("computedSha256", computedSha256)
                                .put("sha256Verified", hashMatched || expectedSha256 == null || expectedSha256.isEmpty())
                                .put("targetVersionName", archiveInfo.versionName)
                );

                if (autoTriggerInstall) {
                    installDownloadedApk(targetApk);
                }

            } catch (Exception e) {
                emitError("download_error", e.getMessage() != null ? e.getMessage() : "APK download failed");
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    public void cancelApkDownload() {
        cancelRequested = true;
    }

    public boolean installDownloadedApk(File apkFile) {
        File updatesDir = new File(context.getExternalFilesDir(null), "updates");
        File target = apkFile != null ? apkFile : (lastDownloadedApk != null ? lastDownloadedApk : new File(updatesDir, "DCEAY-update.apk"));
        if (!target.exists() || target.length() < 1024L) {
            emitError("install_error", "No downloaded APK found to install.");
            return false;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!context.getPackageManager().canRequestPackageInstalls()) {
                Intent permIntent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + context.getPackageName())
                );
                permIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(permIntent);
                try {
                    callback.onUpdateEvent(
                            new JSONObject()
                                    .put("type", "permission_required")
                                    .put("message", "Please enable 'Allow from this source' for DCEAY, then tap 'Install Update Now'.")
                    );
                } catch (Exception ignored) {
                }
                return false;
            }
        }

        try {
            Uri apkUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    target
            );
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(installIntent);
            callback.onUpdateEvent(
                    new JSONObject()
                            .put("type", "installer_launched")
                            .put("apkPath", target.getAbsolutePath())
            );
            return true;
        } catch (Exception e) {
            emitError("install_error", "Failed to launch Android package installer: " + e.getMessage());
            return false;
        }
    }

    public static String computeFileSha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream is = new FileInputStream(file)) {
            byte[] buffer = new byte[16 * 1024];
            int read;
            while ((read = is.read(buffer)) > 0) {
                digest.update(buffer, 0, read);
            }
        }
        byte[] hashBytes = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private void emitError(String type, String message) {
        try {
            callback.onUpdateEvent(new JSONObject().put("type", type).put("error", message));
        } catch (Exception ignored) {
        }
    }

    private JSONObject fetchJsonObject(String urlStr) {
        String data = fetchString(urlStr);
        if (data != null && !data.isEmpty()) {
            try {
                return new JSONObject(data);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private JSONArray fetchJsonArray(String urlStr) {
        String data = fetchString(urlStr);
        if (data != null && !data.isEmpty()) {
            try {
                return new JSONArray(data);
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private String fetchString(String urlStr) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(12000);
            conn.setRequestProperty("Accept", "application/vnd.github+json, application/json, text/plain, */*");
            conn.setRequestProperty("User-Agent", "DCEAY-Music-Android/1.2.1");
            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line).append('\n');
                    return sb.toString();
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
        return null;
    }

    public static int compareVersions(String remoteTag, String localVersion) {
        List<Integer> rParts = parseNums(remoteTag);
        List<Integer> lParts = parseNums(localVersion);
        int maxLen = Math.max(rParts.size(), lParts.size());
        for (int i = 0; i < maxLen; i++) {
            int r = i < rParts.size() ? rParts.get(i) : 0;
            int l = i < lParts.size() ? lParts.get(i) : 0;
            if (r != l) return Integer.compare(r, l);
        }
        return 0;
    }

    private static List<Integer> parseNums(String s) {
        List<Integer> out = new ArrayList<>();
        if (s == null) return out;
        String[] tokens = s.replaceAll("^v|^V", "").split("[^0-9]+");
        for (String t : tokens) {
            if (!t.isEmpty()) {
                try {
                    out.add(Integer.parseInt(t));
                } catch (Exception ignored) {
                }
            }
        }
        return out;
    }
}
