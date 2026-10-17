import 'package:flutter/material.dart';
import 'color_palette.dart';
import 'text_styles.dart';

class AppTheme {
  static ThemeData buildTheme(AppPalette palette) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: palette.background,
      colorScheme: ColorScheme.dark(
        primary: palette.accentPrimary,
        secondary: palette.accentSecondary,
        surface: palette.surface,
        surfaceContainerHighest: palette.surfaceVariant,
        onSurface: palette.textPrimary,
        onPrimary: Colors.black,
        outline: palette.border,
      ),
      cardTheme: CardTheme(
        color: palette.cardBackground,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: palette.hasDoubleBorder
              ? BorderSide(color: palette.border, width: 2)
              : BorderSide(color: palette.border.withValues(alpha: 0.3), width: 1),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: palette.background.withValues(alpha: 0.8),
        elevation: 0,
        centerTitle: false,
        titleTextStyle: AppTextStyles.headingMedium(palette.textPrimary),
        iconTheme: IconThemeData(color: palette.textPrimary),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: palette.surface,
        selectedItemColor: palette.accentPrimary,
        unselectedItemColor: palette.textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: palette.accentPrimary,
        inactiveTrackColor: palette.surfaceVariant,
        thumbColor: palette.accentPrimary,
        overlayColor: palette.accentPrimary.withValues(alpha: 0.2),
        trackHeight: 3,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
      ),
    );
  }
}
