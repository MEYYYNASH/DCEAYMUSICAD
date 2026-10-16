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
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class GitHubAutoUpdater {

    public interface UpdateCallback {
        void onUpdateEvent(JSONObject payload);
    }

    private final Context context;
    private final UpdateCallback callback;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private volatile boolean cancelRequested = false;
    private File lastDownloadedApk = null;

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

            obj.put("appName", "XECEAY");
            obj.put("packageName", context.getPackageName());
            obj.put("versionName", pkgInfo.versionName != null ? pkgInfo.versionName : "1.0.1");
            obj.put("versionCode", vCode);
            obj.put("canInstallPackages", canInstall);
        } catch (Exception ignored) {
        }
        return obj;
    }

    public void checkGitHubRelease(String repoSlug) {
        String cleanSlug = repoSlug != null ? repoSlug.trim() : "MEYYYNASH/XECEAY";
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
            emitError("check_error", "Invalid GitHub repository format. Use 'owner/repo' (e.g. MEYYYNASH/XECEAY).");
            return;
        }

        final String targetSlug = cleanSlug;
        try {
            callback.onUpdateEvent(new JSONObject().put("type", "checking").put("repo", targetSlug));
        } catch (Exception ignored) {
        }

        executor.execute(() -> {
            try {
                String installedVersion = getInstalledVersionInfo().optString("versionName", "1.0.1");
                String latestUrl = "https://api.github.com/repos/" + targetSlug + "/releases/latest";
                JSONObject releaseJson = fetchJsonObject(latestUrl);

                if (releaseJson == null) {
                    JSONArray allReleases = fetchJsonArray("https://api.github.com/repos/" + targetSlug + "/releases");
                    if (allReleases != null && allReleases.length() > 0) {
                        releaseJson = allReleases.getJSONObject(0);
                    }
                }

                // If no GitHub release exists yet, the installed app is up to date
                if (releaseJson == null) {
                    JSONObject evt = new JSONObject();
                    evt.put("type", "up_to_date");
                    evt.put("repo", targetSlug);
                    evt.put("installedVersion", installedVersion);
                    evt.put("tagName", "v" + installedVersion);
                    evt.put("isNewer", false);
                    callback.onUpdateEvent(evt);
                    return;
                }

                String tagName = releaseJson.optString("tag_name", "v" + installedVersion);
                String releaseTitle = releaseJson.optString("name", tagName);
                String body = releaseJson.optString("body", "");
                String publishedAt = releaseJson.optString("published_at", "");

                String apkUrl = "";
                String apkName = "";
                long apkSize = 0L;
                JSONArray assets = releaseJson.optJSONArray("assets");
                if (assets != null) {
                    for (int i = 0; i < assets.length(); i++) {
                        JSONObject asset = assets.getJSONObject(i);
                        String name = asset.optString("name", "");
                        if (name.toLowerCase().endsWith(".apk")) {
                            apkName = name;
                            apkUrl = asset.optString("browser_download_url", "");
                            apkSize = asset.optLong("size", 0L);
                            break;
                        }
                    }
                }

                boolean isNewer = compareVersions(tagName, installedVersion) > 0 && !apkUrl.isEmpty();

                if (!isNewer) {
                    JSONObject evt = new JSONObject();
                    evt.put("type", "up_to_date");
                    evt.put("repo", targetSlug);
                    evt.put("installedVersion", installedVersion);
                    evt.put("tagName", tagName);
                    evt.put("isNewer", false);
                    callback.onUpdateEvent(evt);
                    return;
                }

                JSONObject evt = new JSONObject();
                evt.put("type", "release_info");
                evt.put("repo", targetSlug);
                evt.put("tagName", tagName);
                evt.put("releaseTitle", releaseTitle);
                evt.put("changelog", body);
                evt.put("publishedAt", publishedAt);
                evt.put("apkName", apkName);
                evt.put("apkUrl", apkUrl);
                evt.put("apkSize", apkSize);
                evt.put("installedVersion", installedVersion);
                evt.put("isNewer", true);
                callback.onUpdateEvent(evt);
            } catch (Exception e) {
                emitError("check_error", "Unable to check updates: " + (e.getMessage() != null ? e.getMessage() : "Network error"));
            }
        });
    }

    public void downloadAndInstallApk(String apkUrl, final boolean autoTriggerInstall) {
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
                File targetApk = new File(updatesDir, "XECEAY-update.apk");
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
                conn.setReadTimeout(25000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent", "XECEAY-Android-Updater/1.0");
                conn.setRequestProperty("Accept", "application/octet-stream,*/*");
                conn.connect();

                int code = conn.getResponseCode();
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
                    byte[] buf = new byte[16 * 1024];
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

                lastDownloadedApk = targetApk;
                callback.onUpdateEvent(
                        new JSONObject()
                                .put("type", "download_complete")
                                .put("progress", 100)
                                .put("apkPath", targetApk.getAbsolutePath())
                                .put("apkSize", targetApk.length())
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
        File target = apkFile != null ? apkFile : (lastDownloadedApk != null ? lastDownloadedApk : new File(updatesDir, "XECEAY-update.apk"));
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
                                    .put("message", "Please enable 'Allow from this source' for XECEAY, then tap 'Install Update Now'.")
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

    private void emitError(String type, String message) {
        try {
            callback.onUpdateEvent(new JSONObject().put("type", type).put("error", message));
        } catch (Exception ignored) {
        }
    }

    private JSONObject fetchJsonObject(String urlStr) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setRequestProperty("User-Agent", "XECEAY-Music-Android/1.0");
            if (conn.getResponseCode() >= 200 && conn.getResponseCode() < 300) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line).append('\n');
                    return new JSONObject(sb.toString());
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
        return null;
    }

    private JSONArray fetchJsonArray(String urlStr) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(urlStr).openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setRequestProperty("User-Agent", "XECEAY-Music-Android/1.0");
            if (conn.getResponseCode() >= 200 && conn.getResponseCode() < 300) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line).append('\n');
                    return new JSONArray(sb.toString());
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
