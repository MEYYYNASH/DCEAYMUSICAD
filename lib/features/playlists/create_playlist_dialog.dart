import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/database/track_dao.dart';

class CreatePlaylistDialog extends StatefulWidget {
  final AppPalette palette;
  final VoidCallback onCreated;

  const CreatePlaylistDialog({
    super.key,
    required this.palette,
    required this.onCreated,
  });

  @override
  State<CreatePlaylistDialog> createState() => _CreatePlaylistDialogState();
}

class _CreatePlaylistDialogState extends State<CreatePlaylistDialog> {
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _trackDao = TrackDao();

  Future<void> _create() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) return;

    final playlist = Playlist(
      id: 'pl_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      description: _descController.text.trim().isNotEmpty
          ? _descController.text.trim()
          : null,
      createdAt: DateTime.now().millisecondsSinceEpoch,
    );

    await _trackDao.createPlaylist(playlist);
    widget.onCreated();
    if (mounted) Navigator.pop(context);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
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
        'New Playlist',
        style: TextStyle(
          fontWeight: FontWeight.w700,
          color: widget.palette.textPrimary,
        ),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _nameController,
            style: TextStyle(color: widget.palette.textPrimary),
            decoration: InputDecoration(
              hintText: 'Playlist Name',
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
          TextField(
            controller: _descController,
            style: TextStyle(color: widget.palette.textPrimary),
            decoration: InputDecoration(
              hintText: 'Optional description',
              hintStyle: TextStyle(color: widget.palette.textSecondary),
              filled: true,
              fillColor: widget.palette.cardBackground,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: widget.palette.border),
              ),
            ),
          ),
        ],
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
          onPressed: _create,
          child: const Text('Create'),
        ),
      ],
    );
  }
}
