import 'package:flutter_test/flutter_test.dart';
import 'package:dceay/services/audio/audio_models.dart';

void main() {
  group('Queue Management & Repeat Models Tests', () {
    final track1 = Track(
      id: '1',
      title: 'Track One',
      artist: 'Artist A',
      album: 'Album X',
      duration: const Duration(minutes: 3),
      dateAdded: 1000,
    );

    final track2 = Track(
      id: '2',
      title: 'Track Two',
      artist: 'Artist B',
      album: 'Album Y',
      duration: const Duration(minutes: 4),
      dateAdded: 2000,
    );

    final track3 = Track(
      id: '3',
      title: 'Track Three',
      artist: 'Artist C',
      album: 'Album Z',
      duration: const Duration(minutes: 2),
      dateAdded: 3000,
    );

    test('Queue maintains track ordering and supports reordering', () {
      final queue = [track1, track2, track3];
      expect(queue.length, equals(3));
      expect(queue[0].id, equals('1'));

      // Reorder track 0 to position 2
      final item = queue.removeAt(0);
      queue.insert(2, item);

      expect(queue[0].id, equals('2'));
      expect(queue[1].id, equals('3'));
      expect(queue[2].id, equals('1'));
    });

    test('RepeatMode enum supports off, all, and one modes', () {
      expect(PlaybackRepeatMode.values.length, equals(3));
      expect(PlaybackRepeatMode.off.name, equals('off'));
      expect(PlaybackRepeatMode.all.name, equals('all'));
      expect(PlaybackRepeatMode.one.name, equals('one'));
    });
  });
}
