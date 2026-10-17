import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';

class ArtistsView extends StatelessWidget {
  final List<Track> tracks;
  final AppPalette palette;

  const ArtistsView({
    super.key,
    required this.tracks,
    required this.palette,
  });

  @override
  Widget build(BuildContext context) {
    // Group tracks by artist
    final artistMap = <String, List<Track>>{};
    for (final track in tracks) {
      artistMap.putIfAbsent(track.artist, () => []).add(track);
    }
    final artists = artistMap.keys.toList()..sort();

    if (artists.isEmpty) {
      return Center(
        child: Text('No artists found', style: TextStyle(color: palette.textSecondary)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 120),
      itemCount: artists.length,
      itemBuilder: (context, index) {
        final artist = artists[index];
        final artistTracks = artistMap[artist]!;

        return ListTile(
          leading: CircleAvatar(
            backgroundColor: palette.cardBackground,
            child: Icon(Icons.person_rounded, color: palette.accentPrimary),
          ),
          title: Text(
            artist,
            style: TextStyle(fontWeight: FontWeight.w600, color: palette.textPrimary),
          ),
          subtitle: Text(
            '${artistTracks.length} tracks',
            style: TextStyle(color: palette.textSecondary, fontSize: 13),
          ),
          trailing: const Icon(Icons.chevron_right_rounded),
          onTap: () {
            AudioPlayerService().setQueue(artistTracks);
          },
        );
      },
    );
  }
}
