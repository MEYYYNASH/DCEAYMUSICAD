import 'package:flutter_test/flutter_test.dart';
import 'package:dceay/features/lyrics/lrc_parser.dart';

void main() {
  group('LRC Parser Tests', () {
    test('Parses standard line-by-line LRC timestamps', () {
      const lrc = '''
[ti:Midnight Drive]
[ar:DCEAY Artist]
[00:05.00]First line of the song
[00:10.50]Second synchronized lyric line
[00:20.00]Guitar solo begins
''';

      final parsed = LrcParser.parse(lrc);
      expect(parsed.lines.length, equals(3));
      expect(parsed.title, equals('Midnight Drive'));
      expect(parsed.artist, equals('DCEAY Artist'));

      expect(parsed.lines[0].timestamp, equals(const Duration(seconds: 5)));
      expect(parsed.lines[0].text, equals('First line of the song'));

      expect(parsed.lines[1].timestamp, equals(const Duration(seconds: 10, milliseconds: 500)));
      expect(parsed.lines[1].text, equals('Second synchronized lyric line'));

      expect(parsed.lines[2].timestamp, equals(const Duration(seconds: 20)));
    });

    test('Handles multiple timestamps on a single line and sorts correctly', () {
      const lrc = '''
[00:15.00][00:45.00]Chorus repeating twice
''';

      final parsed = LrcParser.parse(lrc);
      expect(parsed.lines.length, equals(2));
      expect(parsed.lines[0].timestamp, equals(const Duration(seconds: 15)));
      expect(parsed.lines[0].text, equals('Chorus repeating twice'));
      expect(parsed.lines[1].timestamp, equals(const Duration(seconds: 45)));
      expect(parsed.lines[1].text, equals('Chorus repeating twice'));
    });

    test('Parses offset metadata and applies manual offset adjustment', () {
      const lrc = '''
[offset:+500]
[00:10.00]Offset line
''';

      final parsed = LrcParser.parse(lrc, manualOffset: const Duration(milliseconds: 200));
      // total offset should be 500 + 200 = 700ms
      expect(parsed.offset, equals(const Duration(milliseconds: 700)));
    });

    test('Gracefully handles empty and missing lyrics', () {
      final parsedEmpty = LrcParser.parse('');
      expect(parsedEmpty.isEmpty, isTrue);
      expect(parsedEmpty.lines, isEmpty);
      expect(parsedEmpty.getCurrentIndex(const Duration(seconds: 5)), equals(-1));

      final parsedWhitespace = LrcParser.parse('   \n\n  ');
      expect(parsedWhitespace.isEmpty, isTrue);
    });

    test('Binary search finds correct active lyric line at given position', () {
      const lrc = '''
[00:00.00]Intro
[00:10.00]Verse 1
[00:20.00]Chorus
[00:30.00]Outro
''';

      final parsed = LrcParser.parse(lrc);

      expect(parsed.getCurrentIndex(const Duration(seconds: 0)), equals(0));
      expect(parsed.getCurrentIndex(const Duration(seconds: 5)), equals(0));
      expect(parsed.getCurrentIndex(const Duration(seconds: 10)), equals(1));
      expect(parsed.getCurrentIndex(const Duration(seconds: 15)), equals(1));
      expect(parsed.getCurrentIndex(const Duration(seconds: 25)), equals(2));
      expect(parsed.getCurrentIndex(const Duration(seconds: 35)), equals(3));
    });
  });
}
