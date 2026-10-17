import 'package:flutter_test/flutter_test.dart';
import 'package:dceay/services/github_updates/update_models.dart';

void main() {
  group('Version Comparison Tests', () {
    test('Correctly identifies newer versions', () {
      expect(VersionComparison.isNewer('2.2.0', '2.1.0'), isTrue);
      expect(VersionComparison.isNewer('v2.1.1', '2.1.0'), isTrue);
      expect(VersionComparison.isNewer('3.0.0', '2.1.0'), isTrue);
      expect(VersionComparison.isNewer('2.1.0', '2.1.0'), isFalse);
      expect(VersionComparison.isNewer('2.0.9', '2.1.0'), isFalse);
      expect(VersionComparison.isNewer('1.9.9', '2.1.0'), isFalse);
    });

    test('Ignores v prefix and handles mismatched component lengths', () {
      expect(VersionComparison.compare('v2.1', '2.1.0'), equals(0));
      expect(VersionComparison.compare('2.1.0.1', '2.1.0'), greaterThan(0));
      expect(VersionComparison.compare('2.1', '2.1.1'), lessThan(0));
    });
  });
}
