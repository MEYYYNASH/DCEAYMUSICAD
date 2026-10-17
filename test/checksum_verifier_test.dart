import 'package:flutter_test/flutter_test.dart';
import 'package:dceay/services/github_updates/checksum_verifier.dart';

void main() {
  group('Checksum Verifier Tests', () {
    test('Verifies identical SHA-256 digests case-insensitively', () {
      const hash1 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const hash2 = 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855';
      expect(ChecksumVerifier.verify(hash1, hash2), isTrue);
    });

    test('Rejects mismatched SHA-256 digests', () {
      const valid = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const invalid = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      expect(ChecksumVerifier.verify(valid, invalid), isFalse);
    });

    test('Extracts SHA-256 hash from release body or .sha256 file format', () {
      const shaFile = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  DCEAY-release.apk';
      final extracted = ChecksumVerifier.extractHashFromSha256File(shaFile);
      expect(extracted, equals('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));
    });
  });
}
