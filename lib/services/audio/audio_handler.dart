import 'package:audio_service/audio_service.dart';
import 'audio_player_service.dart';
import 'audio_models.dart';

class DCEAYAudioHandler extends BaseAudioHandler with SeekHandler {
  final AudioPlayerService _audioService = AudioPlayerService();

  DCEAYAudioHandler() {
    _audioService.currentTrackNotifier.addListener(_syncMediaItem);
    _audioService.isPlayingNotifier.addListener(_syncPlaybackState);
    _audioService.positionNotifier.addListener(_syncPlaybackState);
  }

  void _syncMediaItem() {
    final track = _audioService.currentTrackNotifier.value;
    if (track == null) {
      mediaItem.add(null);
      return;
    }

    mediaItem.add(MediaItem(
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      artUri: track.artworkUrl != null
          ? Uri.tryParse(track.artworkUrl!)
          : (track.artworkPath != null ? Uri.file(track.artworkPath!) : null),
    ));
  }

  void _syncPlaybackState() {
    final isPlaying = _audioService.isPlayingNotifier.value;
    final position = _audioService.positionNotifier.value;
    final buffered = _audioService.bufferedNotifier.value;

    playbackState.add(PlaybackState(
      controls: [
        MediaControl.skipToPrevious,
        isPlaying ? MediaControl.pause : MediaControl.play,
        MediaControl.skipToNext,
        MediaControl.stop,
      ],
      systemActions: const {
        MediaAction.seek,
        MediaAction.seekForward,
        MediaAction.seekBackward,
      },
      androidCompactActions: const [0, 1, 2],
      processingState: AudioProcessingState.ready,
      playing: isPlaying,
      updatePosition: position,
      bufferedPosition: buffered,
      speed: _audioService.playbackSpeedNotifier.value,
    ));
  }

  @override
  Future<void> play() => _audioService.play();

  @override
  Future<void> pause() => _audioService.pause();

  @override
  Future<void> seek(Duration position) => _audioService.seek(position);

  @override
  Future<void> skipToNext() => _audioService.next();

  @override
  Future<void> skipToPrevious() => _audioService.previous();

  @override
  Future<void> stop() async {
    await _audioService.pause();
    playbackState.add(playbackState.value.copyWith(
      processingState: AudioProcessingState.idle,
    ));
  }
}
