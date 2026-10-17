import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../core/theme/text_styles.dart';
import '../../services/github_updates/github_update_service.dart';
import '../../services/github_updates/update_models.dart';
import 'update_dialog.dart';

class UpdateCenterScreen extends StatefulWidget {
  final AppPalette palette;

  const UpdateCenterScreen({super.key, required this.palette});

  @override
  State<UpdateCenterScreen> createState() => _UpdateCenterScreenState();
}

class _UpdateCenterScreenState extends State<UpdateCenterScreen> {
  final GitHubUpdateService _updateService = GitHubUpdateService();

  @override
  void initState() {
    super.initState();
    _updateService.checkForUpdates();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.palette.background,
      appBar: AppBar(
        title: const Text('Update Center'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Current Installed Version Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: widget.palette.cardBackground,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: widget.palette.border.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: widget.palette.surfaceVariant,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(Icons.verified_rounded, color: widget.palette.accentPrimary, size: 30),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Installed Version',
                          style: TextStyle(fontSize: 12, color: widget.palette.textSecondary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'v${_updateService.currentVersion} (Build ${_updateService.currentBuildNumber})',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: widget.palette.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Target: ${_updateService.repoOwner}/${_updateService.repoName}',
                          style: TextStyle(fontSize: 11, color: widget.palette.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Live Update Status Area
            Expanded(
              child: Center(
                child: ValueListenableBuilder<UpdateStatus>(
                  valueListenable: _updateService.statusNotifier,
                  builder: (context, status, _) {
                    switch (status) {
                      case UpdateStatus.checking:
                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(color: widget.palette.accentPrimary),
                            const SizedBox(height: 16),
                            Text('Querying GitHub Releases API...',
                                style: TextStyle(color: widget.palette.textSecondary)),
                          ],
                        );
                      case UpdateStatus.updateAvailable:
                        final release = _updateService.latestReleaseNotifier.value;
                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.new_releases_rounded, size: 64, color: widget.palette.accentPrimary),
                            const SizedBox(height: 16),
                            Text(
                              'Update Available: ${release?.tagName ?? ''}',
                              style: AppTextStyles.headingMedium(widget.palette.textPrimary),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'A newer version is ready on GitHub with verified SHA-256 integrity.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: widget.palette.textSecondary),
                            ),
                            const SizedBox(height: 24),
                            FilledButton.icon(
                              style: FilledButton.styleFrom(
                                backgroundColor: widget.palette.accentPrimary,
                                foregroundColor: Colors.black,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                              ),
                              icon: const Icon(Icons.download_rounded),
                              label: const Text('View Release & Install'),
                              onPressed: () {
                                if (release != null) {
                                  showDialog(
                                    context: context,
                                    builder: (context) => UpdateDialog(
                                      release: release,
                                      palette: widget.palette,
                                    ),
                                  );
                                }
                              },
                            ),
                          ],
                        );
                      case UpdateStatus.upToDate:
                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check_circle_outline_rounded, size: 64, color: Colors.greenAccent),
                            const SizedBox(height: 16),
                            Text(
                              'DCEAY is Up to Date',
                              style: AppTextStyles.headingMedium(widget.palette.textPrimary),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'You are running the latest official release.',
                              style: TextStyle(color: widget.palette.textSecondary),
                            ),
                          ],
                        );
                      case UpdateStatus.error:
                        return Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline_rounded, size: 64, color: Colors.redAccent),
                            const SizedBox(height: 16),
                            Text(
                              'Check Failed',
                              style: AppTextStyles.headingMedium(widget.palette.textPrimary),
                            ),
                            const SizedBox(height: 8),
                            ValueListenableBuilder<String?>(
                              valueListenable: _updateService.errorMessageNotifier,
                              builder: (context, err, _) => Text(
                                err ?? 'Unable to connect to GitHub',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.redAccent, fontSize: 13),
                              ),
                            ),
                          ],
                        );
                      default:
                        return const SizedBox.shrink();
                    }
                  },
                ),
              ),
            ),

            // Check Again Button
            FilledButton.tonal(
              style: FilledButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _updateService.checkForUpdates,
              child: const Text('Check for Updates'),
            ),
          ],
        ),
      ),
    );
  }
}
