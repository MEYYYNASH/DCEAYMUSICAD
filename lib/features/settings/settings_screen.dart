import 'package:flutter/material.dart';
import '../../core/animations/transitions.dart';
import '../../core/theme/color_palette.dart';
import '../updates/update_center_screen.dart';
import 'appearance_settings.dart';
import 'audio_settings.dart';
import 'storage_settings.dart';

class SettingsScreen extends StatelessWidget {
  final AppPalette palette;
  final AppThemeMode currentTheme;
  final ValueChanged<AppThemeMode> onThemeChanged;
  final bool reducedMotion;
  final ValueChanged<bool> onReducedMotionChanged;

  const SettingsScreen({
    super.key,
    required this.palette,
    required this.currentTheme,
    required this.onThemeChanged,
    required this.reducedMotion,
    required this.onReducedMotionChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 120),
        children: [
          AppearanceSettingsView(
            palette: palette,
            currentTheme: currentTheme,
            onThemeChanged: onThemeChanged,
            reducedMotion: reducedMotion,
            onReducedMotionChanged: onReducedMotionChanged,
          ),
          const Divider(),
          AudioSettingsView(palette: palette),
          const Divider(),
          StorageSettingsView(palette: palette),
          const Divider(),

          // Updates & About Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Text(
              'ABOUT & UPDATES',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
                color: palette.accentPrimary,
              ),
            ),
          ),
          ListTile(
            leading: Icon(Icons.system_update_alt_rounded, color: palette.accentPrimary),
            title: Text('GitHub Update Center', style: TextStyle(color: palette.textPrimary)),
            subtitle: Text('Check for newer releases & verify SHA-256 APK checksums',
                style: TextStyle(fontSize: 12, color: palette.textSecondary)),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () {
              Navigator.push(
                context,
                SmoothTransitions.slideUpRoute(UpdateCenterScreen(palette: palette)),
              );
            },
          ),
          ListTile(
            leading: Icon(Icons.info_outline_rounded, color: palette.textSecondary),
            title: Text('DCEAY Music Player', style: TextStyle(color: palette.textPrimary)),
            subtitle: Text('Version 2.1.0 (Build 210) • Production Edition',
                style: TextStyle(fontSize: 12, color: palette.textSecondary)),
          ),
        ],
      ),
    );
  }
}
