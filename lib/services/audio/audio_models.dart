enum TrackSource {
  local,
  spotifyMeta,
  youTubeMeta,
  streamUrl,
}

enum PlaybackRepeatMode {
  off,
  all,
  one,
}

class Track {
  final String id;
  final String title;
  final String artist;
  final String album;
  final Duration duration;
  final String? audioPath;
  final String? artworkPath;
  final String? artworkUrl;
  final String? lrcContent;
  final bool hasLyrics;
  final TrackSource source;
  final int dateAdded;
  final bool isFavorite;
  final int playCount;

  const Track({
    required this.id,
    required this.title,
    required this.artist,
    required this.album,
    required this.duration,
    this.audioPath,
    this.artworkPath,
    this.artworkUrl,
    this.lrcContent,
    this.hasLyrics = false,
    this.source = TrackSource.local,
    required this.dateAdded,
    this.isFavorite = false,
    this.playCount = 0,
  });

  Track copyWith({
    String? id,
    String? title,
    String? artist,
    String? album,
    Duration? duration,
    String? audioPath,
    String? artworkPath,
    String? artworkUrl,
    String? lrcContent,
    bool? hasLyrics,
    TrackSource? source,
    int? dateAdded,
    bool? isFavorite,
    int? playCount,
  }) {
    return Track(
      id: id ?? this.id,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      album: album ?? this.album,
      duration: duration ?? this.duration,
      audioPath: audioPath ?? this.audioPath,
      artworkPath: artworkPath ?? this.artworkPath,
      artworkUrl: artworkUrl ?? this.artworkUrl,
      lrcContent: lrcContent ?? this.lrcContent,
      hasLyrics: hasLyrics ?? this.hasLyrics,
      source: source ?? this.source,
      dateAdded: dateAdded ?? this.dateAdded,
      isFavorite: isFavorite ?? this.isFavorite,
      playCount: playCount ?? this.playCount,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'artist': artist,
      'album': album,
      'duration_ms': duration.inMilliseconds,
      'audio_path': audioPath,
      'artwork_path': artworkPath,
      'artwork_url': artworkUrl,
      'lrc_content': lrcContent,
      'has_lyrics': hasLyrics ? 1 : 0,
      'source': source.name,
      'date_added': dateAdded,
      'is_favorite': isFavorite ? 1 : 0,
      'play_count': playCount,
    };
  }

  factory Track.fromMap(Map<String, dynamic> map) {
    return Track(
      id: map['id'] as String,
      title: map['title'] as String,
      artist: map['artist'] as String,
      album: map['album'] as String,
      duration: Duration(milliseconds: (map['duration_ms'] as int?) ?? 0),
      audioPath: map['audio_path'] as String?,
      artworkPath: map['artwork_path'] as String?,
      artworkUrl: map['artwork_url'] as String?,
      lrcContent: map['lrc_content'] as String?,
      hasLyrics: (map['has_lyrics'] as int?) == 1,
      source: TrackSource.values.firstWhere(
        (e) => e.name == map['source'],
        orElse: () => TrackSource.local,
      ),
      dateAdded: (map['date_added'] as int?) ?? DateTime.now().millisecondsSinceEpoch,
      isFavorite: (map['is_favorite'] as int?) == 1,
      playCount: (map['play_count'] as int?) ?? 0,
    );
  }
}

class Playlist {
  final String id;
  final String name;
  final String? description;
  final int createdAt;
  final int trackCount;

  const Playlist({
    required this.id,
    required this.name,
    this.description,
    required this.createdAt,
    this.trackCount = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'created_at': createdAt,
    };
  }

  factory Playlist.fromMap(Map<String, dynamic> map, {int trackCount = 0}) {
    return Playlist(
      id: map['id'] as String,
      name: map['name'] as String,
      description: map['description'] as String?,
      createdAt: (map['created_at'] as int?) ?? DateTime.now().millisecondsSinceEpoch,
      trackCount: trackCount,
    );
  }
}
