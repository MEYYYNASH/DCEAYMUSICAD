import 'package:flutter_test/flutter_test.dart';
import 'package:dceay/services/audio/audio_models.dart';

void main() {
  group('Audio Models Serialization Tests', () {
    test('Track correctly serializes to and from Map', () {
      final track = Track(
        id: 'track_test_1',
        title: 'Cyber Anthem',
        artist: 'Neon Wave',
        album: 'Future Horizon',
        duration: const Duration(minutes: 3, seconds: 45),
        audioPath: '/storage/emulated/0/Music/cyber.mp3',
        lrcContent: '[00:10.00]Hello Cyber',
        hasLyrics: true,
        source: TrackSource.local,
        dateAdded: 1690000000,
        isFavorite: true,
        playCount: 15,
      );

      final map = track.toMap();
      expect(map['id'], equals('track_test_1'));
      expect(map['title'], equals('Cyber Anthem'));
      expect(map['is_favorite'], equals(1));
      expect(map['has_lyrics'], equals(1));
      expect(map['duration_ms'], equals(225000));

      final restored = Track.fromMap(map);
      expect(restored.id, equals(track.id));
      expect(restored.title, equals(track.title));
      expect(restored.artist, equals(track.artist));
      expect(restored.duration, equals(track.duration));
      expect(restored.hasLyrics, isTrue);
      expect(restored.isFavorite, isTrue);
      expect(restored.playCount, equals(15));
    });

    test('Playlist correctly serializes to and from Map', () {
      final playlist = Playlist(
        id: 'pl_01',
        name: 'Late Night Synth',
        description: 'Atmospheric vibes',
        createdAt: 1700000000,
        trackCount: 42,
      );

      final map = playlist.toMap();
      expect(map['id'], equals('pl_01'));
      expect(map['name'], equals('Late Night Synth'));

      final restored = Playlist.fromMap(map, trackCount: 42);
      expect(restored.id, equals('pl_01'));
      expect(restored.name, equals('Late Night Synth'));
      expect(restored.description, equals('Atmospheric vibes'));
      expect(restored.trackCount, equals(42));
    });
  });
}
