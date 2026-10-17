import 'dart:io';
import 'package:file_picker/file_picker.dart';
import '../../core/utils/logger.dart';
import '../../services/audio/audio_models.dart';
import '../../services/database/track_dao.dart';
import '../../services/metadata/metadata_extractor.dart';

class FileImportService {
  final TrackDao _trackDao = TrackDao();

  Future<List<Track>> pickAndImportAudioFiles() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.custom,
        allowedExtensions: ['mp3', 'flac', 'wav', 'm4a', 'aac', 'ogg', 'opus'],
      );

      if (result == null || result.files.isEmpty) {
        return [];
      }

      final existingTracks = await _trackDao.getAllTracks();
      final existingPaths = existingTracks.map((t) => t.audioPath).toSet();

      final newTracks = <Track>[];
      for (final file in result.files) {
        if (file.path == null) continue;
        if (existingPaths.contains(file.path)) {
          AppLogger.info('Skipping duplicate file: ${file.name}');
          continue;
        }

        final localFile = File(file.path!);
        if (await localFile.exists()) {
          final track = MetadataExtractor.extractFromLocalFile(localFile);
          newTracks.add(track);
        }
      }

      if (newTracks.isNotEmpty) {
        await _trackDao.insertTracks(newTracks);
      }

      return newTracks;
    } catch (e) {
      AppLogger.error('Failed to import audio files', error: e);
      return [];
    }
  }

  Future<String?> pickLrcFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['lrc', 'txt'],
      );

      if (result == null || result.files.isEmpty || result.files.first.path == null) {
        return null;
      }

      final file = File(result.files.first.path!);
      if (await file.exists()) {
        return await file.readAsString();
      }
    } catch (e) {
      AppLogger.error('Failed to pick LRC file', error: e);
    }
    return null;
  }
}
