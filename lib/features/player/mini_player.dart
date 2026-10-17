import 'dart:io';
import 'package:flutter/material.dart';
import '../../core/animations/transitions.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';
import 'now_playing_screen.dart';

class DCEAYMiniPlayer extends StatelessWidget {
  final AppPalette palette;

  const DCEAYMiniPlayer({super.key, required this.palette});

  @override
  Widget build(BuildContext context) {
    final playerService = AudioPlayerService();

    return ValueListenableBuilder<Track?>(
      valueListenable: playerService.currentTrackNotifier,
      builder: (context, track, _) {
        if (track == null) return const SizedBox.shrink();

        return GestureDetector(
          onTap: () {
            Navigator.of(context).push(
              SmoothTransitions.slideUpRoute(NowPlayingScreen(palette: palette)),
            );
          },
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: palette.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: palette.hasDoubleBorder ? palette.border : palette.border.withValues(alpha: 0.4),
                width: palette.hasDoubleBorder ? 1.5 : 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.3),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    child: Row(
                      children: [
                        // Thumbnail with Hero
                        Hero(
                          tag: 'artwork_${track.id}',
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: SizedBox(
                              width: 48,
                              height: 48,
                              child: _buildThumbnail(track),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Title and artist
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                track.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: palette.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                track.artist,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: palette.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Play/Pause
                        ValueListenableBuilder<bool>(
                          valueListenable: playerService.isPlayingNotifier,
                          builder: (context, isPlaying, _) {
                            return IconButton(
                              icon: Icon(
                                isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                color: palette.accentPrimary,
                                size: 28,
                              ),
                              onPressed: playerService.togglePlayPause,
                            );
                          },
                        ),

                        // Next
                        IconButton(
                          icon: Icon(
                            Icons.skip_next_rounded,
                            color: palette.textPrimary,
                            size: 24,
                          ),
                          onPressed: playerService.next,
                        ),
                      ],
                    ),
                  ),

                  // Mini linear progress indicator
                  ValueListenableBuilder<Duration>(
                    valueListenable: playerService.positionNotifier,
                    builder: (context, pos, _) {
                      return ValueListenableBuilder<Duration>(
                        valueListenable: playerService.durationNotifier,
                        builder: (context, dur, _) {
                          final totalMs = dur.inMilliseconds;
                          final double progress = totalMs > 0
                              ? (pos.inMilliseconds / totalMs).clamp(0.0, 1.0)
                              : 0.0;
                          return LinearProgressIndicator(
                            value: progress,
                            minHeight: 2.0,
                            backgroundColor: palette.surfaceVariant,
                            valueColor: AlwaysStoppedAnimation<Color>(palette.accentPrimary),
                          );
                        },
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildThumbnail(Track track) {
    if (track.artworkPath != null && File(track.artworkPath!).existsSync()) {
      return Image.file(File(track.artworkPath!), fit: BoxFit.cover);
    } else if (track.artworkUrl != null) {
      return Image.network(track.artworkUrl!, fit: BoxFit.cover);
    }
    return Container(
      color: palette.cardBackground,
      child: Icon(Icons.music_note_rounded, color: palette.accentPrimary),
    );
  }
}
