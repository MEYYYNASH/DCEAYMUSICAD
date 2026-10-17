import 'dart:io';
import 'package:flutter/material.dart';
import '../../core/animations/transitions.dart';
import '../../core/theme/color_palette.dart';
import '../../core/theme/text_styles.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';
import '../../services/database/track_dao.dart';
import '../import/import_screen.dart';
import '../updates/update_center_screen.dart';

class HomeScreen extends StatefulWidget {
  final AppPalette palette;

  const HomeScreen({super.key, required this.palette});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TrackDao _trackDao = TrackDao();
  final AudioPlayerService _audioService = AudioPlayerService();

  List<Track> _recentlyPlayed = [];
  List<Track> _favorites = [];
  List<Track> _mostPlayed = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    setState(() => _isLoading = true);
    final recent = await _trackDao.getRecentlyPlayedTracks(limit: 10);
    final favs = await _trackDao.getFavoriteTracks();
    final most = await _trackDao.getMostPlayedTracks(limit: 10);

    setState(() {
      _recentlyPlayed = recent;
      _favorites = favs;
      _mostPlayed = most;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.palette.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: widget.palette.accentPrimary,
          onRefresh: _loadHomeData,
          child: CustomScrollView(
            slivers: [
              // Header Sliver
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'DCEAY',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                  foreground: Paint()
                                    ..shader = LinearGradient(
                                      colors: [
                                        widget.palette.accentPrimary,
                                        widget.palette.accentSecondary,
                                      ],
                                    ).createShader(const Rect.fromLTWH(0, 0, 160, 30)),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'ONE APP. ALL YOUR MUSIC.',
                                style: AppTextStyles.label(widget.palette.textSecondary),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: Icon(
                              Icons.system_update_alt_rounded,
                              color: widget.palette.accentPrimary,
                            ),
                            tooltip: 'Update Center',
                            onPressed: () {
                              Navigator.push(
                                context,
                                SmoothTransitions.slideUpRoute(
                                  UpdateCenterScreen(palette: widget.palette),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Quick action pills
                      Row(
                        children: [
                          Expanded(
                            child: _buildActionPill(
                              icon: Icons.add_to_photos_rounded,
                              label: 'Import Audio',
                              onTap: () async {
                                await Navigator.push(
                                  context,
                                  SmoothTransitions.slideUpRoute(
                                    ImportScreen(palette: widget.palette),
                                  ),
                                );
                                _loadHomeData();
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildActionPill(
                              icon: Icons.link_rounded,
                              label: 'Universal Links',
                              onTap: () {
                                Navigator.push(
                                  context,
                                  SmoothTransitions.slideUpRoute(
                                    ImportScreen(palette: widget.palette),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Recently Played Section
              if (_recentlyPlayed.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                    child: Text(
                      'Recently Played',
                      style: AppTextStyles.headingMedium(widget.palette.textPrimary),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 190,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _recentlyPlayed.length,
                      itemBuilder: (context, index) {
                        final track = _recentlyPlayed[index];
                        return _buildTrackCard(track, _recentlyPlayed, index);
                      },
                    ),
                  ),
                ),
              ],

              // Most Played Section
              if (_mostPlayed.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                    child: Text(
                      'Heavy Rotation',
                      style: AppTextStyles.headingMedium(widget.palette.textPrimary),
                    ),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final track = _mostPlayed[index];
                      return ListTile(
                        leading: _buildArtworkThumbnail(track),
                        title: Text(
                          track.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: widget.palette.textPrimary,
                          ),
                        ),
                        subtitle: Text(
                          '${track.artist} • ${track.playCount} plays',
                          style: TextStyle(color: widget.palette.textSecondary),
                        ),
                        trailing: IconButton(
                          icon: Icon(
                            Icons.play_circle_fill_rounded,
                            color: widget.palette.accentPrimary,
                            size: 32,
                          ),
                          onPressed: () {
                            _audioService.setQueue(_mostPlayed, initialIndex: index);
                          },
                        ),
                        onTap: () {
                          _audioService.setQueue(_mostPlayed, initialIndex: index);
                        },
                      );
                    },
                    childCount: _mostPlayed.length,
                  ),
                ),
              ],

              // Empty state when freshly installed
              if (!_isLoading && _recentlyPlayed.isEmpty && _mostPlayed.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.library_music_rounded,
                          size: 72,
                          color: widget.palette.textSecondary.withValues(alpha: 0.5),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Your Library is Empty',
                          style: AppTextStyles.headingMedium(widget.palette.textPrimary),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Import your local MP3/FLAC music or add links to begin.',
                          style: TextStyle(color: widget.palette.textSecondary),
                        ),
                        const SizedBox(height: 20),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: widget.palette.accentPrimary,
                            foregroundColor: Colors.black,
                          ),
                          icon: const Icon(Icons.file_upload_rounded),
                          label: const Text('Import Local Music'),
                          onPressed: () async {
                            await Navigator.push(
                              context,
                              SmoothTransitions.slideUpRoute(
                                ImportScreen(palette: widget.palette),
                              ),
                            );
                            _loadHomeData();
                          },
                        ),
                      ],
                    ),
                  ),
                ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionPill({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: widget.palette.cardBackground,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: widget.palette.hasDoubleBorder
                ? widget.palette.border
                : widget.palette.border.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: widget.palette.accentPrimary),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: widget.palette.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrackCard(Track track, List<Track> queue, int index) {
    return GestureDetector(
      onTap: () => _audioService.setQueue(queue, initialIndex: index),
      child: Container(
        width: 140,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 140,
                height: 140,
                child: _buildArtworkThumbnail(track),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              track.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: widget.palette.textPrimary,
              ),
            ),
            Text(
              track.artist,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                color: widget.palette.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildArtworkThumbnail(Track track) {
    if (track.artworkPath != null && File(track.artworkPath!).existsSync()) {
      return Image.file(File(track.artworkPath!), fit: BoxFit.cover);
    } else if (track.artworkUrl != null) {
      return Image.network(track.artworkUrl!, fit: BoxFit.cover);
    }
    return Container(
      color: widget.palette.cardBackground,
      child: Center(
        child: Icon(
          Icons.music_note_rounded,
          color: widget.palette.accentPrimary,
        ),
      ),
    );
  }
}
