import 'package:sqflite/sqflite.dart';
import '../audio/audio_models.dart';
import 'app_database.dart';

class TrackDao {
  final AppDatabase _dbProvider = AppDatabase();

  Future<void> insertTrack(Track track) async {
    final db = await _dbProvider.database;
    await db.insert(
      'tracks',
      track.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> insertTracks(List<Track> tracks) async {
    final db = await _dbProvider.database;
    final batch = db.batch();
    for (final track in tracks) {
      batch.insert(
        'tracks',
        track.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    }
    await batch.commit(noResult: true);
  }

  Future<List<Track>> getAllTracks() async {
    final db = await _dbProvider.database;
    final results = await db.query('tracks', orderBy: 'date_added DESC');
    return results.map(Track.fromMap).toList();
  }

  Future<List<Track>> getFavoriteTracks() async {
    final db = await _dbProvider.database;
    final results = await db.query(
      'tracks',
      where: 'is_favorite = 1',
      orderBy: 'title ASC',
    );
    return results.map(Track.fromMap).toList();
  }

  Future<void> toggleFavorite(String trackId, bool isFavorite) async {
    final db = await _dbProvider.database;
    await db.update(
      'tracks',
      {'is_favorite': isFavorite ? 1 : 0},
      where: 'id = ?',
      whereArgs: [trackId],
    );
  }

  Future<List<Track>> getRecentlyPlayedTracks({int limit = 30}) async {
    final db = await _dbProvider.database;
    final results = await db.rawQuery('''
      SELECT t.* FROM tracks t
      INNER JOIN recently_played rp ON t.id = rp.track_id
      ORDER BY rp.played_at DESC
      LIMIT ?
    ''', [limit]);
    return results.map(Track.fromMap).toList();
  }

  Future<void> recordPlayed(String trackId) async {
    final db = await _dbProvider.database;
    final now = DateTime.now().millisecondsSinceEpoch;
    await db.insert(
      'recently_played',
      {'track_id': trackId, 'played_at': now},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    await db.rawUpdate('''
      UPDATE tracks SET play_count = play_count + 1 WHERE id = ?
    ''', [trackId]);
  }

  Future<List<Track>> getMostPlayedTracks({int limit = 20}) async {
    final db = await _dbProvider.database;
    final results = await db.query(
      'tracks',
      where: 'play_count > 0',
      orderBy: 'play_count DESC',
      limit: limit,
    );
    return results.map(Track.fromMap).toList();
  }

  Future<List<Track>> searchTracks(String query) async {
    final db = await _dbProvider.database;
    final cleanQuery = '%$query%';
    final results = await db.query(
      'tracks',
      where: 'title LIKE ? OR artist LIKE ? OR album LIKE ?',
      whereArgs: [cleanQuery, cleanQuery, cleanQuery],
      orderBy: 'title ASC',
    );
    return results.map(Track.fromMap).toList();
  }

  Future<void> updateLyrics(String trackId, String lrcContent) async {
    final db = await _dbProvider.database;
    await db.update(
      'tracks',
      {
        'lrc_content': lrcContent,
        'has_lyrics': lrcContent.trim().isNotEmpty ? 1 : 0,
      },
      where: 'id = ?',
      whereArgs: [trackId],
    );
  }

  Future<void> deleteTrack(String trackId) async {
    final db = await _dbProvider.database;
    await db.delete('tracks', where: 'id = ?', whereArgs: [trackId]);
  }

  // Playlists
  Future<void> createPlaylist(Playlist playlist) async {
    final db = await _dbProvider.database;
    await db.insert('playlists', playlist.toMap());
  }

  Future<List<Playlist>> getPlaylists() async {
    final db = await _dbProvider.database;
    final results = await db.rawQuery('''
      SELECT p.*, COUNT(pt.track_id) as track_count
      FROM playlists p
      LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    ''');
    return results.map((m) => Playlist.fromMap(m, trackCount: (m['track_count'] as int?) ?? 0)).toList();
  }

  Future<void> addTrackToPlaylist(String playlistId, String trackId) async {
    final db = await _dbProvider.database;
    final countResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM playlist_tracks WHERE playlist_id = ?',
      [playlistId],
    );
    final count = Sqflite.firstIntValue(countResult) ?? 0;
    await db.insert('playlist_tracks', {
      'playlist_id': playlistId,
      'track_id': trackId,
      'sort_order': count,
    }, conflictAlgorithm: ConflictAlgorithm.ignore);
  }

  Future<List<Track>> getTracksForPlaylist(String playlistId) async {
    final db = await _dbProvider.database;
    final results = await db.rawQuery('''
      SELECT t.* FROM tracks t
      INNER JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ?
      ORDER BY pt.sort_order ASC
    ''', [playlistId]);
    return results.map(Track.fromMap).toList();
  }

  Future<void> deletePlaylist(String playlistId) async {
    final db = await _dbProvider.database;
    await db.delete('playlists', where: 'id = ?', whereArgs: [playlistId]);
    await db.delete('playlist_tracks', where: 'playlist_id = ?', whereArgs: [playlistId]);
  }
}
