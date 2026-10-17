# DCEAY — One App. All Your Music.

> **Tagline:** *ONE APP. ALL YOUR MUSIC.*  
> **Brand Symbol:** Sharp angular geometric emblem with neon-gradient accents.  
> **Repository:** [`https://github.com/MEYYYNASH/DCEAYMUSICAD`](https://github.com/MEYYYNASH/DCEAYMUSICAD)  
> **Framework:** Flutter (Dart 3.2+) & Android Native Media Subsystem  
> **Target Devices:** Android 7.0+ (API 24 to API 34+)  

---

## 1. Project Overview

**DCEAY** is a next-generation Android music application engineered to bridge the gap between offline audio vaults and online metadata catalogs. Designed with reference to the fluid interaction patterns of modern players (such as Dotify), DCEAY delivers an ultra-smooth 60/120 FPS experience featuring:

- **Immersive Artwork-to-Background Engine**: The album art dynamically transforms into an ambient, blurred backdrop with dynamic palette extraction.
- **Syllable- & Line-Synchronized Lyrics Studio**: Auto-scrolling LRC engine with word/syllable timing support, manual offset calibration (-200ms to +200ms), and in-app lyric editing.
- **Authoritative Single Playback Engine**: Built on `just_audio` and `audio_service` for seamless lock-screen playback, wired headset/Bluetooth controls, audio focus handling, and notification controls.
- **Universal Link & File Importer**: Scoped file import for offline audio (`MP3`, `FLAC`, `WAV`, `M4A`, `OGG`) with duplicate detection, plus oEmbed metadata analysis for Spotify and YouTube links.
- **In-App GitHub Update Center**: In-app semantic version detection against GitHub Releases, streaming APK download with rate tracking, cryptographic SHA-256 verification, and official Android PackageInstaller invocation.
- **Multi-Theme Personalization Studio**: Dark Obsidian, Cyberpunk Neon (with glowing double borders), Glassmorphism (frosted translucent dark panels), and AMOLED Pitch Black (#000000) for OLED power saving.

---

## 2. Recommended Project Structure

```
dceay/
├── assets/
│   └── images/
│       ├── brand-logo.png
│       └── brand-logo.svg
├── lib/
│   ├── app/
│   │   ├── app.dart                   # Root MaterialApp, persistent mini-player & tabs
│   │   └── routes.dart                # Route constants
│   ├── core/
│   │   ├── animations/
│   │   │   ├── disc_rotation.dart     # Rotating vinyl disc animation
│   │   │   └── transitions.dart      # Spring & slide page transitions
│   │   ├── networking/
│   │   │   └── http_client.dart       # Dio HTTP client with timeouts & cancellation
│   │   ├── theme/
│   │   │   ├── app_theme.dart         # Material 3 theme builders
│   │   │   ├── color_palette.dart     # Obsidian, Cyberpunk, Glass, AMOLED palettes
│   │   │   └── text_styles.dart       # GoogleFonts Inter typography hierarchy
│   │   └── utils/
│   │       ├── formatters.dart        # Duration and file size formatters
│   │       └── logger.dart            # Privacy-safe structured logging
│   ├── features/
│   │   ├── home/
│   │   │   └── home_screen.dart       # Personalized home, recently played, heavy rotation
│   │   ├── import/
│   │   │   ├── file_import_service.dart # Local file picker & deduplication
│   │   │   ├── import_screen.dart     # Import UI for offline files and web links
│   │   │   └── link_importer.dart     # Spotify & YouTube oEmbed link analyzer
│   │   ├── library/
│   │   │   ├── albums_view.dart       # Grid of albums with artwork
│   │   │   ├── artists_view.dart      # Grouped artist catalogue
│   │   │   ├── library_screen.dart    # Tabbed library controller
│   │   │   └── songs_view.dart        # Full track list with LYRICS badges
│   │   ├── lyrics/
│   │   │   ├── lrc_parser.dart        # Multi-timestamp & word-timing parser
│   │   │   ├── lyric_editor_dialog.dart # In-app LRC editor & calibration
│   │   │   └── lyrics_view.dart       # Auto-scrolling synchronized lyrics UI
│   │   ├── player/
│   │   │   ├── mini_player.dart       # Docked persistent mini-player
│   │   │   ├── now_playing_screen.dart# Full-screen player with blurred background
│   │   │   ├── player_controls.dart   # Play/pause, shuffle, repeat, lyrics badge
│   │   │   ├── progress_bar.dart      # Seek slider with live scrub preview
│   │   │   └── queue_sheet.dart       # Reorderable queue modal sheet
│   │   ├── playlists/
│   │   │   ├── create_playlist_dialog.dart # New playlist dialog
│   │   │   ├── playlist_detail_screen.dart # Playlist tracks & playback
│   │   │   └── playlists_screen.dart  # Playlists overview
│   │   ├── search/
│   │   │   └── search_screen.dart     # Instant search with lyrics/favorites filters
│   │   ├── settings/
│   │   │   ├── appearance_settings.dart # Theme selection & Reduced Motion
│   │   │   ├── audio_settings.dart    # Equalizer, bass boost, playback speed
│   │   │   ├── settings_screen.dart   # Settings dashboard
│   │   │   └── storage_settings.dart  # Cache calculation and cleaning
│   │   └── updates/
│   │       ├── update_center_screen.dart # GitHub release checker
│   │       └── update_dialog.dart     # Streaming download & SHA-256 installer dialog
│   ├── services/
│   │   ├── audio/
│   │   │   ├── audio_handler.dart     # Android AudioService background notification
│   │   │   ├── audio_models.dart      # Track, Playlist, RepeatMode data models
│   │   │   └── audio_player_service.dart # Centralized authoritative playback engine
│   │   ├── database/
│   │   │   ├── app_database.dart      # SQLite schema and openDatabase helper
│   │   │   └── track_dao.dart         # Data access object with transactions
│   │   ├── github_updates/
│   │   │   ├── checksum_verifier.dart # Cryptographic SHA-256 calculation & validation
│   │   │   ├── github_update_service.dart # GitHub Releases API & PackageInstaller
│   │   │   └── update_models.dart     # ReleaseInfo, DownloadProgress, VersionComparison
│   │   └── metadata/
│   │       └── metadata_extractor.dart # File metadata and paired .lrc extraction
│   └── main.dart                      # App entrypoint and service initialization
├── android/
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── kotlin/com/xeceay/music/MainActivity.kt
│   │   │   └── AndroidManifest.xml    # Permissions, AudioService, FileProvider
│   │   └── build.gradle.kts           # App-level gradle configuration
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   └── gradle.properties
├── test/
│   ├── audio_models_test.dart         # Serialization & DB mapping tests
│   ├── checksum_verifier_test.dart    # SHA-256 verification tests
│   ├── lrc_parser_test.dart           # Timestamp and binary search tests
│   ├── queue_management_test.dart     # Queue reordering & repeat tests
│   └── version_comparison_test.dart   # Semantic version comparison tests
├── .github/workflows/
│   └── flutter-release.yml            # CI/CD build, test & release workflow
├── pubspec.yaml                       # Production Flutter dependencies
└── README.md
```

---

## 3. Cryptographic GitHub In-App Auto-Updater

DCEAY features a production-grade, secure in-app update mechanism that directly interfaces with the GitHub Releases API:

```
[Installed App v2.1.0]
         │
         ▼
[GitHub Releases API] ───> Checks latest tag (e.g. v2.2.0)
         │
         ▼ (If newer)
[Streaming Download]  ───> Downloads DCEAY-release.apk (with progress %)
         │
         ▼
[SHA-256 Verification]───> Computes SHA-256 locally & verifies against .sha256 digest
         │
         ├── Mismatch ───> Immediately DELETES file & displays security warning
         │
         └── Match    ───> Passes APK to Android PackageInstaller Intent
```

The app will **never** silently execute arbitrary code or bypass Android OS installation confirmation prompts.

---

## 4. Setup, Build & Testing Instructions

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (version 3.16.0 or higher, 3.24+ recommended)
- Java JDK 17 (recommended: Eclipse Temurin 17)
- Android SDK Platform 34+

### Local Development Steps

1. **Install Dependencies:**
   ```bash
   flutter pub get
   ```

2. **Run Automated Unit Tests:**
   ```bash
   flutter test
   ```
   *Expected outcome: 5/5 test suites pass verifying LRC parsing, version comparison, SHA-256 checksums, and queue ordering.*

3. **Run Code Analysis:**
   ```bash
   flutter analyze
   ```

4. **Build Debug APK:**
   ```bash
   flutter build apk --debug
   ```

5. **Build Release APK:**
   ```bash
   flutter build apk --release
   ```
   The resulting artifact will be located at:
   `build/app/outputs/flutter-apk/app-release.apk`

---

## 5. GitHub Actions CI/CD Pipeline

The repository includes [`.github/workflows/flutter-release.yml`](.github/workflows/flutter-release.yml):
- Triggers on every release tag push (`git tag v2.1.0 && git push origin v2.1.0`).
- Sets up JDK 17 and Flutter 3.24.3 on Ubuntu runners.
- Executes `flutter analyze` and `flutter test`.
- Builds the optimized release APK: `flutter build apk --release`.
- Generates `DCEAY-release.apk.sha256` digest via `sha256sum`.
- Creates a versioned GitHub Release attaching both the APK and the SHA-256 digest file automatically.

---

## 6. Verification & Implementation Status

| Feature | Implementation | Test Coverage |
| :--- | :--- | :--- |
| **Real Audio Playback** | `AudioPlayerService` via `just_audio` | Unit + State transitions |
| **Background Service & Lock Screen** | `audio_service` + `AudioServiceActivity` | AndroidManifest verification |
| **LRC Timed Lyrics** | `LrcParser` with multi-timestamp & word timing | `test/lrc_parser_test.dart` |
| **Lyric Auto-Scroll & Seeking** | `LyricsView` with live position tracking | Interactive UI |
| **Dynamic Artwork Blurred BG** | `NowPlayingScreen` with BackdropFilter | Responsive layout |
| **Rotating Vinyl Disc** | `RotatingDisc` widget with Reduced Motion | Interactive UI |
| **Local File Import** | Scoped `FilePicker` + duplicate detection | `FileImportService` |
| **Universal Link Analysis** | Spotify & YouTube oEmbed extraction | `LinkImporter` |
| **SQLite Persistent Library** | `AppDatabase` + `TrackDao` with playlists | `test/audio_models_test.dart` |
| **GitHub Releases Auto-Updater** | Semantic versioning + streaming download | `test/version_comparison_test.dart` |
| **SHA-256 Integrity Verification** | `ChecksumVerifier` with rejection safeguard | `test/checksum_verifier_test.dart` |
| **Android Package Installer** | `OpenFilex` intent invocation | PackageInstaller API |
| **Themes & Personalization** | Obsidian, Cyberpunk, Glass, AMOLED | `AppPalette` & `AppTheme` |

---

## 7. License & Compliance Notice

DCEAY is an independent music player developed to empower users with ownership of their local library and legal streaming metadata. It complies with streaming platform terms: Spotify and YouTube integrations utilize official public oEmbed endpoints for metadata catalogue resolution and do not extract or download protected digital streams.
