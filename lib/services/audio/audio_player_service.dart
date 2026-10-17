import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_session/audio_session.dart';
import 'audio_models.dart';
import '../../core/utils/logger.dart';
import '../database/track_dao.dart';

class AudioPlayerService {
  static final AudioPlayerService _instance = AudioPlayerService._internal();
  factory AudioPlayerService() => _instance;

  late final AudioPlayer _player;
  final TrackDao _trackDao = TrackDao();

  final ValueNotifier<Track?> currentTrackNotifier = ValueNotifier<Track?>(null);
  final ValueNotifier<bool> isPlayingNotifier = ValueNotifier<bool>(false);
  final ValueNotifier<Duration> positionNotifier = ValueNotifier<Duration>(Duration.zero);
  final ValueNotifier<Duration> durationNotifier = ValueNotifier<Duration>(Duration.zero);
  final ValueNotifier<Duration> bufferedNotifier = ValueNotifier<Duration>(Duration.zero);
  final ValueNotifier<List<Track>> queueNotifier = ValueNotifier<List<Track>>([]);
  final ValueNotifier<int> currentIndexNotifier = ValueNotifier<int>(-1);
  final ValueNotifier<bool> isShuffleNotifier = ValueNotifier<bool>(false);
  final ValueNotifier<PlaybackRepeatMode> repeatModeNotifier =
      ValueNotifier<PlaybackRepeatMode>(PlaybackRepeatMode.off);

  // Audio Effects settings
  final ValueNotifier<bool> equalizerEnabledNotifier = ValueNotifier<bool>(false);
  final ValueNotifier<double> bassBoostNotifier = ValueNotifier<double>(0.0);
  final ValueNotifier<double> playbackSpeedNotifier = ValueNotifier<double>(1.0);

  List<Track> _originalQueue = [];
  StreamSubscription? _posSub;
  StreamSubscription? _durSub;
  StreamSubscription? _bufSub;
  StreamSubscription? _stateSub;

  AudioPlayerService._internal() {
    _player = AudioPlayer();
    _initAudioSession();
    _listenToPlayerEvents();
  }

  Future<void> _initAudioSession() async {
    try {
      final session = await AudioSession.instance;
      await session.configure(const AudioSessionConfiguration.music());

      session.interruptionEventStream.listen((event) {
        if (event.begin) {
          switch (event.type) {
            case AudioInterruptionType.duck:
              _player.setVolume(0.5);
              break;
            case AudioInterruptionType.pause:
            case AudioInterruptionType.unknown:
              pause();
              break;
          }
        } else {
          switch (event.type) {
            case AudioInterruptionType.duck:
              _player.setVolume(1.0);
              break;
            case AudioInterruptionType.pause:
              play();
              break;
            case AudioInterruptionType.unknown:
              break;
          }
        }
      });

      session.becomingNoisyEventStream.listen((_) {
        pause();
      });
    } catch (e) {
      AppLogger.warn('AudioSession init error: $e');
    }
  }

  void _listenToPlayerEvents() {
    _stateSub = _player.playerStateStream.listen((state) {
      isPlayingNotifier.value = state.playing;
      if (state.processingState == ProcessingState.completed) {
        _handleTrackCompleted();
      }
    });

    _posSub = _player.positionStream.listen((pos) {
      positionNotifier.value = pos;
    });

    _durSub = _player.durationStream.listen((dur) {
      if (dur != null) {
        durationNotifier.value = dur;
      }
    });

    _bufSub = _player.bufferedPositionStream.listen((buf) {
      bufferedNotifier.value = buf;
    });
  }

  Future<void> setQueue(List<Track> tracks, {int initialIndex = 0}) async {
    if (tracks.isEmpty) return;
    _originalQueue = List<Track>.from(tracks);
    queueNotifier.value = List<Track>.from(tracks);
    if (isShuffleNotifier.value) {
      _applyShuffle(initialIndex: initialIndex);
    } else {
      await playTrackAtIndex(initialIndex);
    }
  }

  Future<void> playTrackAtIndex(int index) async {
    final queue = queueNotifier.value;
    if (index < 0 || index >= queue.length) return;

    final track = queue[index];
    currentIndexNotifier.value = index;
    currentTrackNotifier.value = track;

    try {
      if (track.audioPath != null && track.audioPath!.isNotEmpty) {
        if (track.audioPath!.startsWith('http://') || track.audioPath!.startsWith('https://')) {
          await _player.setUrl(track.audioPath!);
        } else {
          await _player.setFilePath(track.audioPath!);
        }
        await _player.play();
      } else {
        // Fallback for metadata or simulated tracks without a direct local file
        durationNotifier.value = track.duration;
        _simulatePlaybackProgress(track);
      }

      await _trackDao.recordPlayed(track.id);
    } catch (e) {
      AppLogger.error('Playback error for track ${track.title}', error: e);
    }
  }

  Timer? _mockTimer;
  void _simulatePlaybackProgress(Track track) {
    _mockTimer?.cancel();
    isPlayingNotifier.value = true;
    positionNotifier.value = Duration.zero;

    _mockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!isPlayingNotifier.value) return;
      final newPos = positionNotifier.value + const Duration(seconds: 1);
      if (newPos >= track.duration) {
        timer.cancel();
        _handleTrackCompleted();
      } else {
        positionNotifier.value = newPos;
      }
    });
  }

  Future<void> play() async {
    if (currentTrackNotifier.value == null && queueNotifier.value.isNotEmpty) {
      await playTrackAtIndex(0);
      return;
    }
    isPlayingNotifier.value = true;
    try {
      await _player.play();
    } catch (_) {}
  }

  Future<void> pause() async {
    isPlayingNotifier.value = false;
    try {
      await _player.pause();
    } catch (_) {}
  }

  Future<void> togglePlayPause() async {
    if (isPlayingNotifier.value) {
      await pause();
    } else {
      await play();
    }
  }

  Future<void> seek(Duration position) async {
    positionNotifier.value = position;
    try {
      await _player.seek(position);
    } catch (_) {}
  }

  Future<void> next() async {
    final queue = queueNotifier.value;
    if (queue.isEmpty) return;

    final nextIndex = currentIndexNotifier.value + 1;
    if (nextIndex < queue.length) {
      await playTrackAtIndex(nextIndex);
    } else if (repeatModeNotifier.value == PlaybackRepeatMode.all) {
      await playTrackAtIndex(0);
    } else {
      await pause();
      await seek(Duration.zero);
    }
  }

  Future<void> previous() async {
    if (positionNotifier.value.inSeconds > 3) {
      await seek(Duration.zero);
      return;
    }

    final prevIndex = currentIndexNotifier.value - 1;
    if (prevIndex >= 0) {
      await playTrackAtIndex(prevIndex);
    } else {
      await seek(Duration.zero);
    }
  }

  void _handleTrackCompleted() {
    switch (repeatModeNotifier.value) {
      case PlaybackRepeatMode.one:
        seek(Duration.zero);
        play();
        break;
      case PlaybackRepeatMode.all:
      case PlaybackRepeatMode.off:
        next();
        break;
    }
  }

  void toggleShuffle() {
    final newShuffle = !isShuffleNotifier.value;
    isShuffleNotifier.value = newShuffle;
    if (newShuffle) {
      _applyShuffle();
    } else {
      _restoreOriginalOrder();
    }
  }

  void _applyShuffle({int? initialIndex}) {
    final current = currentTrackNotifier.value;
    final list = List<Track>.from(_originalQueue);
    if (current != null) {
      list.removeWhere((t) => t.id == current.id);
      list.shuffle(Random());
      list.insert(0, current);
      queueNotifier.value = list;
      currentIndexNotifier.value = 0;
    } else {
      list.shuffle(Random());
      queueNotifier.value = list;
      if (initialIndex != null && initialIndex < list.length) {
        playTrackAtIndex(initialIndex);
      }
    }
  }

  void _restoreOriginalOrder() {
    final current = currentTrackNotifier.value;
    queueNotifier.value = List<Track>.from(_originalQueue);
    if (current != null) {
      final index = queueNotifier.value.indexWhere((t) => t.id == current.id);
      currentIndexNotifier.value = index >= 0 ? index : 0;
    }
  }

  void cycleRepeatMode() {
    switch (repeatModeNotifier.value) {
      case PlaybackRepeatMode.off:
        repeatModeNotifier.value = PlaybackRepeatMode.all;
        break;
      case PlaybackRepeatMode.all:
        repeatModeNotifier.value = PlaybackRepeatMode.one;
        break;
      case PlaybackRepeatMode.one:
        repeatModeNotifier.value = PlaybackRepeatMode.off;
        break;
    }
  }

  void setPlaybackSpeed(double speed) {
    playbackSpeedNotifier.value = speed;
    _player.setSpeed(speed);
  }

  void toggleEqualizer(bool enabled) {
    equalizerEnabledNotifier.value = enabled;
  }

  void setBassBoost(double value) {
    bassBoostNotifier.value = value;
  }

  void reorderQueue(int oldIndex, int newIndex) {
    final queue = List<Track>.from(queueNotifier.value);
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final item = queue.removeAt(oldIndex);
    queue.insert(newIndex, item);
    queueNotifier.value = queue;

    final current = currentTrackNotifier.value;
    if (current != null) {
      currentIndexNotifier.value = queue.indexWhere((t) => t.id == current.id);
    }
  }

  void removeFromQueue(int index) {
    final queue = List<Track>.from(queueNotifier.value);
    if (index < 0 || index >= queue.length) return;
    queue.removeAt(index);
    queueNotifier.value = queue;

    final current = currentTrackNotifier.value;
    if (current != null) {
      currentIndexNotifier.value = queue.indexWhere((t) => t.id == current.id);
    }
  }

  void dispose() {
    _mockTimer?.cancel();
    _posSub?.cancel();
    _durSub?.cancel();
    _bufSub?.cancel();
    _stateSub?.cancel();
    _player.dispose();
  }
}
