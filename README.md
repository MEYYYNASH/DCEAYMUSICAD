# XECEAY — Music Downloader & Offline Player

> **Tagline:** *Your Music. Your Quality. Your World.*  
> **Platforms:** Android (Native APK with In-App GitHub OTA Auto-Updater), Windows Desktop & Web

---

## 1. Key Capabilities

### A. In-App GitHub Release Auto-Updater & APK Self-Installer
- **Native GitHub Releases Check** ([`GitHubAutoUpdater.kt`](app/src/main/java/com/xeceay/music/GitHubAutoUpdater.kt)):
  - Queries `https://api.github.com/repos/{owner}/{repo}/releases/latest` (or `/releases` fallback).
  - Compares the remote semantic tag (`v1.0.1`, `v1.1.0`, etc.) against the installed `PackageInfo.versionName`.
- **In-App APK Downloader**:
  - Downloads the `.apk` release asset directly inside XECEAY into `getExternalFilesDir("updates")/XECEAY-update.apk` with a live progress bar, byte counter, and transfer speed (`KB/s` / `MB/s`).
- **In-App Native Package Installer**:
  - Uses Android `androidx.core.content.FileProvider` (`content://com.xeceay.music.fileprovider/updates/XECEAY-update.apk`) and `Intent.ACTION_VIEW` (`application/vnd.android.package-archive`) to launch the Android System Package Installer directly from the app.
  - Automatically checks `PackageManager.canRequestPackageInstalls()` on Android 8.0+ and guides the user to `Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES` if not yet enabled.
- **GitHub Actions CI/CD Workflow** ([`.github/workflows/release-apk.yml`](.github/workflows/release-apk.yml)):
  - Every push to `main`/`master` or any `v*` tag automatically builds `XECEAY-release.apk` and publishes a GitHub Release so installed apps can auto-update over-the-air.

### B. High-Quality Audio Player & Hardware Equalizer
- **Native Playback Engine** ([`AudioPlayerEngine.kt`](app/src/main/java/com/xeceay/music/AudioPlayerEngine.kt) & [`MusicPlaybackService.kt`](app/src/main/java/com/xeceay/music/MusicPlaybackService.kt)):
  - Supports `MP3`, `FLAC`, `WAV`, `AAC`, `M4A`, `OGG`, and `Opus`.
  - Play/Pause, Previous/Next, interactive seek bar, Shuffle, Repeat (`All`, `One`, `Off`), Playback Speed (`0.5x` – `2.0x`), Volume control, and Sleep Timer.
  - **Hardware 5-Band Equalizer + Sub-Bass Boost** (`60Hz`, `230Hz`, `910Hz`, `3.6kHz`, `14kHz`) with presets: `Normal`, `Bass Boost`, `Treble Boost`, `Vocal`, `Classical`, `Rock`, `Jazz`, `Electronic`, and `Custom`.
  - **Foreground Service & Lock-Screen Media Notification** for uninterrupted background playback.

### C. Offline Music Library & Relational SQLite Database
- **8-Entity SQLite Schema** ([`XeceayDatabase.kt`](app/src/main/java/com/xeceay/music/XeceayDatabase.kt)):
  - `Users`, `Songs`, `Artists`, `Albums`, `Playlists`, `PlaylistSongs`, `Downloads`, and `PlaybackHistory`.
- **100% Offline Operation**:
  - Synthesizes 6 stereo 44.1kHz PCM `.wav` tracks on first launch ([`WavGenerator.kt`](app/src/main/java/com/xeceay/music/WavGenerator.kt)) so offline playback works immediately out of the box.
  - Scans device `MediaStore.Audio.Media` for local music and supports importing any audio/video file via the Android system file picker.
  - Includes **Smart Playlists**, **Metadata Tag Editor**, **Duplicate Cleaner**, and **Storage Manager**.

### D. Multi-Threaded Download Manager & Authorized Link Importer
- **Download Queue Manager** ([`DownloadManagerEngine.kt`](app/src/main/java/com/xeceay/music/DownloadManagerEngine.kt)):
  - Supports `Waiting`, `Downloading`, `Paused`, `Completed`, `Failed`, and `Cancelled` statuses.
  - Uses HTTP `Range` headers for real **Pause and Resume**, transfer speed calculation, ETA, duplicate prevention, and `StatFs` storage checks.
- **YouTube & Direct Media Link Importer** ([`LinkAnalyzerService.kt`](app/src/main/java/com/xeceay/music/LinkAnalyzerService.kt)):
  - Enforces HTTPS and SSRF protection (blocks loopback/private network ranges).
  - Recognizes YouTube URLs via official public oEmbed metadata and provides compliant actions (Official Preview, Open in YouTube App, or Import User-Owned File) without bypassing DRM.
  - Recognizes direct HTTPS audio/video links and inspects format/size via `HEAD` requests for one-tap offline download.

---

## 2. Building the APK Locally

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew.bat assembleRelease assembleDebug
```

Output APKs:
- Release APK: `app/build/outputs/apk/release/app-release.apk` (also copied to `XECEAY-release.apk`)
- Debug APK: `app/build/outputs/apk/debug/app-debug.apk`

---

## 3. Uploading to GitHub & Publishing an Auto-Update Release

1. Create a new repository on GitHub (for example `https://github.com/YOUR_USERNAME/xeceay-music`).
2. Run the included [`publish-release.ps1`](publish-release.ps1) script or execute:
   ```powershell
   git init
   git add .
   git commit -m "Initial release of XECEAY v1.0.0"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/xeceay-music.git
   git push -u origin main
   ```
3. Whenever you want to push a new update to all installed XECEAY apps:
   - Bump `versionCode` (e.g. `101`) and `versionName` (e.g. `"1.0.1"`) in [`app/build.gradle.kts`](app/build.gradle.kts).
   - Commit and push a tag:
     ```powershell
     git tag v1.0.1
     git push origin main --tags
     ```
   - GitHub Actions will automatically compile `XECEAY-release.apk` and publish it to GitHub Releases.
   - Inside the XECEAY Android app, go to **Settings → In-App APK Auto-Update**, enter `YOUR_USERNAME/xeceay-music`, tap **Check GitHub Release**, and tap **Download & Auto-Install**!
