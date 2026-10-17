import 'package:flutter/material.dart';

class AppTextStyles {
  static TextStyle headingLarge(Color color) => TextStyle(
        fontFamily: 'Inter',
        fontSize: 26,
        fontWeight: FontWeight.w700,
        color: color,
        letterSpacing: -0.5,
      );

  static TextStyle headingMedium(Color color) => TextStyle(
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        letterSpacing: -0.3,
      );

  static TextStyle bodyLarge(Color color) => TextStyle(
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: color,
      );

  static TextStyle bodyMedium(Color color) => TextStyle(
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: color,
      );

  static TextStyle caption(Color color) => TextStyle(
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: color,
      );

  static TextStyle label(Color color) => TextStyle(
        fontFamily: 'Inter',
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: color,
        letterSpacing: 0.8,
      );

  static TextStyle lyricLine(Color color, {double fontSize = 20, bool isCurrent = false}) =>
      TextStyle(
        fontFamily: 'Inter',
        fontSize: fontSize,
        fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w400,
        color: color,
        height: 1.5,
        letterSpacing: -0.2,
      );
}
