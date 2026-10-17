import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../core/utils/formatters.dart';

class DCEAYProgressBar extends StatefulWidget {
  final Duration position;
  final Duration duration;
  final Duration buffered;
  final AppPalette palette;
  final ValueChanged<Duration> onSeek;

  const DCEAYProgressBar({
    super.key,
    required this.position,
    required this.duration,
    required this.buffered,
    required this.palette,
    required this.onSeek,
  });

  @override
  State<DCEAYProgressBar> createState() => _DCEAYProgressBarState();
}

class _DCEAYProgressBarState extends State<DCEAYProgressBar> {
  double? _dragValue;

  @override
  Widget build(BuildContext context) {
    final totalMs = widget.duration.inMilliseconds.toDouble();
    final currentMs = _dragValue ?? widget.position.inMilliseconds.toDouble();
    final safeTotal = totalMs > 0 ? totalMs : 1.0;
    final progress = (currentMs / safeTotal).clamp(0.0, 1.0);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SliderTheme(
          data: SliderThemeData(
            activeTrackColor: widget.palette.accentPrimary,
            inactiveTrackColor: widget.palette.surfaceVariant,
            thumbColor: widget.palette.accentPrimary,
            overlayColor: widget.palette.accentPrimary.withValues(alpha: 0.2),
            trackHeight: 3.5,
            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
          ),
          child: Slider(
            value: progress,
            onChanged: (val) {
              setState(() {
                _dragValue = val * safeTotal;
              });
            },
            onChangeEnd: (val) {
              final target = Duration(milliseconds: (val * safeTotal).toInt());
              widget.onSeek(target);
              setState(() {
                _dragValue = null;
              });
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                AppFormatters.formatDuration(
                  Duration(milliseconds: currentMs.toInt()),
                ),
                style: TextStyle(
                  fontSize: 12,
                  color: widget.palette.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                AppFormatters.formatDuration(widget.duration),
                style: TextStyle(
                  fontSize: 12,
                  color: widget.palette.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
