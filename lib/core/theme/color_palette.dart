import 'package:flutter/material.dart';

enum AppThemeMode {
  midnightSlate, // Dotify Default (#0F172A + Emerald / Violet)
  amoledPitchBlack, // Pure OLED #000000
  cyberpunkNeon, // #FF00FF & #00FFFF with double borders
  glassmorphismFrost, // #14141E99 with soft white border
}

class AppPalette {
  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color cardBackground;
  final Color accentPrimary;
  final Color accentSecondary;
  final Color textPrimary;
  final Color textSecondary;
  final Color border;
  final bool hasDoubleBorder;
  final double surfaceOpacity;

  const AppPalette({
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.cardBackground,
    required this.accentPrimary,
    required this.accentSecondary,
    required this.textPrimary,
    required this.textSecondary,
    required this.border,
    this.hasDoubleBorder = false,
    this.surfaceOpacity = 1.0,
  });

  // 1. Dotify Signature Midnight Slate
  static const midnightSlate = AppPalette(
    background: Color(0xFF0A0F1D),
    surface: Color(0xFF0F172A),
    surfaceVariant: Color(0xFF1E293B),
    cardBackground: Color(0xFF131D33),
    accentPrimary: Color(0xFF22C55E), // Emerald Green
    accentSecondary: Color(0xFF8B5CF6), // Electric Violet
    textPrimary: Color(0xFFF8FAFC),
    textSecondary: Color(0xFF94A3B8),
    border: Color(0xFF334155),
  );

  // 2. AMOLED Pitch Black
  static const amoledPitchBlack = AppPalette(
    background: Color(0xFF000000),
    surface: Color(0xFF09090B),
    surfaceVariant: Color(0xFF18181B),
    cardBackground: Color(0xFF0C0C0E),
    accentPrimary: Color(0xFF00E5FF),
    accentSecondary: Color(0xFFE040FB),
    textPrimary: Color(0xFFFFFFFF),
    textSecondary: Color(0xFF71717A),
    border: Color(0xFF27272A),
  );

  // 3. Cyberpunk Neon
  static const cyberpunkNeon = AppPalette(
    background: Color(0xFF07040C),
    surface: Color(0xFF12081E),
    surfaceVariant: Color(0xFF1D0E30),
    cardBackground: Color(0xFF190C28),
    accentPrimary: Color(0xFFFF00FF), // Neon Pink
    accentSecondary: Color(0xFF00FFFF), // Neon Cyan
    textPrimary: Color(0xFFFFFFFF),
    textSecondary: Color(0xFFD8B4FE),
    border: Color(0xFF00FFFF),
    hasDoubleBorder: true,
  );

  // 4. Glassmorphism Frost
  static const glassmorphismFrost = AppPalette(
    background: Color(0xFF0D0E15),
    surface: Color(0x9914141E), // Semi-transparent dark
    surfaceVariant: Color(0xB31E1E2E),
    cardBackground: Color(0x801A1A26),
    accentPrimary: Color(0xFF60A5FA),
    accentSecondary: Color(0xFFA78BFA),
    textPrimary: Color(0xFFE6E6E6),
    textSecondary: Color(0xFFA3A3A3),
    border: Color(0x1AFFFFFF), // Faint white border
    surfaceOpacity: 0.75,
  );

  static AppPalette forMode(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.midnightSlate:
        return midnightSlate;
      case AppThemeMode.amoledPitchBlack:
        return amoledPitchBlack;
      case AppThemeMode.cyberpunkNeon:
        return cyberpunkNeon;
      case AppThemeMode.glassmorphismFrost:
        return glassmorphismFrost;
    }
  }

  AppPalette copyWithDynamicAccents({Color? primary, Color? secondary}) {
    return AppPalette(
      background: background,
      surface: surface,
      surfaceVariant: surfaceVariant,
      cardBackground: cardBackground,
      accentPrimary: primary ?? accentPrimary,
      accentSecondary: secondary ?? accentSecondary,
      textPrimary: textPrimary,
      textSecondary: textSecondary,
      border: border,
      hasDoubleBorder: hasDoubleBorder,
      surfaceOpacity: surfaceOpacity,
    );
  }
}
