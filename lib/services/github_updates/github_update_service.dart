import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:open_filex/open_filex.dart';
import '../../core/networking/http_client.dart';
import '../../core/utils/logger.dart';
import 'checksum_verifier.dart';
import 'update_models.dart';

class GitHubUpdateService {
  static final GitHubUpdateService _instance = GitHubUpdateService._internal();
  factory GitHubUpdateService() => _instance;

  final DCEAYHttpClient _httpClient = DCEAYHttpClient();

  String currentVersion = '2.1.0';
  int currentBuildNumber = 210;
  String repoOwner = 'MEYYYNASH';
  String repoName = 'DCEAYMUSICAD';

  final ValueNotifier<UpdateStatus> statusNotifier =
      ValueNotifier<UpdateStatus>(UpdateStatus.idle);
  final ValueNotifier<ReleaseInfo?> latestReleaseNotifier =
      ValueNotifier<ReleaseInfo?>(null);
  final ValueNotifier<DownloadProgress?> downloadProgressNotifier =
      ValueNotifier<DownloadProgress?>(null);
  final ValueNotifier<String?> errorMessageNotifier =
      ValueNotifier<String?>(null);
  final ValueNotifier<File?> downloadedApkNotifier =
      ValueNotifier<File?>(null);

  CancelToken? _cancelToken;

  GitHubUpdateService._internal();

  Future<void> checkForUpdates() async {
    statusNotifier.value = UpdateStatus.checking;
    errorMessageNotifier.value = null;

    try {
      final url = 'https://api.github.com/repos/$repoOwner/$repoName/releases';
      final response = await _httpClient.get<List<dynamic>>(url);

      if (response.data == null || response.data!.isEmpty) {
        statusNotifier.value = UpdateStatus.upToDate;
        return;
      }

      // Filter out drafts and prereleases
      final releases = response.data!
          .cast<Map<String, dynamic>>()
          .where((r) => r['draft'] == false && r['prerelease'] == false)
          .toList();

      if (releases.isEmpty) {
        statusNotifier.value = UpdateStatus.upToDate;
        return;
      }

      final latest = releases.first;
      final tagName = latest['tag_name'] as String? ?? '';
      final body = latest['body'] as String? ?? '';
      final publishedAtStr = latest['published_at'] as String? ?? '';
      final publishedAt = DateTime.tryParse(publishedAtStr) ?? DateTime.now();

      final assets = (latest['assets'] as List<dynamic>?)
              ?.cast<Map<String, dynamic>>() ??
          [];

      // Find APK asset
      final apkAsset = assets.firstWhere(
        (a) => (a['name'] as String? ?? '').endsWith('.apk'),
        orElse: () => <String, dynamic>{},
      );

      // Find SHA256 checksum asset if published
      final shaAsset = assets.firstWhere(
        (a) => (a['name'] as String? ?? '').endsWith('.sha256'),
        orElse: () => <String, dynamic>{},
      );

      if (apkAsset.isEmpty) {
        statusNotifier.value = UpdateStatus.upToDate;
        return;
      }

      final releaseInfo = ReleaseInfo(
        tagName: tagName,
        versionName: tagName.replaceAll(RegExp(r'^[vV]'), ''),
        buildNumber: 0,
        releaseNotes: body,
        publishedAt: publishedAt,
        apkDownloadUrl: apkAsset['browser_download_url'] as String? ?? '',
        apkFileName: apkAsset['name'] as String? ?? 'DCEAY-release.apk',
        apkSizeBytes: apkAsset['size'] as int? ?? 0,
        sha256Url: shaAsset.isNotEmpty
            ? shaAsset['browser_download_url'] as String?
            : null,
      );

      latestReleaseNotifier.value = releaseInfo;

      if (VersionComparison.isNewer(releaseInfo.versionName, currentVersion)) {
        statusNotifier.value = UpdateStatus.updateAvailable;
      } else {
        statusNotifier.value = UpdateStatus.upToDate;
      }
    } catch (e) {
      AppLogger.error('Failed to check for updates', error: e);
      errorMessageNotifier.value = 'Could not reach update server: $e';
      statusNotifier.value = UpdateStatus.error;
    }
  }

  Future<void> downloadAndVerifyApk() async {
    final release = latestReleaseNotifier.value;
    if (release == null || release.apkDownloadUrl.isEmpty) {
      errorMessageNotifier.value = 'No valid APK URL to download';
      statusNotifier.value = UpdateStatus.error;
      return;
    }

    statusNotifier.value = UpdateStatus.downloading;
    errorMessageNotifier.value = null;
    _cancelToken = CancelToken();

    final tempDir = await getTemporaryDirectory();
    final saveFile = File(p.join(tempDir.path, release.apkFileName));

    if (await saveFile.exists()) {
      await saveFile.delete();
    }

    final stopwatch = Stopwatch()..start();

    try {
      await _httpClient.download(
        release.apkDownloadUrl,
        saveFile.path,
        cancelToken: _cancelToken,
        onReceiveProgress: (received, total) {
          if (total > 0) {
            final seconds = stopwatch.elapsedMilliseconds / 1000.0;
            final speed = seconds > 0 ? (received / 1024.0) / seconds : 0.0;
            downloadProgressNotifier.value = DownloadProgress(
              receivedBytes: received,
              totalBytes: total,
              percentage: received / total,
              speedKbps: speed,
            );
          }
        },
      );

      // Verify SHA256 Checksum
      statusNotifier.value = UpdateStatus.verifying;

      String? expectedHash = release.sha256Expected;

      // If SHA256 url exists, fetch it
      if (expectedHash == null && release.sha256Url != null) {
        try {
          final res = await _httpClient.get<String>(release.sha256Url!);
          if (res.data != null) {
            expectedHash = ChecksumVerifier.extractHashFromSha256File(res.data!);
          }
        } catch (e) {
          AppLogger.warn('Could not fetch .sha256 file: $e');
        }
      }

      // Check in release notes if still null
      if (expectedHash == null) {
        expectedHash =
            ChecksumVerifier.extractHashFromSha256File(release.releaseNotes);
      }

      final calculatedHash = await ChecksumVerifier.calculateSha256(saveFile);

      if (expectedHash != null) {
        final matches = ChecksumVerifier.verify(calculatedHash, expectedHash);
        if (!matches) {
          await saveFile.delete();
          errorMessageNotifier.value =
              'SHA-256 verification failed! Corrupted or tampered APK download rejected.';
          statusNotifier.value = UpdateStatus.error;
          return;
        }
      }

      downloadedApkNotifier.value = saveFile;
      statusNotifier.value = UpdateStatus.readyToInstall;
    } catch (e) {
      if (CancelToken.isCancel(e as RequestOptions)) {
        errorMessageNotifier.value = 'Download cancelled';
      } else {
        AppLogger.error('APK download error', error: e);
        errorMessageNotifier.value = 'Failed to download APK: $e';
      }
      statusNotifier.value = UpdateStatus.error;
    }
  }

  void cancelDownload() {
    _cancelToken?.cancel('User cancelled download');
    statusNotifier.value = UpdateStatus.idle;
    downloadProgressNotifier.value = null;
  }

  Future<void> launchPackageInstaller() async {
    final apkFile = downloadedApkNotifier.value;
    if (apkFile == null || !await apkFile.exists()) {
      errorMessageNotifier.value = 'Downloaded APK file not found';
      statusNotifier.value = UpdateStatus.error;
      return;
    }

    try {
      final result = await OpenFilex.open(
        apkFile.path,
        type: 'application/vnd.android.package-archive',
      );
      if (result.type != ResultType.done) {
        errorMessageNotifier.value =
            'Could not launch installer: ${result.message}';
      }
    } catch (e) {
      AppLogger.error('Error opening package installer', error: e);
      errorMessageNotifier.value = 'Installer launch error: $e';
    }
  }
}
