import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_player_service.dart';

class AudioSettingsView extends StatelessWidget {
  final AppPalette palette;

  const AudioSettingsView({super.key, required this.palette});

  @override
  Widget build(BuildContext context) {
    final playerService = AudioPlayerService();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Text(
            'AUDIO & PLAYBACK',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: palette.accentPrimary,
            ),
          ),
        ),

        // Equalizer Toggle
        ValueListenableBuilder<bool>(
          valueListenable: playerService.equalizerEnabledNotifier,
          builder: (context, enabled, _) {
            return SwitchListTile(
              title: Text('Audio Equalizer', style: TextStyle(color: palette.textPrimary)),
              subtitle: Text(
                '5-band frequency shaping (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz)',
                style: TextStyle(fontSize: 12, color: palette.textSecondary),
              ),
              value: enabled,
              activeColor: palette.accentPrimary,
              onChanged: playerService.toggleEqualizer,
            );
          },
        ),

        // Bass Boost
        ValueListenableBuilder<double>(
          valueListenable: playerService.bassBoostNotifier,
          builder: (context, bass, _) {
            return ListTile(
              title: Text('Bass Enhancement', style: TextStyle(color: palette.textPrimary)),
              subtitle: Slider(
                value: bass,
                min: 0.0,
                max: 1.0,
                activeColor: palette.accentPrimary,
                inactiveColor: palette.surfaceVariant,
                onChanged: playerService.setBassBoost,
              ),
              trailing: Text(
                '${(bass * 100).toInt()}%',
                style: TextStyle(color: palette.accentPrimary, fontWeight: FontWeight.w600),
              ),
            );
          },
        ),

        // Playback Speed
        ValueListenableBuilder<double>(
          valueListenable: playerService.playbackSpeedNotifier,
          builder: (context, speed, _) {
            return ListTile(
              title: Text('Playback Speed', style: TextStyle(color: palette.textPrimary)),
              subtitle: Text('Current: ${speed}x', style: TextStyle(color: palette.textSecondary)),
              trailing: PopupMenuButton<double>(
                initialValue: speed,
                icon: Icon(Icons.speed_rounded, color: palette.accentPrimary),
                onSelected: playerService.setPlaybackSpeed,
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 0.75, child: Text('0.75x')),
                  const PopupMenuItem(value: 1.0, child: Text('1.0x (Normal)')),
                  const PopupMenuItem(value: 1.25, child: Text('1.25x')),
                  const PopupMenuItem(value: 1.5, child: Text('1.5x')),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
