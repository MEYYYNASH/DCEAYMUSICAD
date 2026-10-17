import 'dart:io';
import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';

class AlbumsView extends StatelessWidget {
  final List<Track> tracks;
  final AppPalette palette;

  const AlbumsView({
    super.key,
    required this.tracks,
    required this.palette,
  });

  @override
  Widget build(BuildContext context) {
    // Group tracks by album
    final albumMap = <String, List<Track>>{};
    for (final track in tracks) {
      albumMap.putIfAbsent(track.album, () => []).add(track);
    }
    final albums = albumMap.keys.toList()..sort();

    if (albums.isEmpty) {
      return Center(
        child: Text('No albums found', style: TextStyle(color: palette.textSecondary)),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.8,
      ),
      itemCount: albums.length,
      itemBuilder: (context, index) {
        final albumName = albums[index];
        final albumTracks = albumMap[albumName]!;
        final firstTrack = albumTracks.first;

        return GestureDetector(
          onTap: () {
            AudioPlayerService().setQueue(albumTracks);
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    width: double.infinity,
                    color: palette.cardBackground,
                    child: _buildArtwork(firstTrack),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                albumName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  color: palette.textPrimary,
                ),
              ),
              Text(
                '${albumTracks.length} tracks • ${firstTrack.artist}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, color: palette.textSecondary),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildArtwork(Track track) {
    if (track.artworkPath != null && File(track.artworkPath!).existsSync()) {
      return Image.file(File(track.artworkPath!), fit: BoxFit.cover);
    } else if (track.artworkUrl != null) {
      return Image.network(track.artworkUrl!, fit: BoxFit.cover);
    }
    return Center(
      child: Icon(Icons.album_rounded, size: 48, color: palette.accentPrimary),
    );
  }
}
