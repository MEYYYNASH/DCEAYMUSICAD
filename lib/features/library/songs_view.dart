import 'dart:io';
import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';
import '../../services/database/track_dao.dart';

class SongsView extends StatelessWidget {
  final List<Track> tracks;
  final AppPalette palette;
  final VoidCallback onRefresh;

  const SongsView({
    super.key,
    required this.tracks,
    required this.palette,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final playerService = AudioPlayerService();
    final trackDao = TrackDao();

    if (tracks.isEmpty) {
      return Center(
        child: Text(
          'No songs in library',
          style: TextStyle(color: palette.textSecondary),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 120),
      itemCount: tracks.length,
      itemBuilder: (context, index) {
        final track = tracks[index];

        return ListTile(
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 48,
              height: 48,
              child: _buildThumbnail(track),
            ),
          ),
          title: Text(
            track.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: palette.textPrimary,
            ),
          ),
          subtitle: Row(
            children: [
              if (track.hasLyrics)
                Container(
                  margin: const EdgeInsets.only(right: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: palette.accentPrimary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'LYRICS',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: palette.accentPrimary,
                    ),
                  ),
                ),
              Expanded(
                child: Text(
                  '${track.artist} • ${track.album}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, color: palette.textSecondary),
                ),
              ),
            ],
          ),
          trailing: IconButton(
            icon: Icon(
              track.isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              color: track.isFavorite ? Colors.redAccent : palette.textSecondary,
              size: 20,
            ),
            onPressed: () async {
              await trackDao.toggleFavorite(track.id, !track.isFavorite);
              onRefresh();
            },
          ),
          onTap: () {
            playerService.setQueue(tracks, initialIndex: index);
          },
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
      child: Icon(Icons.music_note_rounded, color: palette.accentPrimary, size: 24),
    );
  }
}
