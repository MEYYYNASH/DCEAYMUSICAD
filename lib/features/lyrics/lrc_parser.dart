class LyricWord {
  final Duration startTime;
  final Duration? endTime;
  final String text;

  const LyricWord({
    required this.startTime,
    this.endTime,
    required this.text,
  });
}

class LyricLine implements Comparable<LyricLine> {
  final Duration timestamp;
  final String text;
  final List<LyricWord> words;

  const LyricLine({
    required this.timestamp,
    required this.text,
    this.words = const [],
  });

  bool get hasWordTimings => words.isNotEmpty;

  @override
  int compareTo(LyricLine other) => timestamp.compareTo(other.timestamp);
}

class ParsedLyrics {
  final List<LyricLine> lines;
  final Duration offset;
  final String? title;
  final String? artist;
  final String? album;

  const ParsedLyrics({
    required this.lines,
    this.offset = Duration.zero,
    this.title,
    this.artist,
    this.album,
  });

  bool get isEmpty => lines.isEmpty;
  bool get isNotEmpty => lines.isNotEmpty;

  int getCurrentIndex(Duration position) {
    if (lines.isEmpty) return -1;
    final adjustedPos = position + offset;
    if (adjustedPos < lines.first.timestamp) return -1;

    for (int i = 0; i < lines.length; i++) {
      if (i == lines.length - 1) {
        return i;
      }
      if (adjustedPos >= lines[i].timestamp && adjustedPos < lines[i + 1].timestamp) {
        return i;
      }
    }
    return lines.length - 1;
  }
}

class LrcParser {
  static final RegExp _tagRegex = RegExp(r'\[([a-zA-Z]+):([^\]]*)\]');
  static final RegExp _timestampRegex = RegExp(r'\[(\d{1,2}):(\d{1,2})(?:[\.:](\d{1,3}))?\]');
  static final RegExp _wordTimingRegex = RegExp(r'<(\d{1,2}):(\d{1,2})(?:[\.:](\d{1,3}))?>([^<]*)');

  static ParsedLyrics parse(String lrcContent, {Duration manualOffset = Duration.zero}) {
    if (lrcContent.trim().isEmpty) {
      return const ParsedLyrics(lines: []);
    }

    final rawLines = lrcContent.split(RegExp(r'\r?\n'));
    final parsedLines = <LyricLine>[];
    Duration fileOffset = Duration.zero;
    String? title;
    String? artist;
    String? album;

    for (final rawLine in rawLines) {
      final line = rawLine.trim();
      if (line.isEmpty) continue;

      // Check metadata tags
      final tagMatch = _tagRegex.firstMatch(line);
      if (tagMatch != null) {
        final key = tagMatch.group(1)?.toLowerCase();
        final value = tagMatch.group(2)?.trim() ?? '';
        if (key == 'ti') title = value;
        if (key == 'ar') artist = value;
        if (key == 'al') album = value;
        if (key == 'offset') {
          final offsetMs = int.tryParse(value) ?? 0;
          fileOffset = Duration(milliseconds: offsetMs);
        }
      }

      // Find all timestamps in this line (handles multiple timestamps like [00:10.00][00:20.00]Line)
      final timestampMatches = _timestampRegex.allMatches(line).toList();
      if (timestampMatches.isEmpty) continue;

      // Extract the lyric text after all timestamp tags
      final lastTimestamp = timestampMatches.last;
      final textPart = line.substring(lastTimestamp.end).trim();

      // Check for word-level / syllable-level timestamps: <00:10.50>word
      final wordMatches = _wordTimingRegex.allMatches(textPart).toList();
      final words = <LyricWord>[];
      String cleanText = textPart;

      if (wordMatches.isNotEmpty) {
        final buffer = StringBuffer();
        for (final wm in wordMatches) {
          final min = int.tryParse(wm.group(1) ?? '0') ?? 0;
          final sec = int.tryParse(wm.group(2) ?? '0') ?? 0;
          final milliStr = wm.group(3) ?? '0';
          final milli = _parseMilliseconds(milliStr);
          final wordTime = Duration(minutes: min, seconds: sec, milliseconds: milli);
          final wordText = wm.group(4) ?? '';
          buffer.write(wordText);
          words.add(LyricWord(startTime: wordTime, text: wordText));
        }
        cleanText = buffer.toString().trim();
      }

      // Add a LyricLine for each timestamp tag on this line
      for (final tm in timestampMatches) {
        final min = int.tryParse(tm.group(1) ?? '0') ?? 0;
        final sec = int.tryParse(tm.group(2) ?? '0') ?? 0;
        final milliStr = tm.group(3) ?? '0';
        final milli = _parseMilliseconds(milliStr);
        final timestamp = Duration(minutes: min, seconds: sec, milliseconds: milli);

        parsedLines.add(LyricLine(
          timestamp: timestamp,
          text: cleanText,
          words: words,
        ));
      }
    }

    parsedLines.sort();

    return ParsedLyrics(
      lines: parsedLines,
      offset: fileOffset + manualOffset,
      title: title,
      artist: artist,
      album: album,
    );
  }

  static int _parseMilliseconds(String milliStr) {
    if (milliStr.length == 1) {
      return (int.tryParse(milliStr) ?? 0) * 100;
    } else if (milliStr.length == 2) {
      return (int.tryParse(milliStr) ?? 0) * 10;
    } else {
      return int.tryParse(milliStr.substring(0, 3)) ?? 0;
    }
  }
}
