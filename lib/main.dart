import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:audio_service/audio_service.dart';
import 'app/app.dart';
import 'core/utils/logger.dart';
import 'services/audio/audio_handler.dart';
import 'services/database/app_database.dart';

late AudioHandler audioHandler;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Configure edge-to-edge system bars
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Initialize SQLite Database
  try {
    await AppDatabase().database;
  } catch (e) {
    AppLogger.error('Failed to initialize local database', error: e);
  }

  // Initialize AudioService for background playback & notifications
  try {
    audioHandler = await AudioService.init(
      builder: () => DCEAYAudioHandler(),
      config: const AudioServiceConfig(
        androidNotificationChannelId: 'com.xeceay.music.playback',
        androidNotificationChannelName: 'DCEAY Music Playback',
        androidNotificationOngoing: true,
        androidStopForegroundOnPause: true,
      ),
    );
  } catch (e) {
    AppLogger.error('AudioService initialization error', error: e);
  }

  runApp(const DCEAYApp());
}
