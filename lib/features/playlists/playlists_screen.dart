import 'package:flutter/material.dart';
import '../../core/animations/transitions.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/database/track_dao.dart';
import 'create_playlist_dialog.dart';
import 'playlist_detail_screen.dart';

class PlaylistsScreen extends StatefulWidget {
  final AppPalette palette;

  const PlaylistsScreen({super.key, required this.palette});

  @override
  State<PlaylistsScreen> createState() => _PlaylistsScreenState();
}

class _PlaylistsScreenState extends State<PlaylistsScreen> {
  final TrackDao _trackDao = TrackDao();
  List<Playlist> _playlists = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlaylists();
  }

  Future<void> _loadPlaylists() async {
    setState(() => _isLoading = true);
    final list = await _trackDao.getPlaylists();
    setState(() {
      _playlists = list;
      _isLoading = false;
    });
  }

  void _openCreateDialog() {
    showDialog(
      context: context,
      builder: (context) => CreatePlaylistDialog(
        palette: widget.palette,
        onCreated: _loadPlaylists,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.palette.background,
      appBar: AppBar(
        title: const Text('Playlists'),
        actions: [
          IconButton(
            icon: Icon(Icons.add_rounded, color: widget.palette.accentPrimary),
            onPressed: _openCreateDialog,
          ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: widget.palette.accentPrimary))
          : _playlists.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.queue_music_rounded, size: 64, color: widget.palette.textSecondary),
                      const SizedBox(height: 16),
                      Text(
                        'No playlists yet',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: widget.palette.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Create playlists to organize your favorite music collections.',
                        style: TextStyle(color: widget.palette.textSecondary),
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: widget.palette.accentPrimary,
                          foregroundColor: Colors.black,
                        ),
                        icon: const Icon(Icons.add_rounded),
                        label: const Text('Create Playlist'),
                        onPressed: _openCreateDialog,
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
                  itemCount: _playlists.length,
                  itemBuilder: (context, index) {
                    final playlist = _playlists[index];
                    return Card(
                      color: widget.palette.cardBackground,
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: widget.palette.border.withValues(alpha: 0.3)),
                      ),
                      child: ListTile(
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: widget.palette.surfaceVariant,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.queue_music_rounded, color: widget.palette.accentPrimary),
                        ),
                        title: Text(
                          playlist.name,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: widget.palette.textPrimary,
                          ),
                        ),
                        subtitle: Text(
                          '${playlist.trackCount} tracks',
                          style: TextStyle(fontSize: 12, color: widget.palette.textSecondary),
                        ),
                        trailing: const Icon(Icons.chevron_right_rounded),
                        onTap: () async {
                          await Navigator.push(
                            context,
                            SmoothTransitions.slideUpRoute(
                              PlaylistDetailScreen(
                                playlist: playlist,
                                palette: widget.palette,
                              ),
                            ),
                          );
                          _loadPlaylists();
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
