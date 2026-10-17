import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../../core/theme/color_palette.dart';
import '../../core/utils/formatters.dart';

class StorageSettingsView extends StatefulWidget {
  final AppPalette palette;

  const StorageSettingsView({super.key, required this.palette});

  @override
  State<StorageSettingsView> createState() => _StorageSettingsViewState();
}

class _StorageSettingsViewState extends State<StorageSettingsView> {
  int _cacheSizeBytes = 0;
  bool _isClearing = false;

  @override
  void initState() {
    super.initState();
    _calculateCacheSize();
  }

  Future<void> _calculateCacheSize() async {
    try {
      final tempDir = await getTemporaryDirectory();
      var total = 0;
      if (tempDir.existsSync()) {
        final files = tempDir.listSync(recursive: true, followLinks: false);
        for (final file in files) {
          if (file is File) {
            total += file.lengthSync();
          }
        }
      }
      setState(() => _cacheSizeBytes = total);
    } catch (_) {}
  }

  Future<void> _clearCache() async {
    setState(() => _isClearing = true);
    try {
      final tempDir = await getTemporaryDirectory();
      if (tempDir.existsSync()) {
        final files = tempDir.listSync(recursive: true, followLinks: false);
        for (final file in files) {
          if (file is File) {
            try {
              file.deleteSync();
            } catch (_) {}
          }
        }
      }
      await _calculateCacheSize();
    } catch (_) {}
    setState(() => _isClearing = false);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Text(
            'STORAGE & CACHE',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: widget.palette.accentPrimary,
            ),
          ),
        ),
        ListTile(
          title: Text('Temporary Cache', style: TextStyle(color: widget.palette.textPrimary)),
          subtitle: Text(
            'Downloaded album thumbnails and temporary updates: ${AppFormatters.formatFileSize(_cacheSizeBytes)}',
            style: TextStyle(fontSize: 12, color: widget.palette.textSecondary),
          ),
          trailing: _isClearing
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: widget.palette.accentPrimary,
                    side: BorderSide(color: widget.palette.accentPrimary),
                  ),
                  onPressed: _clearCache,
                  child: const Text('Clear'),
                ),
        ),
      ],
    );
  }
}
