import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../core/theme/text_styles.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';
import 'lrc_parser.dart';
import 'lyric_editor_dialog.dart';

class LyricsView extends StatefulWidget {
  final Track track;
  final AppPalette palette;

  const LyricsView({
    super.key,
    required this.track,
    required this.palette,
  });

  @override
  State<LyricsView> createState() => _LyricsViewState();
}

class _LyricsViewState extends State<LyricsView> {
  late final ScrollController _scrollController;
  final AudioPlayerService _audioService = AudioPlayerService();

  ParsedLyrics _parsedLyrics = const ParsedLyrics(lines: []);
  int _lastActiveIndex = -1;
  double _fontSize = 20.0;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _parseLyrics();
    _audioService.positionNotifier.addListener(_onPositionChanged);
  }

  @override
  void didUpdateWidget(covariant LyricsView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.track.id != widget.track.id ||
        oldWidget.track.lrcContent != widget.track.lrcContent) {
      _parseLyrics();
    }
  }

  void _parseLyrics() {
    if (widget.track.lrcContent != null && widget.track.lrcContent!.isNotEmpty) {
      _parsedLyrics = LrcParser.parse(widget.track.lrcContent!);
    } else {
      _parsedLyrics = const ParsedLyrics(lines: []);
    }
    setState(() {});
  }

  void _onPositionChanged() {
    if (_parsedLyrics.isEmpty) return;

    final position = _audioService.positionNotifier.value;
    final activeIndex = _parsedLyrics.getCurrentIndex(position);

    if (activeIndex != _lastActiveIndex && activeIndex >= 0) {
      _lastActiveIndex = activeIndex;
      _scrollToActiveLine(activeIndex);
      if (mounted) setState(() {});
    }
  }

  void _scrollToActiveLine(int index) {
    if (!_scrollController.hasClients) return;
    const itemHeight = 56.0;
    final offset = (index * itemHeight) - 120.0;
    _scrollController.animateTo(
      offset.clamp(0.0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
    );
  }

  @override
  void dispose() {
    _audioService.positionNotifier.removeListener(_onPositionChanged);
    _scrollController.dispose();
    super.dispose();
  }

  void _openEditor() {
    showDialog(
      context: context,
      builder: (context) => LyricEditorDialog(
        track: widget.track,
        palette: widget.palette,
        onLyricsSaved: (newLyrics) {
          setState(() {
            _parsedLyrics = LrcParser.parse(newLyrics);
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_parsedLyrics.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.lyrics_outlined, size: 64, color: widget.palette.textSecondary),
              const SizedBox(height: 16),
              Text(
                'No Synchronized Lyrics',
                style: AppTextStyles.headingMedium(widget.palette.textPrimary),
              ),
              const SizedBox(height: 8),
              Text(
                'Import an LRC file or add timed lyrics to sing along in real-time.',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMedium(widget.palette.textSecondary),
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: widget.palette.accentPrimary,
                  foregroundColor: Colors.black,
                ),
                icon: const Icon(Icons.add_rounded),
                label: const Text('Add or Import Lyrics'),
                onPressed: _openEditor,
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        // Controls header: Font sizing & Edit
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.text_decrease_rounded, size: 20),
                    color: widget.palette.textSecondary,
                    onPressed: () {
                      if (_fontSize > 14) {
                        setState(() => _fontSize -= 2);
                      }
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.text_increase_rounded, size: 20),
                    color: widget.palette.textSecondary,
                    onPressed: () {
                      if (_fontSize < 32) {
                        setState(() => _fontSize += 2);
                      }
                    },
                  ),
                ],
              ),
              TextButton.icon(
                icon: Icon(Icons.edit_note_rounded, size: 18, color: widget.palette.accentPrimary),
                label: Text('Edit', style: TextStyle(color: widget.palette.accentPrimary)),
                onPressed: _openEditor,
              ),
            ],
          ),
        ),

        // Synchronized list
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            itemCount: _parsedLyrics.lines.length,
            itemBuilder: (context, index) {
              final line = _parsedLyrics.lines[index];
              final isCurrent = index == _lastActiveIndex;

              return InkWell(
                onTap: () => _audioService.seek(line.timestamp),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                  child: AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 250),
                    style: AppTextStyles.lyricLine(
                      isCurrent ? widget.palette.accentPrimary : widget.palette.textSecondary,
                      fontSize: isCurrent ? _fontSize + 2 : _fontSize,
                      isCurrent: isCurrent,
                    ),
                    child: Text(
                      line.text.isNotEmpty ? line.text : '♪ ♪ ♪',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
