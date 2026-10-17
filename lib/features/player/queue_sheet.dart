import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/audio/audio_player_service.dart';

class QueueSheet extends StatelessWidget {
  final AppPalette palette;

  const QueueSheet({super.key, required this.palette});

  @override
  Widget build(BuildContext context) {
    final playerService = AudioPlayerService();

    return Container(
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: palette.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Now Playing Queue',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: palette.textPrimary,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, color: palette.textSecondary),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ValueListenableBuilder<List<Track>>(
              valueListenable: playerService.queueNotifier,
              builder: (context, queue, _) {
                if (queue.isEmpty) {
                  return Center(
                    child: Text(
                      'Queue is empty',
                      style: TextStyle(color: palette.textSecondary),
                    ),
                  );
                }

                return ValueListenableBuilder<int>(
                  valueListenable: playerService.currentIndexNotifier,
                  builder: (context, currentIndex, _) {
                    return ReorderableListView.builder(
                      itemCount: queue.length,
                      onReorder: playerService.reorderQueue,
                      itemBuilder: (context, index) {
                        final track = queue[index];
                        final isCurrent = index == currentIndex;

                        return Dismissible(
                          key: ValueKey('${track.id}_$index'),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            color: Colors.redAccent.withValues(alpha: 0.8),
                            child: const Icon(Icons.delete_outline_rounded, color: Colors.white),
                          ),
                          onDismissed: (_) => playerService.removeFromQueue(index),
                          child: ListTile(
                            leading: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: palette.cardBackground,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: isCurrent
                                  ? Icon(Icons.volume_up_rounded, color: palette.accentPrimary)
                                  : Icon(Icons.music_note_rounded, color: palette.textSecondary),
                            ),
                            title: Text(
                              track.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                                color: isCurrent ? palette.accentPrimary : palette.textPrimary,
                              ),
                            ),
                            subtitle: Text(
                              track.artist,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 13,
                                color: palette.textSecondary,
                              ),
                            ),
                            trailing: ReorderableDragStartListener(
                              index: index,
                              child: Icon(Icons.drag_handle_rounded, color: palette.textSecondary),
                            ),
                            onTap: () => playerService.playTrackAtIndex(index),
                          ),
                        );
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
