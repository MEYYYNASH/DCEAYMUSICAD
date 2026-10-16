package com.xeceay.music;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import android.util.Base64;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private XeceayDatabase database;
    private AudioPlayerEngine playerEngine;
    private DownloadManagerEngine downloadManager;
    private GitHubAutoUpdater githubUpdater;
    private LinkAnalyzerService linkAnalyzer;
    private MusicCatalogService catalogService;

    private final ActivityResultLauncher<String[]> permissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(),
            result -> {
                int count = database.scanDeviceMediaStore();
                try {
                    pushEventToUi("media_scanned", new JSONObject().put("importedCount", count));
                } catch (Exception ignored) {
                }
            }
    );

    private String pendingArtworkSongId = null;

    private final ActivityResultLauncher<String[]> filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.OpenDocument(),
            uri -> {
                if (uri != null) {
                    try {
                        getContentResolver().takePersistableUriPermission(
                                uri,
                                Intent.FLAG_GRANT_READ_URI_PERMISSION
                        );
                    } catch (Exception ignored) {
                    }
                    importPickedUri(uri, false);
                }
            }
    );

    private final ActivityResultLauncher<String[]> imagePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.OpenDocument(),
            uri -> {
                if (uri != null && pendingArtworkSongId != null) {
                    try {
                        getContentResolver().takePersistableUriPermission(
                                uri,
                                Intent.FLAG_GRANT_READ_URI_PERMISSION
                        );
                    } catch (Exception ignored) {
                    }
                    saveCustomArtwork(pendingArtworkSongId, uri);
                }
            }
    );

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final Thread.UncaughtExceptionHandler defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            if (thread != getMainLooper().getThread()) {
                return;
            }
            if (defaultHandler != null) {
                defaultHandler.uncaughtException(thread, throwable);
            }
        });

        database = new XeceayDatabase(getApplicationContext());
        database.initializeDefaultData();

        playerEngine = new AudioPlayerEngine(getApplicationContext(), database, stateJson -> pushEventToUi("player_state", stateJson));
        downloadManager = new DownloadManagerEngine(getApplicationContext(), database, dlJson -> pushEventToUi("download_update", dlJson));
        githubUpdater = new GitHubAutoUpdater(getApplicationContext(), updateJson -> pushEventToUi("github_update", updateJson));
        linkAnalyzer = new LinkAnalyzerService(analysisJson -> pushEventToUi("link_analysis", analysisJson));
        catalogService = new MusicCatalogService(searchJson -> pushEventToUi("catalog_results", searchJson));

        MusicPlaybackService.actionCallback = action -> runOnUiThread(() -> {
            if (MusicPlaybackService.ACTION_TOGGLE.equals(action)) {
                playerEngine.togglePlayPause();
            } else if (MusicPlaybackService.ACTION_NEXT.equals(action)) {
                evaluateJs("window.XeceayApp && window.XeceayApp.nextTrack()");
            } else if (MusicPlaybackService.ACTION_PREV.equals(action)) {
                evaluateJs("window.XeceayApp && window.XeceayApp.prevTrack()");
            }
        });

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF0D1017);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return false;
                String url = request.getUrl().toString();
                if (url.startsWith("file:///android_asset/")) {
                    return false;
                }
                // Allow iframe embeds (such as YouTube player) to load inside WebView without opening external browser
                if (!request.isForMainFrame() || url.contains("youtube.com/embed") || url.contains("youtube-nocookie.com/embed")) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignored) {
                }
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                handleIncomingIntent(getIntent());
            }
        });

        webView.addJavascriptInterface(new XeceayBridge(), "XeceayNative");

        FrameLayout rootContainer = new FrameLayout(this);
        rootContainer.setBackgroundColor(0xFF0F1218);
        int initialTopInset = getStatusBarHeight();
        rootContainer.setPadding(0, initialTopInset, 0, 0);
        rootContainer.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        ViewCompat.setOnApplyWindowInsetsListener(rootContainer, (v, windowInsets) -> {
            Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            int topPad = Math.max(insets.top, getStatusBarHeight());
            v.setPadding(insets.left, topPad, insets.right, insets.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        setContentView(rootContainer);

        try {
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), rootContainer);
            if (controller != null) {
                controller.setAppearanceLightStatusBars(false);
                controller.setAppearanceLightNavigationBars(false);
            }
        } catch (Exception ignored) {
        }

        webView.loadUrl("file:///android_asset/index.html");

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                webView.evaluateJavascript(
                        "(function(){ return window.XeceayApp ? window.XeceayApp.handleBackPress() : false; })()",
                        result -> {
                            if (!"true".equals(result)) {
                                moveTaskToBack(true);
                            }
                        }
                );
            }
        });

        requestAudioAndNotificationPermissionsIfNeeded();
    }

    private int getStatusBarHeight() {
        int result = 0;
        int resourceId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resourceId > 0) {
            result = getResources().getDimensionPixelSize(resourceId);
        }
        if (result <= 0) {
            result = Math.round(28 * getResources().getDisplayMetrics().density);
        }
        return result;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_SEND.equals(action)) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null && !sharedText.trim().isEmpty()) {
                try {
                    pushEventToUi("shared_link", new JSONObject().put("sharedText", sharedText.trim()));
                } catch (Exception ignored) {
                }
            }
        } else if (Intent.ACTION_VIEW.equals(action)) {
            Uri data = intent.getData();
            if (data != null) {
                importPickedUri(data, true);
            }
        }
    }

    private void importPickedUri(Uri uri, boolean autoPlay) {
        try {
            String displayName = "Imported Audio";
            long fileSize = 0L;
            try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE);
                    if (nameIdx != -1 && cursor.getString(nameIdx) != null) displayName = cursor.getString(nameIdx);
                    if (sizeIdx != -1) fileSize = cursor.getLong(sizeIdx);
                }
            }

            int dotIdx = displayName.lastIndexOf('.');
            String title = dotIdx > 0 ? displayName.substring(0, dotIdx) : displayName;
            String ext = dotIdx > 0 ? displayName.substring(dotIdx + 1).toUpperCase() : "MP3";
            String artist = "Imported File";
            String album = "Local Storage";
            long durationMs = 180_000L;

            MediaMetadataRetriever retriever = new MediaMetadataRetriever();
            try {
                retriever.setDataSource(this, uri);
                String t = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_TITLE);
                if (t != null && !t.trim().isEmpty()) title = t;
                String a = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ARTIST);
                if (a != null && !a.trim().isEmpty()) artist = a;
                String al = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_ALBUM);
                if (al != null && !al.trim().isEmpty()) album = al;
                String d = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
                if (d != null) durationMs = Long.parseLong(d);
            } catch (Exception ignored) {
            } finally {
                try { retriever.release(); } catch (Exception ignored) {}
            }

            String songId = "imported_" + System.currentTimeMillis();
            String art = XeceayDatabase.buildGradientArtworkDataUri(title, artist, "#8B5CF6", "#22D3EE");

            database.insertSongRecord(
                    songId, title, artist, album, "Local Music",
                    durationMs, ext, fileSize, art, "local", uri.toString()
            );

            pushEventToUi("file_imported", new JSONObject()
                    .put("songId", songId)
                    .put("title", title)
                    .put("autoPlay", autoPlay));

            if (autoPlay) {
                playerEngine.loadAndPlay(songId, title, artist, album, art, uri.toString(), 0);
            }
        } catch (Exception ignored) {
        }
    }

    private void saveCustomArtwork(String songId, Uri uri) {
        try {
            File artDir = new File(getFilesDir(), "custom_art");
            if (!artDir.exists()) artDir.mkdirs();
            File dest = new File(artDir, "art_" + songId + ".jpg");

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                if (in != null) {
                    android.graphics.Bitmap bmp = android.graphics.BitmapFactory.decodeStream(in);
                    if (bmp != null) {
                        int maxDim = 600;
                        int w = bmp.getWidth();
                        int h = bmp.getHeight();
                        if (w > maxDim || h > maxDim) {
                            float scale = Math.min((float) maxDim / w, (float) maxDim / h);
                            w = Math.round(w * scale);
                            h = Math.round(h * scale);
                            bmp = android.graphics.Bitmap.createScaledBitmap(bmp, w, h, true);
                        }
                        bmp.compress(android.graphics.Bitmap.CompressFormat.JPEG, 85, baos);
                        try (FileOutputStream out = new FileOutputStream(dest)) {
                            out.write(baos.toByteArray());
                        }
                    }
                }
            }

            byte[] imageBytes = baos.toByteArray();
            String localArtUri;
            if (imageBytes.length > 0) {
                localArtUri = "data:image/jpeg;base64," + Base64.encodeToString(imageBytes, Base64.NO_WRAP);
            } else {
                localArtUri = Uri.fromFile(dest).toString();
            }

            database.updateSongArtwork(songId, localArtUri);
            pushEventToUi("artwork_updated", new JSONObject()
                    .put("songId", songId)
                    .put("artworkUri", localArtUri));
        } catch (Exception ignored) {
        }
    }

    private void requestAudioAndNotificationPermissionsIfNeeded() {
        List<String> perms = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                perms.add(Manifest.permission.READ_MEDIA_AUDIO);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                perms.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                perms.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
        }
        if (!perms.isEmpty()) {
            permissionLauncher.launch(perms.toArray(new String[0]));
        } else {
            database.scanDeviceMediaStore();
        }
    }

    private void pushEventToUi(final String eventType, final JSONObject payload) {
        runOnUiThread(() -> {
            try {
                JSONObject wrapper = new JSONObject();
                wrapper.put("eventType", eventType);
                wrapper.put("payload", payload);
                evaluateJs("window.XeceayApp && window.XeceayApp.onNativeEvent(" + wrapper.toString() + ")");
            } catch (Exception ignored) {
            }
        });
    }

    private void evaluateJs(String script) {
        if (webView != null) {
            webView.evaluateJavascript(script, null);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (isFinishing() && playerEngine != null) {
            playerEngine.release();
        }
    }

    public class XeceayBridge {

        @JavascriptInterface
        public String getBootstrapData() {
            try {
                JSONObject obj = new JSONObject();
                obj.put("versionInfo", githubUpdater.getInstalledVersionInfo());
                obj.put("user", database.getUserJson());
                obj.put("songs", database.getAllSongsJson());
                obj.put("playlists", database.getPlaylistsJson());
                obj.put("downloads", database.getDownloadsJson());
                obj.put("storage", database.getStorageBreakdownJson());
                obj.put("playerState", playerEngine.getCurrentStateJson());
                return obj.toString();
            } catch (Exception e) {
                return "{}";
            }
        }

        @JavascriptInterface
        public void searchCatalog(String query, String requestType) {
            catalogService.searchCatalog(query, requestType);
        }

        @JavascriptInterface
        public String getClipboardText() {
            try {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null && cm.hasPrimaryClip()) {
                    ClipData clip = cm.getPrimaryClip();
                    if (clip != null && clip.getItemCount() > 0) {
                        CharSequence cs = clip.getItemAt(0).coerceToText(MainActivity.this);
                        if (cs != null) return cs.toString();
                    }
                }
            } catch (Exception ignored) {
            }
            return "";
        }

        @JavascriptInterface
        public void playSong(String songId, String title, String artist, String album, String artworkUri, String sourceRef, int startPosMs) {
            runOnUiThread(() -> playerEngine.loadAndPlay(songId, title, artist, album, artworkUri, sourceRef, startPosMs));
        }

        @JavascriptInterface
        public boolean togglePlayPause() {
            return playerEngine.togglePlayPause();
        }

        @JavascriptInterface
        public void seekTo(int positionMs) {
            runOnUiThread(() -> playerEngine.seekTo(positionMs));
        }

        @JavascriptInterface
        public void setVolume(float volume) {
            runOnUiThread(() -> playerEngine.setVolume(volume));
        }

        @JavascriptInterface
        public void setSpeed(float speed) {
            runOnUiThread(() -> playerEngine.setSpeed(speed));
        }

        @JavascriptInterface
        public void setEqualizer(String presetName, String bandsJson, int bassStrength) {
            runOnUiThread(() -> {
                int[] bands = null;
                try {
                    JSONArray arr = new JSONArray(bandsJson);
                    bands = new int[5];
                    for (int i = 0; i < 5; i++) bands[i] = arr.optInt(i, 0);
                } catch (Exception ignored) {
                }
                playerEngine.setEqualizerPreset(presetName, bands, bassStrength);
            });
        }

        @JavascriptInterface
        public void setSleepTimer(int minutes) {
            runOnUiThread(() -> playerEngine.setSleepTimerMinutes(minutes));
        }

        @JavascriptInterface
        public boolean toggleFavorite(String songId) {
            return database.toggleFavorite(songId);
        }

        @JavascriptInterface
        public String createPlaylist(String name) {
            return database.createPlaylist(name);
        }

        @JavascriptInterface
        public void renamePlaylist(String playlistId, String newName) {
            database.renamePlaylist(playlistId, newName);
        }

        @JavascriptInterface
        public void deletePlaylist(String playlistId) {
            database.deletePlaylist(playlistId);
        }

        @JavascriptInterface
        public boolean togglePinPlaylist(String playlistId) {
            return database.togglePinPlaylist(playlistId);
        }

        @JavascriptInterface
        public void addSongToPlaylist(String playlistId, String songId) {
            database.addSongToPlaylist(playlistId, songId);
        }

        @JavascriptInterface
        public void removeSongFromPlaylist(String playlistId, String songId) {
            database.removeSongFromPlaylist(playlistId, songId);
        }

        @JavascriptInterface
        public void updateSongTags(String songId, String title, String artist, String album, String genre) {
            database.updateSongMetadata(songId, title, artist, album, genre);
        }

        @JavascriptInterface
        public void pickSongArtwork(String songId) {
            pendingArtworkSongId = songId;
            runOnUiThread(() -> imagePickerLauncher.launch(new String[]{"image/*"}));
        }

        @JavascriptInterface
        public void updateSongArtwork(String songId, String artworkUri) {
            database.updateSongArtwork(songId, artworkUri);
            try {
                pushEventToUi("artwork_updated", new JSONObject()
                        .put("songId", songId)
                        .put("artworkUri", artworkUri));
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public boolean deleteSong(String songId) {
            return database.deleteSongAndFile(songId);
        }

        @JavascriptInterface
        public int scanLocalMusic() {
            return database.scanDeviceMediaStore();
        }

        @JavascriptInterface
        public void openLocalFilePicker() {
            runOnUiThread(() -> filePickerLauncher.launch(new String[]{"audio/*", "video/mp4"}));
        }

        @JavascriptInterface
        public String enqueueDownload(String title, String artist, String album, String genre, String artworkUri, String sourceUrl, String format, String quality, String mediaType) {
            return downloadManager.enqueueDownload(title, artist, album, genre, artworkUri, sourceUrl, format, quality, mediaType).toString();
        }

        @JavascriptInterface
        public void pauseDownload(String downloadId) {
            downloadManager.pauseDownload(downloadId);
        }

        @JavascriptInterface
        public void resumeDownload(String downloadId) {
            downloadManager.resumeDownload(downloadId);
        }

        @JavascriptInterface
        public void cancelDownload(String downloadId) {
            downloadManager.cancelDownload(downloadId);
        }

        @JavascriptInterface
        public void retryDownload(String downloadId) {
            downloadManager.retryDownload(downloadId);
        }

        @JavascriptInterface
        public void deleteDownload(String downloadId, boolean deleteFile) {
            downloadManager.deleteDownloadRecord(downloadId, deleteFile);
        }

        @JavascriptInterface
        public void analyzeLink(String url) {
            linkAnalyzer.analyzeUrl(url);
        }

        @JavascriptInterface
        public void openExternalUrl(String url) {
            runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void checkGitHubUpdate(String repoSlug) {
            githubUpdater.checkGitHubRelease(repoSlug);
        }

        @JavascriptInterface
        public void downloadAndInstallGitHubApk(String apkUrl, boolean autoInstall) {
            githubUpdater.downloadAndInstallApk(apkUrl, autoInstall);
        }

        @JavascriptInterface
        public void cancelGitHubApkDownload() {
            githubUpdater.cancelApkDownload();
        }

        @JavascriptInterface
        public boolean installDownloadedApkNow() {
            return githubUpdater.installDownloadedApk(null);
        }

        @JavascriptInterface
        public String getStorageInfo() {
            return database.getStorageBreakdownJson().toString();
        }

        @JavascriptInterface
        public String exportCloudSync() {
            return database.exportCloudSyncBundle();
        }

        @JavascriptInterface
        public int importCloudSync(String jsonStr) {
            return database.importCloudSyncBundle(jsonStr);
        }

        @JavascriptInterface
        public void saveUserProfile(String displayName, String email, String preferencesJson) {
            database.updateUserProfile(displayName, email, preferencesJson);
        }

        @JavascriptInterface
        public boolean clearAppCache() {
            try {
                File cacheDir = getCacheDir();
                if (cacheDir != null && cacheDir.isDirectory()) {
                    deleteDir(cacheDir);
                }
                File externalCacheDir = getExternalCacheDir();
                if (externalCacheDir != null && externalCacheDir.isDirectory()) {
                    deleteDir(externalCacheDir);
                }
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        private boolean deleteDir(File dir) {
            if (dir != null && dir.isDirectory()) {
                String[] children = dir.list();
                if (children != null) {
                    for (String child : children) {
                        boolean success = deleteDir(new File(dir, child));
                        if (!success) {
                            return false;
                        }
                    }
                }
                return dir.delete();
            } else if (dir != null && dir.isFile()) {
                return dir.delete();
            } else {
                return false;
            }
        }
    }
}
