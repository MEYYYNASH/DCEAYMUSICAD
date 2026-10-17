import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';

class AppearanceSettingsView extends StatelessWidget {
  final AppPalette palette;
  final AppThemeMode currentTheme;
  final ValueChanged<AppThemeMode> onThemeChanged;
  final bool reducedMotion;
  final ValueChanged<bool> onReducedMotionChanged;

  const AppearanceSettingsView({
    super.key,
    required this.palette,
    required this.currentTheme,
    required this.onThemeChanged,
    required this.reducedMotion,
    required this.onReducedMotionChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Text(
            'THEMES & STYLING',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: palette.accentPrimary,
            ),
          ),
        ),
        _buildThemeTile(
          mode: AppThemeMode.midnightSlate,
          title: 'Midnight Slate (Dotify Default)',
          subtitle: 'Deep navy/slate surfaces with emerald green & violet accents',
          accent: const Color(0xFF22C55E),
        ),
        _buildThemeTile(
          mode: AppThemeMode.amoledPitchBlack,
          title: 'AMOLED Pitch Black',
          subtitle: 'True #000000 black surfaces for maximum battery efficiency',
          accent: const Color(0xFF00E5FF),
        ),
        _buildThemeTile(
          mode: AppThemeMode.cyberpunkNeon,
          title: 'Cyberpunk Neon',
          subtitle: 'Electric neon pink & cyan double borders',
          accent: const Color(0xFFFF00FF),
        ),
        _buildThemeTile(
          mode: AppThemeMode.glassmorphismFrost,
          title: 'Glassmorphism Frost',
          subtitle: 'Translucent dark surfaces with soft frost borders',
          accent: const Color(0xFF60A5FA),
        ),
        const SizedBox(height: 12),
        SwitchListTile(
          title: Text('Reduced Motion', style: TextStyle(color: palette.textPrimary)),
          subtitle: Text(
            'Disables vinyl disc rotation and continuous mesh animations',
            style: TextStyle(fontSize: 12, color: palette.textSecondary),
          ),
          value: reducedMotion,
          activeColor: palette.accentPrimary,
          onChanged: onReducedMotionChanged,
        ),
      ],
    );
  }

  Widget _buildThemeTile({
    required AppThemeMode mode,
    required String title,
    required String subtitle,
    required Color accent,
  }) {
    final isSelected = currentTheme == mode;
    return RadioListTile<AppThemeMode>(
      value: mode,
      groupValue: currentTheme,
      onChanged: (val) {
        if (val != null) onThemeChanged(val);
      },
      activeColor: palette.accentPrimary,
      title: Row(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(color: accent, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: palette.textPrimary)),
        ],
      ),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: palette.textSecondary)),
    );
  }
}
