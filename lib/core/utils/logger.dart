import 'dart:developer' as developer;

class AppLogger {
  static void info(String message, {String tag = 'DCEAY'}) {
    developer.log('[INFO] $message', name: tag);
  }

  static void warn(String message, {String tag = 'DCEAY'}) {
    developer.log('[WARN] $message', name: tag);
  }

  static void error(String message, {Object? error, StackTrace? stackTrace, String tag = 'DCEAY'}) {
    developer.log('[ERROR] $message', name: tag, error: error, stackTrace: stackTrace);
  }
}
