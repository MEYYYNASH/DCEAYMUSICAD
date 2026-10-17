# DCEAY — One App, All Your Music

> **Tagline:** *One App, All Your Music.*  
> **Brand Symbol:** Inspired by the sharp, angular white geometric emblem.  
> **GitHub Repository:** [`https://github.com/MEYYYNASH/DCEAY.git`](https://github.com/MEYYYNASH/DCEAY.git)  
> **Platform:** Android 7.0+ (API 24 to API 36) with Native In-App GitHub Releases Auto-Updater  

---

## 1. Project Vision & Core Differentiators

DCEAY is a futuristic, immersive Android music player built to unite universal streaming links, offline music files, synchronized karaoke lyrics, dynamic ambient backgrounds, and personalized aesthetics under a single unified audio hub.

### 01. Cover-to-Background Engine
- The currently playing song's album artwork dynamically transforms into the full app background.
- Samples complementary accent colors in real-time, configuring `--accent-primary` and `--accent-secondary`.
- Smooth Gaussian blur (`var(--cover-blur, 40px)`), animated mesh gradient pulses, and dark scrim layering to guarantee WCAG AAA typography contrast and battery efficiency.
- Fallback to an angular vector monogram when artwork is unavailable.

### 02. Syllable-Synced Lyrics Studio
- Word-by-word and syllable-by-syllable synchronized karaoke text with smooth glowing text highlights.
- Fallback to line-synced lyrics without fabricated timings when only line-level timestamps exist.
- Current-line auto-scrolling and vertical centering (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).
- Adjustable typography sizing (`A-` / `A+` from 14px to 32px).
- Bilingual lyric translation toggle (displays localized lyrics subtitles underneath original lines).
- Live timing calibration offset bar (`-200ms`, `-50ms`, `0ms`, `+50ms`, `+200ms`).
- User LRC import and timestamp editor to paste or modify `.lrc` files locally.

### 03. Universal Link Engine & Smart Import
- Provider-specific parsers for:
  - **YouTube Videos & Shorts**: oEmbed metadata detection, in-app video playback, and direct audio stream vault.
  - **YouTube Playlists**: Extracts collection IDs, triggers Smart Playlist Review.
  - **Spotify Tracks**: Official oEmbed extraction, rich album artwork, "Open in Spotify" and "Save to DCEAY Library".
  - **Spotify Playlists & Albums**: Detects collection metadata, presents duplicate review before importing.
  - **Direct Audio URLs**: Inspects `MP3`, `FLAC`, `WAV`, `M4A`, `AAC`, `OGG`, `OPUS` headers via HTTPS `HEAD` requests.
  - **Local Device Audio**: Scans device `MediaStore.Audio.Media` for offline tracks.
- **Smart Playlist Deduplication**: Compares incoming track titles against existing library records, flags duplicates, preserves track order, and allows selective importing.

### 04. Personalization Studio
- Themes:
  - **Cyberpunk Neon**: Neon pink (`#ff00ff`) and cyan (`#00ffff`) with distinctive double borders (`3px double #00ffff`) and glowing shadows.
  - **Glassmorphism**: Semi-transparent dark background (`#14141e99`), soft white text (`#e6e6e6`), and faint white borders (`#ffffff1a`).
  - **Midnight Slate**: Deep dark `#0A0D14` with electric blue & violet highlights.
  - **Clean Light**: Clean silver-white surface with deep indigo typography.
  - **Emerald Forest**: Dark forest obsidian with vibrant emerald green.
- Accent color picker & dynamic artwork-based palette sampler.
- Background blur slider controls.
- Dynamic Island-style floating mini-player docked above navigation.
- Launcher icon variant switcher via Android activity aliases.

### 05. Playback Engine & Background Service
- Media playback engine (`AudioPlayerEngine.java`) with multi-hop HTTP/HTTPS redirect resolver (301, 302, 307, 308).
- `MusicPlaybackService.java`: Foreground Service with media notification, play/pause/prev/next actions, lock-screen controls, and audio focus handling.
- Professional 5-band equalizer (`60Hz`, `230Hz`, `910Hz`, `3.6kHz`, `14kHz`), sub-bass boost, and 3D surround spatializer.
- Sleep timer with smooth volume fade-out.

---

## 2. GitHub Online Update System (Mandatory Feature)

DCEAY includes a self-contained, real-time in-app update center powered by the official GitHub Releases API.

### How It Works:
1. **Detection**:
   - Queries `https://api.github.com/repos/MEYYYNASH/DCEAY/releases/latest` (with fallback to `releases` array filtering out drafts/prereleases, and raw `version.json` on `main`).
   - Compares remote semantic tag (`v1.2.1`) against installed package version (`PackageInfo.versionName`).
2. **Download & Transfer Tracking**:
   - Downloads `DCEAY-release.apk` to app external files directory.
   - Dispatches live progress events with percentage, transferred bytes, and transfer rate (`KB/s`).
3. **Cryptographic SHA-256 Verification**:
   - Calculates the SHA-256 hash of the downloaded APK using Java's `MessageDigest`.
   - Compares the hash against the published checksum asset (`DCEAY-release.apk.sha256`) or release notes hash.
   - If a mismatch is detected, the file is immediately deleted, and a security warning is emitted.
4. **Package Identity Validation**:
   - Verifies the APK archive's package name matches `com.xeceay.music` before triggering installation.
5. **Native Installation Flow**:
   - Checks `canRequestPackageInstalls()` on Android 8.0+.
   - Directs user to `Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES` if permissions are required.
   - Launches Android PackageInstaller via `androidx.core.content.FileProvider`.

---

## 3. GitHub Actions CI/CD Pipeline

File: [`.github/workflows/release-apk.yml`](.github/workflows/release-apk.yml)

Every push to `main` or release tag (`v*`):
1. Sets up JDK 21 and Android SDK.
2. Compiles release & debug APKs: `./gradlew assembleRelease assembleDebug`.
3. Copies `app-release.apk` to `DCEAY-release.apk`.
4. Computes SHA-256 hash: `sha256sum DCEAY-release.apk > DCEAY-release.apk.sha256`.
5. Publishes a GitHub Release with both `DCEAY-release.apk` and `DCEAY-release.apk.sha256` attached.

---

## 4. Local Build & Test Instructions

### Prerequisites
- JDK 17 or JDK 21 (e.g. bundled in Android Studio at `C:\Program Files\Android\Android Studio\jbr`)
- Android SDK Platform 36

### Run Unit Tests
```powershell
.\gradlew.bat test
```
Runs test suite verifying URL parsing, version comparison, SHA-256 computation, and playlist deduplication.

### Build Signed Release APK
```powershell
.\gradlew.bat assembleRelease
```
The output APK is generated at:
`app/build/outputs/apk/release/app-release.apk`

### Publishing to GitHub
Use the automated publisher script:
```powershell
.\publish-release.ps1 -GitHubRepoUrl "https://github.com/MEYYYNASH/DCEAY.git" -VersionTag "v1.2.1"
```
