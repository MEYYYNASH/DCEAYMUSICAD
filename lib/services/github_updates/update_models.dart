enum UpdateStatus {
  idle,
  checking,
  upToDate,
  updateAvailable,
  downloading,
  verifying,
  readyToInstall,
  error,
}

class ReleaseInfo {
  final String tagName;
  final String versionName;
  final int buildNumber;
  final String releaseNotes;
  final DateTime publishedAt;
  final String apkDownloadUrl;
  final String apkFileName;
  final int apkSizeBytes;
  final String? sha256Expected;
  final String? sha256Url;

  const ReleaseInfo({
    required this.tagName,
    required this.versionName,
    required this.buildNumber,
    required this.releaseNotes,
    required this.publishedAt,
    required this.apkDownloadUrl,
    required this.apkFileName,
    required this.apkSizeBytes,
    this.sha256Expected,
    this.sha256Url,
  });
}

class DownloadProgress {
  final int receivedBytes;
  final int totalBytes;
  final double percentage;
  final double speedKbps;

  const DownloadProgress({
    required this.receivedBytes,
    required this.totalBytes,
    required this.percentage,
    required this.speedKbps,
  });
}

class VersionComparison {
  static int compare(String v1, String v2) {
    final clean1 = v1.replaceAll(RegExp(r'^[vV]'), '').trim();
    final clean2 = v2.replaceAll(RegExp(r'^[vV]'), '').trim();

    final parts1 = clean1.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final parts2 = clean2.split('.').map((e) => int.tryParse(e) ?? 0).toList();

    final maxLen = parts1.length > parts2.length ? parts1.length : parts2.length;
    for (int i = 0; i < maxLen; i++) {
      final p1 = i < parts1.length ? parts1[i] : 0;
      final p2 = i < parts2.length ? parts2[i] : 0;
      if (p1 != p2) {
        return p1.compareTo(p2);
      }
    }
    return 0;
  }

  static bool isNewer(String remoteVersion, String currentVersion) {
    return compare(remoteVersion, currentVersion) > 0;
  }
}
