import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/animations/disc_rotation.dart';
import '../../core/theme/color_palette.dart';
import '../../core/theme/text_styles.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';
import '../lyrics/lyrics_view.dart';
import 'player_controls.dart';
import 'progress_bar.dart';
import 'queue_sheet.dart';

class NowPlayingScreen extends StatefulWidget {
  final AppPalette palette;

  const NowPlayingScreen({super.key, required this.palette});

  @override
  State<NowPlayingScreen> createState() => _NowPlayingScreenState();
}

class _NowPlayingScreenState extends State<NowPlayingScreen> {
  final AudioPlayerService _audioService = AudioPlayerService();
  bool _showLyrics = false;
  bool _useDiscMode = false;

  void _openQueueSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FractionallySizedBox(
        heightFactor: 0.75,
        child: QueueSheet(palette: widget.palette),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<Track?>(
      valueListenable: _audioService.currentTrackNotifier,
      builder: (context, track, _) {
        if (track == null) {
          return Scaffold(
            backgroundColor: widget.palette.background,
            body: Center(
              child: Text(
                'No track playing',
                style: TextStyle(color: widget.palette.textSecondary),
              ),
            ),
          );
        }

        return GestureDetector(
          onHorizontalDragEnd: (details) {
            if (details.primaryVelocity != null) {
              if (details.primaryVelocity! < -300) {
                _audioService.next();
              } else if (details.primaryVelocity! > 300) {
                _audioService.previous();
              }
            }
          },
          child: Scaffold(
            backgroundColor: widget.palette.background,
            body: Stack(
              children: [
                // 1. Dynamic Blurred Background Layer
                _buildBlurredBackground(track),

                // 2. Main Content
                SafeArea(
                  child: Column(
                    children: [
                      // Top Navigation App Bar
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 32),
                              color: widget.palette.textPrimary,
                              onPressed: () => Navigator.pop(context),
                            ),
                            Column(
                              children: [
                                Text(
                                  'PLAYING FROM PLAYLIST',
                                  style: AppTextStyles.label(widget.palette.textSecondary),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  track.album,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: widget.palette.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                            IconButton(
                              icon: Icon(
                                _useDiscMode ? Icons.album_rounded : Icons.crop_square_rounded,
                                color: widget.palette.textSecondary,
                              ),
                              onPressed: () {
                                setState(() => _useDiscMode = !_useDiscMode);
                              },
                            ),
                          ],
                        ),
                      ),

                      // Center Area: Large Artwork or Synchronized Lyrics
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 350),
                          child: _showLyrics
                              ? LyricsView(
                                  key: const ValueKey('lyrics_view'),
                                  track: track,
                                  palette: widget.palette,
                                )
                              : _buildArtworkSection(track),
                        ),
                      ),

                      // Track Metadata Header
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    track.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppTextStyles.headingLarge(widget.palette.textPrimary),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    track.artist,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: AppTextStyles.bodyLarge(widget.palette.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: Icon(
                                track.isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                color: track.isFavorite ? Colors.redAccent : widget.palette.textSecondary,
                              ),
                              onPressed: () {
                                // Toggle favorite in DB
                              },
                            ),
                          ],
                        ),
                      ),

                      // Seek Slider
                      ValueListenableBuilder<Duration>(
                        valueListenable: _audioService.positionNotifier,
                        builder: (context, position, _) {
                          return ValueListenableBuilder<Duration>(
                            valueListenable: _audioService.durationNotifier,
                            builder: (context, duration, _) {
                              return ValueListenableBuilder<Duration>(
                                valueListenable: _audioService.bufferedNotifier,
                                builder: (context, buffered, _) {
                                  return DCEAYProgressBar(
                                    position: position,
                                    duration: duration,
                                    buffered: buffered,
                                    palette: widget.palette,
                                    onSeek: _audioService.seek,
                                  );
                                },
                              );
                            },
                          );
                        },
                      ),

                      const SizedBox(height: 12),

                      // Controls
                      DCEAYPlayerControls(
                        palette: widget.palette,
                        isLyricsVisible: _showLyrics,
                        onToggleLyrics: () {
                          setState(() => _showLyrics = !_showLyrics);
                        },
                        onOpenQueue: _openQueueSheet,
                      ),

                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBlurredBackground(Track track) {
    return Positioned.fill(
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (track.artworkPath != null && File(track.artworkPath!).existsSync())
            Image.file(File(track.artworkPath!), fit: BoxFit.cover)
          else if (track.artworkUrl != null)
            Image.network(track.artworkUrl!, fit: BoxFit.cover)
          else
            Container(color: widget.palette.surface),
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 45, sigmaY: 45),
            child: Container(
              color: widget.palette.background.withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildArtworkSection(Track track) {
    return Center(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final size = constraints.maxWidth * 0.78;

          Widget artworkImage;
          if (track.artworkPath != null && File(track.artworkPath!).existsSync()) {
            artworkImage = Image.file(File(track.artworkPath!), fit: BoxFit.cover);
          } else if (track.artworkUrl != null) {
            artworkImage = Image.network(track.artworkUrl!, fit: BoxFit.cover);
          } else {
            artworkImage = Container(
              color: widget.palette.cardBackground,
              child: Icon(
                Icons.music_note_rounded,
                size: size * 0.35,
                color: widget.palette.accentPrimary,
              ),
            );
          }

          if (_useDiscMode) {
            return ValueListenableBuilder<bool>(
              valueListenable: _audioService.isPlayingNotifier,
              builder: (context, isPlaying, _) {
                return RotatingDisc(
                  isPlaying: isPlaying,
                  child: Container(
                    width: size,
                    height: size,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: widget.palette.accentPrimary.withValues(alpha: 0.25),
                          blurRadius: 30,
                          spreadRadius: 4,
                        ),
                      ],
                    ),
                    child: ClipOval(child: artworkImage),
                  ),
                );
              },
            );
          }

          return Hero(
            tag: 'artwork_${track.id}',
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.5),
                    blurRadius: 28,
                    offset: const Offset(0, 14),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: artworkImage,
              ),
            ),
          );
        },
      ),
    );
  }
}
