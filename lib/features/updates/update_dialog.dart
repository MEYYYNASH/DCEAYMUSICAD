import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../core/utils/formatters.dart';
import '../../services/github_updates/github_update_service.dart';
import '../../services/github_updates/update_models.dart';

class UpdateDialog extends StatelessWidget {
  final ReleaseInfo release;
  final AppPalette palette;

  const UpdateDialog({
    super.key,
    required this.release,
    required this.palette,
  });

  @override
  Widget build(BuildContext context) {
    final updateService = GitHubUpdateService();

    return AlertDialog(
      backgroundColor: palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: palette.border),
      ),
      title: Row(
        children: [
          Icon(Icons.system_update_alt_rounded, color: palette.accentPrimary),
          const SizedBox(width: 12),
          Text(
            'New Version Available',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: palette.textPrimary,
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${release.tagName} (${AppFormatters.formatFileSize(release.apkSizeBytes)})',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: palette.accentPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Release Notes:',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: palette.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: palette.cardBackground,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                release.releaseNotes.isNotEmpty
                    ? release.releaseNotes
                    : 'Performance optimizations and stability enhancements.',
                style: TextStyle(fontSize: 12, color: palette.textPrimary),
              ),
            ),
            const SizedBox(height: 16),

            // Live download & verification status
            ValueListenableBuilder<UpdateStatus>(
              valueListenable: updateService.statusNotifier,
              builder: (context, status, _) {
                switch (status) {
                  case UpdateStatus.downloading:
                    return ValueListenableBuilder<DownloadProgress?>(
                      valueListenable: updateService.downloadProgressNotifier,
                      builder: (context, prog, _) {
                        final pct = prog?.percentage ?? 0.0;
                        final speed = prog?.speedKbps.toStringAsFixed(1) ?? '0.0';
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            LinearProgressIndicator(
                              value: pct,
                              backgroundColor: palette.surfaceVariant,
                              valueColor: AlwaysStoppedAnimation<Color>(palette.accentPrimary),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('${(pct * 100).toInt()}%',
                                    style: TextStyle(fontSize: 11, color: palette.textSecondary)),
                                Text('$speed KB/s',
                                    style: TextStyle(fontSize: 11, color: palette.textSecondary)),
                              ],
                            ),
                          ],
                        );
                      },
                    );
                  case UpdateStatus.verifying:
                    return Row(
                      children: [
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(width: 10),
                        Text('Verifying SHA-256 cryptographic digest...',
                            style: TextStyle(fontSize: 12, color: palette.accentPrimary)),
                      ],
                    );
                  case UpdateStatus.readyToInstall:
                    return Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: Colors.greenAccent, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Verified & Ready! Tap Install to launch Android package installer.',
                            style: TextStyle(fontSize: 12, color: palette.textPrimary),
                          ),
                        ),
                      ],
                    );
                  case UpdateStatus.error:
                    return ValueListenableBuilder<String?>(
                      valueListenable: updateService.errorMessageNotifier,
                      builder: (context, err, _) {
                        return Text(
                          err ?? 'An error occurred during update',
                          style: const TextStyle(fontSize: 12, color: Colors.redAccent),
                        );
                      },
                    );
                  default:
                    return const SizedBox.shrink();
                }
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            updateService.cancelDownload();
            Navigator.pop(context);
          },
          child: Text('Dismiss', style: TextStyle(color: palette.textSecondary)),
        ),
        ValueListenableBuilder<UpdateStatus>(
          valueListenable: updateService.statusNotifier,
          builder: (context, status, _) {
            if (status == UpdateStatus.readyToInstall) {
              return FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.greenAccent,
                  foregroundColor: Colors.black,
                ),
                icon: const Icon(Icons.install_mobile_rounded),
                label: const Text('Install Now'),
                onPressed: updateService.launchPackageInstaller,
              );
            } else if (status == UpdateStatus.downloading) {
              return OutlinedButton(
                onPressed: updateService.cancelDownload,
                child: const Text('Cancel'),
              );
            } else {
              return FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: palette.accentPrimary,
                  foregroundColor: Colors.black,
                ),
                icon: const Icon(Icons.download_rounded),
                label: const Text('Download APK'),
                onPressed: updateService.downloadAndVerifyApk,
              );
            }
          },
        ),
      ],
    );
  }
}
