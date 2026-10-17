import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';

class DCEAYPlayerControls extends StatelessWidget {
  final AppPalette palette;
  final VoidCallback onOpenQueue;
  final VoidCallback onToggleLyrics;
  final bool isLyricsVisible;

  const DCEAYPlayerControls({
    super.key,
    required this.palette,
    required this.onOpenQueue,
    required this.onToggleLyrics,
    this.isLyricsVisible = false,
  });

  @override
  Widget build(BuildContext context) {
    final playerService = AudioPlayerService();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Secondary actions row: Shuffle, Lyrics, Queue, Repeat
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Shuffle
              ValueListenableBuilder<bool>(
                valueListenable: playerService.isShuffleNotifier,
                builder: (context, isShuffle, _) {
                  return IconButton(
                    icon: Icon(
                      Icons.shuffle_rounded,
                      color: isShuffle ? palette.accentPrimary : palette.textSecondary,
                    ),
                    onPressed: playerService.toggleShuffle,
                  );
                },
              ),

              // Lyrics Button
              ValueListenableBuilder<Track?>(
                valueListenable: playerService.currentTrackNotifier,
                builder: (context, track, _) {
                  final hasLyrics = track?.hasLyrics ?? false;
                  return TextButton.icon(
                    style: TextButton.styleFrom(
                      backgroundColor: isLyricsVisible
                          ? palette.accentPrimary.withValues(alpha: 0.2)
                          : Colors.transparent,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(
                          color: isLyricsVisible ? palette.accentPrimary : palette.border,
                        ),
                      ),
                    ),
                    icon: Icon(
                      Icons.lyrics_rounded,
                      size: 16,
                      color: isLyricsVisible
                          ? palette.accentPrimary
                          : (hasLyrics ? palette.textPrimary : palette.textSecondary),
                    ),
                    label: Text(
                      'LYRICS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                        color: isLyricsVisible
                            ? palette.accentPrimary
                            : (hasLyrics ? palette.textPrimary : palette.textSecondary),
                      ),
                    ),
                    onPressed: onToggleLyrics,
                  );
                },
              ),

              // Queue Button
              IconButton(
                icon: Icon(
                  Icons.queue_music_rounded,
                  color: palette.textPrimary,
                ),
                onPressed: onOpenQueue,
              ),

              // Repeat mode
              ValueListenableBuilder<PlaybackRepeatMode>(
                valueListenable: playerService.repeatModeNotifier,
                builder: (context, repeatMode, _) {
                  IconData icon;
                  Color color;
                  switch (repeatMode) {
                    case PlaybackRepeatMode.off:
                      icon = Icons.repeat_rounded;
                      color = palette.textSecondary;
                      break;
                    case PlaybackRepeatMode.all:
                      icon = Icons.repeat_rounded;
                      color = palette.accentPrimary;
                      break;
                    case PlaybackRepeatMode.one:
                      icon = Icons.repeat_one_rounded;
                      color = palette.accentPrimary;
                      break;
                  }
                  return IconButton(
                    icon: Icon(icon, color: color),
                    onPressed: playerService.cycleRepeatMode,
                  );
                },
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Primary Playback Controls Row: Prev, Play/Pause, Next
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Previous
            IconButton(
              iconSize: 42,
              icon: Icon(
                Icons.skip_previous_rounded,
                color: palette.textPrimary,
              ),
              onPressed: playerService.previous,
            ),
            const SizedBox(width: 24),

            // Play / Pause FAB
            ValueListenableBuilder<bool>(
              valueListenable: playerService.isPlayingNotifier,
              builder: (context, isPlaying, _) {
                return Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [palette.accentPrimary, palette.accentSecondary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: palette.accentPrimary.withValues(alpha: 0.35),
                        blurRadius: 18,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: IconButton(
                    iconSize: 36,
                    icon: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                        key: ValueKey(isPlaying),
                        color: Colors.black,
                      ),
                    ),
                    onPressed: playerService.togglePlayPause,
                  ),
                );
              },
            ),
            const SizedBox(width: 24),

            // Next
            IconButton(
              iconSize: 42,
              icon: Icon(
                Icons.skip_next_rounded,
                color: palette.textPrimary,
              ),
              onPressed: playerService.next,
            ),
          ],
        ),
      ],
    );
  }
}
