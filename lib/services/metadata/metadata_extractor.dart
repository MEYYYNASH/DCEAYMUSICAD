import 'dart:io';
import 'package:path/path.dart' as p;
import '../audio/audio_models.dart';

class MetadataExtractor {
  static Track extractFromLocalFile(File file) {
    final fileName = p.basenameWithoutExtension(file.path);
    final ext = p.extension(file.path).toLowerCase();

    String title = fileName;
    String artist = 'Unknown Artist';
    String album = 'Local Audio';

    // Parse typical "Artist - Title" filename convention
    if (fileName.contains(' - ')) {
      final parts = fileName.split(' - ');
      artist = parts[0].trim();
      title = parts.sublist(1).join(' - ').trim();
    }

    final id = 'local_${file.path.hashCode.abs()}';

    // Check for paired .lrc file in the same directory
    final lrcPath = p.setExtension(file.path, '.lrc');
    String? lrcContent;
    final lrcFile = File(lrcPath);
    if (lrcFile.existsSync()) {
      try {
        lrcContent = lrcFile.readAsStringSync();
      } catch (_) {}
    }

    return Track(
      id: id,
      title: title,
      artist: artist,
      album: album,
      duration: const Duration(minutes: 3, seconds: 30), // Default fallback
      audioPath: file.path,
      lrcContent: lrcContent,
      hasLyrics: lrcContent != null && lrcContent.isNotEmpty,
      source: TrackSource.local,
      dateAdded: DateTime.now().millisecondsSinceEpoch,
    );
  }
}
