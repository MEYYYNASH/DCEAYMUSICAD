import 'dart:io';
import 'package:crypto/crypto.dart';

class ChecksumVerifier {
  static Future<String> calculateSha256(File file) async {
    final stream = file.openRead();
    final digest = await sha256.bind(stream).first;
    return digest.toString().toLowerCase();
  }

  static bool verify(String calculatedHash, String expectedHash) {
    final cleanCalculated = calculatedHash.trim().toLowerCase();
    final cleanExpected = expectedHash.trim().toLowerCase();
    return cleanCalculated == cleanExpected;
  }

  static String? extractHashFromSha256File(String content) {
    final regex = RegExp(r'([a-fA-F0-9]{64})');
    final match = regex.firstMatch(content);
    return match?.group(1)?.toLowerCase();
  }
}
