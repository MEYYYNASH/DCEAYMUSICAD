import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';
import '../../services/database/track_dao.dart';
import '../library/songs_view.dart';

class PlaylistDetailScreen extends StatefulWidget {
  final Playlist playlist;
  final AppPalette palette;

  const PlaylistDetailScreen({
    super.key,
    required this.playlist,
    required this.palette,
  });

  @override
  State<PlaylistDetailScreen> createState() => _PlaylistDetailScreenState();
}

class _PlaylistDetailScreenState extends State<PlaylistDetailScreen> {
  final TrackDao _trackDao = TrackDao();
  final AudioPlayerService _audioService = AudioPlayerService();

  List<Track> _tracks = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlaylistTracks();
  }

  Future<void> _loadPlaylistTracks() async {
    setState(() => _isLoading = true);
    final tracks = await _trackDao.getTracksForPlaylist(widget.playlist.id);
    setState(() {
      _tracks = tracks;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.palette.background,
      appBar: AppBar(
        title: Text(widget.playlist.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded),
            onPressed: () async {
              await _trackDao.deletePlaylist(widget.playlist.id);
              if (mounted) Navigator.pop(context);
            },
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: widget.palette.accentPrimary))
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Row(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          color: widget.palette.cardBackground,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(
                          Icons.queue_music_rounded,
                          size: 36,
                          color: widget.palette.accentPrimary,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.playlist.name,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: widget.palette.textPrimary,
                              ),
                            ),
                            if (widget.playlist.description != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                widget.playlist.description!,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: widget.palette.textSecondary,
                                ),
                              ),
                            ],
                            const SizedBox(height: 4),
                            Text(
                              '${_tracks.length} tracks',
                              style: TextStyle(
                                fontSize: 12,
                                color: widget.palette.accentPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (_tracks.isNotEmpty)
                        IconButton.filled(
                          style: IconButton.styleFrom(
                            backgroundColor: widget.palette.accentPrimary,
                            foregroundColor: Colors.black,
                          ),
                          icon: const Icon(Icons.play_arrow_rounded, size: 28),
                          onPressed: () => _audioService.setQueue(_tracks),
                        ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Expanded(
                  child: SongsView(
                    tracks: _tracks,
                    palette: widget.palette,
                    onRefresh: _loadPlaylistTracks,
                  ),
                ),
              ],
            ),
    );
  }
}
