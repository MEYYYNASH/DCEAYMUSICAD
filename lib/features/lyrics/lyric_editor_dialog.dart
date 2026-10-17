import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';
import '../../services/database/track_dao.dart';
import '../import/file_import_service.dart';

class LyricEditorDialog extends StatefulWidget {
  final Track track;
  final AppPalette palette;
  final ValueChanged<String> onLyricsSaved;

  const LyricEditorDialog({
    super.key,
    required this.track,
    required this.palette,
    required this.onLyricsSaved,
  });

  @override
  State<LyricEditorDialog> createState() => _LyricEditorDialogState();
}

class _LyricEditorDialogState extends State<LyricEditorDialog> {
  late final TextEditingController _textController;
  final TrackDao _trackDao = TrackDao();
  final FileImportService _importService = FileImportService();
  int _offsetMs = 0;

  @override
  void initState() {
    super.initState();
    _textController = TextEditingController(text: widget.track.lrcContent ?? '');
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _importLrcFile() async {
    final content = await _importService.pickLrcFile();
    if (content != null) {
      setState(() {
        _textController.text = content;
      });
    }
  }

  Future<void> _save() async {
    final text = _textController.text.trim();
    await _trackDao.updateLyrics(widget.track.id, text);
    widget.onLyricsSaved(text);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: widget.palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: widget.palette.border),
      ),
      title: Text(
        'Edit Synchronized Lyrics',
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: widget.palette.textPrimary,
        ),
      ),
      content: SingleChildScrollView(
        child: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Paste LRC format text with timestamps (e.g. [00:12.30] Lyric line) or import from file.',
                style: TextStyle(fontSize: 12, color: widget.palette.textSecondary),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: widget.palette.accentPrimary,
                  side: BorderSide(color: widget.palette.accentPrimary),
                ),
                icon: const Icon(Icons.file_upload_outlined, size: 18),
                label: const Text('Import .LRC File'),
                onPressed: _importLrcFile,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _textController,
                maxLines: 10,
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: widget.palette.textPrimary,
                ),
                decoration: InputDecoration(
                  hintText: '[00:00.00] Song Title\n[00:15.50] First synchronized verse...',
                  hintStyle: TextStyle(color: widget.palette.textSecondary),
                  filled: true,
                  fillColor: widget.palette.cardBackground,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: widget.palette.border),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Offset calibration: $_offsetMs ms',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: widget.palette.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: [
                  _offsetChip('-200ms', -200),
                  _offsetChip('-50ms', -50),
                  _offsetChip('0ms', 0),
                  _offsetChip('+50ms', 50),
                  _offsetChip('+200ms', 200),
                ],
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('Cancel', style: TextStyle(color: widget.palette.textSecondary)),
        ),
        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: widget.palette.accentPrimary,
            foregroundColor: Colors.black,
          ),
          onPressed: _save,
          child: const Text('Save Lyrics'),
        ),
      ],
    );
  }

  Widget _offsetChip(String label, int value) {
    final isSelected = _offsetMs == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: widget.palette.accentPrimary.withValues(alpha: 0.2),
      onSelected: (_) {
        setState(() {
          _offsetMs = value;
        });
      },
      labelStyle: TextStyle(
        fontSize: 11,
        color: isSelected ? widget.palette.accentPrimary : widget.palette.textSecondary,
      ),
    );
  }
}
