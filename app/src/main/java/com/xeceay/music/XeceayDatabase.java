package com.xeceay.music;

import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.net.Uri;
import android.os.Environment;
import android.os.StatFs;
import android.provider.MediaStore;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

public class XeceayDatabase extends SQLiteOpenHelper {

    private final Context appContext;

    public XeceayDatabase(Context context) {
        super(context, "xeceay_library.db", null, 3);
        this.appContext = context.getApplicationContext();
    }

    @Override
    public void onConfigure(SQLiteDatabase db) {
        super.onConfigure(db);
        db.setForeignKeyConstraintsEnabled(true);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL("CREATE TABLE Users (id TEXT PRIMARY KEY, displayName TEXT NOT NULL, email TEXT NOT NULL, createdAt INTEGER NOT NULL, preferences TEXT NOT NULL)");
        db.execSQL("CREATE TABLE Artists (id TEXT PRIMARY KEY, name TEXT NOT NULL, artworkUri TEXT, description TEXT)");
        db.execSQL("CREATE TABLE Albums (id TEXT PRIMARY KEY, title TEXT NOT NULL, artistId TEXT NOT NULL, artworkUri TEXT, releaseDate TEXT)");
        db.execSQL("CREATE TABLE Songs (id TEXT PRIMARY KEY, title TEXT NOT NULL, artistId TEXT NOT NULL, artistName TEXT NOT NULL, albumId TEXT NOT NULL, albumTitle TEXT NOT NULL, genre TEXT NOT NULL DEFAULT 'Electronic', duration INTEGER NOT NULL, format TEXT NOT NULL, fileSize INTEGER NOT NULL, artworkUri TEXT, sourceType TEXT NOT NULL, sourceReference TEXT NOT NULL, isFavorite INTEGER NOT NULL DEFAULT 0, addedAt INTEGER NOT NULL, fileHash TEXT)");
        db.execSQL("CREATE TABLE Playlists (id TEXT PRIMARY KEY, name TEXT NOT NULL, artworkUri TEXT, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, isSmartPlaylist INTEGER NOT NULL DEFAULT 0, isPinned INTEGER NOT NULL DEFAULT 0, smartRule TEXT)");
        db.execSQL("CREATE TABLE PlaylistSongs (playlistId TEXT NOT NULL, songId TEXT NOT NULL, position INTEGER NOT NULL, addedAt INTEGER NOT NULL, PRIMARY KEY (playlistId, songId), FOREIGN KEY (playlistId) REFERENCES Playlists(id) ON DELETE CASCADE, FOREIGN KEY (songId) REFERENCES Songs(id) ON DELETE CASCADE)");
        db.execSQL("CREATE TABLE Downloads (id TEXT PRIMARY KEY, songId TEXT, title TEXT NOT NULL, artist TEXT NOT NULL, artworkUri TEXT, sourceReference TEXT NOT NULL, destinationUri TEXT NOT NULL, mediaType TEXT NOT NULL DEFAULT 'audio', format TEXT NOT NULL DEFAULT 'MP3', quality TEXT NOT NULL DEFAULT '320kbps', status TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0, downloadedBytes INTEGER NOT NULL DEFAULT 0, fileSize INTEGER NOT NULL DEFAULT 0, speedBps INTEGER NOT NULL DEFAULT 0, createdAt INTEGER NOT NULL, completedAt INTEGER)");
        db.execSQL("CREATE TABLE PlaybackHistory (id TEXT PRIMARY KEY, songId TEXT NOT NULL UNIQUE, lastPosition INTEGER NOT NULL DEFAULT 0, playCount INTEGER NOT NULL DEFAULT 0, lastPlayedAt INTEGER NOT NULL, FOREIGN KEY (songId) REFERENCES Songs(id) ON DELETE CASCADE)");

        db.execSQL("CREATE INDEX idx_songs_title ON Songs(title)");
        db.execSQL("CREATE INDEX idx_songs_artist ON Songs(artistName)");
        db.execSQL("CREATE INDEX idx_songs_genre ON Songs(genre)");
        db.execSQL("CREATE INDEX idx_downloads_status ON Downloads(status)");
        db.execSQL("CREATE INDEX idx_history_lastplayed ON PlaybackHistory(lastPlayedAt DESC)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS PlaybackHistory");
        db.execSQL("DROP TABLE IF EXISTS Downloads");
        db.execSQL("DROP TABLE IF EXISTS PlaylistSongs");
        db.execSQL("DROP TABLE IF EXISTS Playlists");
        db.execSQL("DROP TABLE IF EXISTS Songs");
        db.execSQL("DROP TABLE IF EXISTS Albums");
        db.execSQL("DROP TABLE IF EXISTS Artists");
        db.execSQL("DROP TABLE IF EXISTS Users");
        onCreate(db);
    }

    public void initializeDefaultData() {
        SQLiteDatabase db = getWritableDatabase();
        long now = System.currentTimeMillis();
        try {
            boolean isFirstSetup = true;
            try (Cursor uc = db.rawQuery("SELECT COUNT(*) FROM Users", null)) {
                if (uc.moveToFirst() && uc.getInt(0) > 0) {
                    isFirstSetup = false;
                }
            }

            JSONObject prefs = new JSONObject();
            prefs.put("theme", "cyberpunk");
            prefs.put("audioQuality", "Hi-Res FLAC / 320kbps");
            prefs.put("eqPreset", "Normal");
            prefs.put("githubRepo", "MEYYYNASH/DCEAY");
            prefs.put("autoSync", true);

            db.execSQL(
                    "INSERT OR IGNORE INTO Users (id, displayName, email, createdAt, preferences) VALUES ('local_user', 'DCEAY Audiophile', 'listener@dceay.app', ?, ?)",
                    new Object[]{now, prefs.toString()}
            );

            // Purge any fake synthesized WAV seed tracks from SQLite and disk
            try {
                db.execSQL("DELETE FROM Songs WHERE format = 'WAV' AND (id LIKE 'seed_%' OR sourceReference LIKE '%xeceay_%.wav')");
                File musicDir = new File(appContext.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "XECEAY");
                if (musicDir.exists()) {
                    File[] fakeFiles = musicDir.listFiles((dir, name) -> name.startsWith("xeceay_") && name.endsWith(".wav"));
                    if (fakeFiles != null) {
                        for (File f : fakeFiles) f.delete();
                    }
                }
            } catch (Throwable ignored) {
            }

            // Purge any legacy "Fragments" / "Mr. Kitty" demo tracks from previous versions
            try {
                db.execSQL("DELETE FROM Songs WHERE id IN ('seed_1', 'seed_5') OR artistName LIKE '%Mr. Kitty%' OR albumTitle LIKE '%Fragments%' OR title IN ('Unstable', 'Insects', 'Heaven')");
                db.execSQL("DELETE FROM Albums WHERE title LIKE '%Fragments%'");
                db.execSQL("DELETE FROM Artists WHERE name LIKE '%Mr. Kitty%'");
                db.execSQL("DELETE FROM Playlists WHERE name LIKE '%Fragments%'");
            } catch (Throwable ignored) {
            }

            if (isFirstSetup) {
                String[][] defaultPlaylists = new String[][]{
                        {"pl_favorites", "Favorites", "favorites"},
                        {"pl_khmer_gold", "Khmer Top Hits 🇰🇭", "custom"},
                        {"pl_recent_played", "Recently Played", "recent_played"}
                };
                for (String[] pl : defaultPlaylists) {
                    int isSmart = "custom".equals(pl[2]) ? 0 : 1;
                    int isPinned = ("pl_favorites".equals(pl[0]) || "pl_khmer_gold".equals(pl[0])) ? 1 : 0;
                    db.execSQL(
                            "INSERT OR IGNORE INTO Playlists (id, name, artworkUri, createdAt, updatedAt, isSmartPlaylist, isPinned, smartRule) VALUES (?, ?, '', ?, ?, ?, ?, ?)",
                            new Object[]{pl[0], pl[1], now, now, isSmart, isPinned, pl[2]}
                    );
                }

                db.execSQL("INSERT OR IGNORE INTO PlaylistSongs (playlistId, songId, position, addedAt) VALUES ('pl_khmer_gold', 'seed_2', 0, ?)", new Object[]{now});
                db.execSQL("INSERT OR IGNORE INTO PlaylistSongs (playlistId, songId, position, addedAt) VALUES ('pl_khmer_gold', 'seed_3', 1, ?)", new Object[]{now});
                db.execSQL("INSERT OR IGNORE INTO PlaylistSongs (playlistId, songId, position, addedAt) VALUES ('pl_khmer_gold', 'seed_4', 2, ?)", new Object[]{now});
                db.execSQL("INSERT OR IGNORE INTO PlaylistSongs (playlistId, songId, position, addedAt) VALUES ('pl_khmer_gold', 'seed_6', 3, ?)", new Object[]{now});

                // Upgrade legacy artwork with letters to clean geometric emblem
                db.execSQL("UPDATE Songs SET artworkUri = ? WHERE artworkUri LIKE '%data:image/svg+xml%'",
                        new Object[]{buildGradientArtworkDataUri("XECEAY", "Hi-Fi", "#8B5CF6", "#22D3EE")});
            }
        } catch (Throwable ignored) {
        }
    }

    public int scanDeviceMediaStore() {
        int importedCount = 0;
        try {
            Uri uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
            String[] projection = new String[]{
                    MediaStore.Audio.Media._ID,
                    MediaStore.Audio.Media.TITLE,
                    MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.ALBUM,
                    MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.SIZE,
                    MediaStore.Audio.Media.MIME_TYPE
            };
            String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0 AND " + MediaStore.Audio.Media.DURATION + " >= 3000";
            try (Cursor cursor = appContext.getContentResolver().query(uri, projection, selection, null, MediaStore.Audio.Media.DATE_ADDED + " DESC")) {
                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                    int titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                    int artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                    int albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                    int durCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                    int sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
                    int mimeCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE);

                    SQLiteDatabase db = getWritableDatabase();
                    long now = System.currentTimeMillis();
                    while (cursor.moveToNext()) {
                        long mediaId = cursor.getLong(idCol);
                        String title = cursor.getString(titleCol);
                        if (title == null || title.trim().isEmpty()) title = "Track " + mediaId;
                        String artist = cursor.getString(artistCol);
                        if (artist == null || artist.trim().isEmpty() || "<unknown>".equals(artist)) artist = "Local Artist";
                        String album = cursor.getString(albumCol);
                        if (album == null || album.trim().isEmpty() || "<unknown>".equals(album)) album = "Device Audio";
                        long duration = Math.max(1000L, cursor.getLong(durCol));
                        long size = Math.max(0L, cursor.getLong(sizeCol));
                        String mime = cursor.getString(mimeCol);
                        if (mime == null) mime = "audio/mpeg";
                        String mLower = mime.toLowerCase();
                        String format = "MP3";
                        if (mLower.contains("flac")) format = "FLAC";
                        else if (mLower.contains("wav")) format = "WAV";
                        else if (mLower.contains("ogg")) format = "OGG";
                        else if (mLower.contains("opus")) format = "OPUS";
                        else if (mLower.contains("mp4") || mLower.contains("m4a")) format = "M4A";
                        else if (mLower.contains("aac")) format = "AAC";

                        String contentUri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, mediaId).toString();
                        String songId = "mediastore_" + mediaId;
                        String artistId = "artist_" + artist.toLowerCase().hashCode();
                        String albumId = "album_" + album.toLowerCase().hashCode();
                        String artwork = buildGradientArtworkDataUri(title, artist, "#8B5CF6", "#06B6D4");

                        db.execSQL("INSERT OR IGNORE INTO Artists (id, name, artworkUri, description) VALUES (?, ?, ?, ?)",
                                new Object[]{artistId, artist, artwork, "Local Device Artist"});
                        db.execSQL("INSERT OR IGNORE INTO Albums (id, title, artistId, artworkUri, releaseDate) VALUES (?, ?, ?, ?, ?)",
                                new Object[]{albumId, album, artistId, artwork, "Local"});

                        ContentValues cv = new ContentValues();
                        cv.put("id", songId);
                        cv.put("title", title);
                        cv.put("artistId", artistId);
                        cv.put("artistName", artist);
                        cv.put("albumId", albumId);
                        cv.put("albumTitle", album);
                        cv.put("genre", "Local Music");
                        cv.put("duration", duration);
                        cv.put("format", format);
                        cv.put("fileSize", size);
                        cv.put("artworkUri", artwork);
                        cv.put("sourceType", "local");
                        cv.put("sourceReference", contentUri);
                        cv.put("isFavorite", 0);
                        cv.put("addedAt", now);
                        cv.put("fileHash", title.toLowerCase() + "_" + artist.toLowerCase() + "_" + size);
                        long row = db.insertWithOnConflict("Songs", null, cv, SQLiteDatabase.CONFLICT_IGNORE);
                        if (row != -1L) importedCount++;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return importedCount;
    }

    public JSONArray getAllSongsJson() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        String sql = "SELECT s.*, COALESCE(h.playCount, 0) AS playCount, COALESCE(h.lastPosition, 0) AS lastPosition, COALESCE(h.lastPlayedAt, 0) AS lastPlayedAt "
                + "FROM Songs s LEFT JOIN PlaybackHistory h ON s.id = h.songId ORDER BY s.addedAt DESC";
        try (Cursor c = db.rawQuery(sql, null)) {
            while (c.moveToNext()) {
                JSONObject obj = new JSONObject();
                obj.put("id", c.getString(c.getColumnIndexOrThrow("id")));
                obj.put("title", c.getString(c.getColumnIndexOrThrow("title")));
                obj.put("artistId", c.getString(c.getColumnIndexOrThrow("artistId")));
                obj.put("artist", c.getString(c.getColumnIndexOrThrow("artistName")));
                obj.put("albumId", c.getString(c.getColumnIndexOrThrow("albumId")));
                obj.put("album", c.getString(c.getColumnIndexOrThrow("albumTitle")));
                obj.put("genre", c.getString(c.getColumnIndexOrThrow("genre")));
                obj.put("duration", c.getLong(c.getColumnIndexOrThrow("duration")));
                obj.put("format", c.getString(c.getColumnIndexOrThrow("format")));
                obj.put("fileSize", c.getLong(c.getColumnIndexOrThrow("fileSize")));
                obj.put("artworkUri", c.getString(c.getColumnIndexOrThrow("artworkUri")));
                obj.put("sourceType", c.getString(c.getColumnIndexOrThrow("sourceType")));
                obj.put("sourceReference", c.getString(c.getColumnIndexOrThrow("sourceReference")));
                obj.put("isFavorite", c.getInt(c.getColumnIndexOrThrow("isFavorite")) == 1);
                obj.put("addedAt", c.getLong(c.getColumnIndexOrThrow("addedAt")));
                obj.put("fileHash", c.getString(c.getColumnIndexOrThrow("fileHash")));
                obj.put("playCount", c.getInt(c.getColumnIndexOrThrow("playCount")));
                obj.put("lastPosition", c.getLong(c.getColumnIndexOrThrow("lastPosition")));
                obj.put("lastPlayedAt", c.getLong(c.getColumnIndexOrThrow("lastPlayedAt")));
                arr.put(obj);
            }
        } catch (Exception ignored) {
        }
        return arr;
    }

    public JSONArray getPlaylistsJson() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT * FROM Playlists ORDER BY isPinned DESC, updatedAt DESC", null)) {
            while (c.moveToNext()) {
                String plId = c.getString(c.getColumnIndexOrThrow("id"));
                JSONObject obj = new JSONObject();
                obj.put("id", plId);
                obj.put("name", c.getString(c.getColumnIndexOrThrow("name")));
                obj.put("artworkUri", c.getString(c.getColumnIndexOrThrow("artworkUri")));
                obj.put("createdAt", c.getLong(c.getColumnIndexOrThrow("createdAt")));
                obj.put("updatedAt", c.getLong(c.getColumnIndexOrThrow("updatedAt")));
                obj.put("isSmartPlaylist", c.getInt(c.getColumnIndexOrThrow("isSmartPlaylist")) == 1);
                obj.put("isPinned", c.getInt(c.getColumnIndexOrThrow("isPinned")) == 1);
                obj.put("smartRule", c.getString(c.getColumnIndexOrThrow("smartRule")));

                JSONArray songIds = new JSONArray();
                try (Cursor sc = db.rawQuery("SELECT songId FROM PlaylistSongs WHERE playlistId = ? ORDER BY position ASC", new String[]{plId})) {
                    while (sc.moveToNext()) {
                        songIds.put(sc.getString(0));
                    }
                }
                obj.put("songIds", songIds);
                arr.put(obj);
            }
        } catch (Exception ignored) {
        }
        return arr;
    }

    public JSONArray getDownloadsJson() {
        JSONArray arr = new JSONArray();
        SQLiteDatabase db = getReadableDatabase();
        try (Cursor c = db.rawQuery("SELECT * FROM Downloads ORDER BY createdAt DESC", null)) {
            while (c.moveToNext()) {
                JSONObject obj = new JSONObject();
                obj.put("id", c.getString(c.getColumnIndexOrThrow("id")));
                obj.put("songId", c.getString(c.getColumnIndexOrThrow("songId")));
                obj.put("title", c.getString(c.getColumnIndexOrThrow("title")));
                obj.put("artist", c.getString(c.getColumnIndexOrThrow("artist")));
                obj.put("artworkUri", c.getString(c.getColumnIndexOrThrow("artworkUri")));
                obj.put("sourceReference", c.getString(c.getColumnIndexOrThrow("sourceReference")));
                obj.put("destinationUri", c.getString(c.getColumnIndexOrThrow("destinationUri")));
                obj.put("mediaType", c.getString(c.getColumnIndexOrThrow("mediaType")));
                obj.put("format", c.getString(c.getColumnIndexOrThrow("format")));
                obj.put("quality", c.getString(c.getColumnIndexOrThrow("quality")));
                obj.put("status", c.getString(c.getColumnIndexOrThrow("status")));
                obj.put("progress", c.getInt(c.getColumnIndexOrThrow("progress")));
                obj.put("downloadedBytes", c.getLong(c.getColumnIndexOrThrow("downloadedBytes")));
                obj.put("fileSize", c.getLong(c.getColumnIndexOrThrow("fileSize")));
                obj.put("speedBps", c.getLong(c.getColumnIndexOrThrow("speedBps")));
                obj.put("createdAt", c.getLong(c.getColumnIndexOrThrow("createdAt")));
                obj.put("completedAt", c.getLong(c.getColumnIndexOrThrow("completedAt")));
                arr.put(obj);
            }
        } catch (Exception ignored) {
        }
        return arr;
    }

    public boolean toggleFavorite(String songId) {
        SQLiteDatabase db = getWritableDatabase();
        boolean newFav = false;
        try (Cursor c = db.rawQuery("SELECT isFavorite FROM Songs WHERE id = ?", new String[]{songId})) {
            if (c.moveToFirst()) {
                newFav = c.getInt(0) == 0;
            }
        }
        ContentValues cv = new ContentValues();
        cv.put("isFavorite", newFav ? 1 : 0);
        db.update("Songs", cv, "id = ?", new String[]{songId});
        return newFav;
    }

    public void recordPlayback(String songId, long positionMs, boolean incrementPlayCount) {
        SQLiteDatabase db = getWritableDatabase();
        long now = System.currentTimeMillis();
        int currentCount = 0;
        try (Cursor c = db.rawQuery("SELECT playCount FROM PlaybackHistory WHERE songId = ?", new String[]{songId})) {
            if (c.moveToFirst()) {
                currentCount = c.getInt(0);
            }
        }
        int nextCount = incrementPlayCount ? (currentCount + 1) : Math.max(1, currentCount);
        ContentValues cv = new ContentValues();
        cv.put("id", "hist_" + songId);
        cv.put("songId", songId);
        cv.put("lastPosition", positionMs);
        cv.put("playCount", nextCount);
        cv.put("lastPlayedAt", now);
        db.insertWithOnConflict("PlaybackHistory", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    public String createPlaylist(String name) {
        SQLiteDatabase db = getWritableDatabase();
        String id = "pl_" + System.currentTimeMillis();
        long now = System.currentTimeMillis();
        ContentValues cv = new ContentValues();
        cv.put("id", id);
        cv.put("name", name.trim());
        cv.put("artworkUri", "");
        cv.put("createdAt", now);
        cv.put("updatedAt", now);
        cv.put("isSmartPlaylist", 0);
        cv.put("isPinned", 0);
        cv.put("smartRule", "custom");
        db.insert("Playlists", null, cv);
        return id;
    }

    public void renamePlaylist(String playlistId, String newName) {
        ContentValues cv = new ContentValues();
        cv.put("name", newName.trim());
        cv.put("updatedAt", System.currentTimeMillis());
        getWritableDatabase().update("Playlists", cv, "id = ?", new String[]{playlistId});
    }

    public void deletePlaylist(String playlistId) {
        SQLiteDatabase db = getWritableDatabase();
        db.delete("PlaylistSongs", "playlistId = ?", new String[]{playlistId});
        db.delete("Playlists", "id = ?", new String[]{playlistId});
    }

    public boolean togglePinPlaylist(String playlistId) {
        SQLiteDatabase db = getWritableDatabase();
        boolean pinned = false;
        try (Cursor c = db.rawQuery("SELECT isPinned FROM Playlists WHERE id = ?", new String[]{playlistId})) {
            if (c.moveToFirst()) pinned = c.getInt(0) == 0;
        }
        ContentValues cv = new ContentValues();
        cv.put("isPinned", pinned ? 1 : 0);
        cv.put("updatedAt", System.currentTimeMillis());
        db.update("Playlists", cv, "id = ?", new String[]{playlistId});
        return pinned;
    }

    public void addSongToPlaylist(String playlistId, String songId) {
        SQLiteDatabase db = getWritableDatabase();
        int maxPos = 0;
        try (Cursor c = db.rawQuery("SELECT COALESCE(MAX(position), -1) + 1 FROM PlaylistSongs WHERE playlistId = ?", new String[]{playlistId})) {
            if (c.moveToFirst()) maxPos = c.getInt(0);
        }
        ContentValues cv = new ContentValues();
        cv.put("playlistId", playlistId);
        cv.put("songId", songId);
        cv.put("position", maxPos);
        cv.put("addedAt", System.currentTimeMillis());
        db.insertWithOnConflict("PlaylistSongs", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
        ContentValues plCv = new ContentValues();
        plCv.put("updatedAt", System.currentTimeMillis());
        db.update("Playlists", plCv, "id = ?", new String[]{playlistId});
    }

    public void removeSongFromPlaylist(String playlistId, String songId) {
        getWritableDatabase().delete("PlaylistSongs", "playlistId = ? AND songId = ?", new String[]{playlistId, songId});
    }

    public void updateSongMetadata(String songId, String title, String artist, String album, String genre) {
        ContentValues cv = new ContentValues();
        cv.put("title", title.trim());
        cv.put("artistName", artist.trim());
        cv.put("albumTitle", album.trim());
        cv.put("genre", genre.trim());
        getWritableDatabase().update("Songs", cv, "id = ?", new String[]{songId});
    }

    public void insertSongRecord(
            String id,
            String title,
            String artist,
            String album,
            String genre,
            long durationMs,
            String format,
            long fileSize,
            String artworkUri,
            String sourceType,
            String sourceReference
    ) {
        SQLiteDatabase db = getWritableDatabase();
        String artistId = "artist_" + artist.toLowerCase().hashCode();
        String albumId = "album_" + album.toLowerCase().hashCode();
        String art = (artworkUri == null || artworkUri.trim().isEmpty())
                ? buildGradientArtworkDataUri(title, artist, "#8B5CF6", "#22D3EE")
                : artworkUri;

        db.execSQL("INSERT OR IGNORE INTO Artists (id, name, artworkUri, description) VALUES (?, ?, ?, ?)",
                new Object[]{artistId, artist, art, genre + " Artist"});
        db.execSQL("INSERT OR IGNORE INTO Albums (id, title, artistId, artworkUri, releaseDate) VALUES (?, ?, ?, ?, ?)",
                new Object[]{albumId, album, artistId, art, "2026"});

        ContentValues cv = new ContentValues();
        cv.put("id", id);
        cv.put("title", title);
        cv.put("artistId", artistId);
        cv.put("artistName", artist);
        cv.put("albumId", albumId);
        cv.put("albumTitle", album);
        cv.put("genre", genre);
        cv.put("duration", durationMs);
        cv.put("format", format);
        cv.put("fileSize", fileSize);
        cv.put("artworkUri", art);
        cv.put("sourceType", sourceType);
        cv.put("sourceReference", sourceReference);
        cv.put("isFavorite", 0);
        cv.put("addedAt", System.currentTimeMillis());
        cv.put("fileHash", computeSongSignature(title, artist, fileSize, sourceReference));
        db.insertWithOnConflict("Songs", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    public boolean deleteSongAndFile(String songId) {
        SQLiteDatabase db = getWritableDatabase();
        String sourceRef = "";
        String sourceType = "";
        try (Cursor c = db.rawQuery("SELECT sourceReference, sourceType FROM Songs WHERE id = ?", new String[]{songId})) {
            if (c.moveToFirst()) {
                sourceRef = c.getString(0);
                sourceType = c.getString(1);
            }
        }
        if ("downloaded".equals(sourceType) && sourceRef != null && !sourceRef.isEmpty() && !sourceRef.startsWith("content://")) {
            try {
                File f = new File(sourceRef);
                if (f.exists()) f.delete();
            } catch (Exception ignored) {
            }
        }
        db.delete("Downloads", "songId = ?", new String[]{songId});
        return db.delete("Songs", "id = ?", new String[]{songId}) > 0;
    }

    public JSONObject getStorageBreakdownJson() {
        JSONObject result = new JSONObject();
        try {
            StatFs stat = new StatFs(appContext.getFilesDir().getAbsolutePath());
            long totalDeviceBytes = stat.getTotalBytes();
            long availableDeviceBytes = stat.getAvailableBytes();

            long audioBytes = 0L;
            long videoBytes = 0L;
            int songCount = 0;

            SQLiteDatabase db = getReadableDatabase();
            try (Cursor c = db.rawQuery("SELECT fileSize, format FROM Songs", null)) {
                while (c.moveToNext()) {
                    long sz = c.getLong(0);
                    String fmt = c.getString(1);
                    if (fmt != null && (fmt.equalsIgnoreCase("MP4") || fmt.equalsIgnoreCase("MKV") || fmt.equalsIgnoreCase("WEBM"))) {
                        videoBytes += sz;
                    } else {
                        audioBytes += sz;
                    }
                    songCount++;
                }
            }

            JSONArray duplicates = new JSONArray();
            String dupSql = "SELECT LOWER(TRIM(title)) || '|' || LOWER(TRIM(artistName)) AS sig, COUNT(*) as cnt FROM Songs GROUP BY sig HAVING cnt > 1";
            try (Cursor c = db.rawQuery(dupSql, null)) {
                while (c.moveToNext()) {
                    String sig = c.getString(0);
                    try (Cursor dc = db.rawQuery("SELECT id, title, artistName, fileSize, format, sourceReference FROM Songs WHERE LOWER(TRIM(title)) || '|' || LOWER(TRIM(artistName)) = ? ORDER BY addedAt DESC", new String[]{sig})) {
                        boolean first = true;
                        while (dc.moveToNext()) {
                            if (!first) {
                                JSONObject dObj = new JSONObject();
                                dObj.put("id", dc.getString(0));
                                dObj.put("title", dc.getString(1));
                                dObj.put("artist", dc.getString(2));
                                dObj.put("fileSize", dc.getLong(3));
                                dObj.put("format", dc.getString(4));
                                dObj.put("sourceReference", dc.getString(5));
                                duplicates.put(dObj);
                            }
                            first = false;
                        }
                    }
                }
            }

            result.put("totalDeviceBytes", totalDeviceBytes);
            result.put("availableDeviceBytes", availableDeviceBytes);
            result.put("audioBytes", audioBytes);
            result.put("videoBytes", videoBytes);
            result.put("totalMusicBytes", audioBytes + videoBytes);
            result.put("songCount", songCount);
            result.put("duplicates", duplicates);
        } catch (Exception ignored) {
        }
        return result;
    }

    public String exportCloudSyncBundle() {
        try {
            JSONObject bundle = new JSONObject();
            bundle.put("app", "XECEAY");
            bundle.put("exportedAt", System.currentTimeMillis());
            bundle.put("user", getUserJson());
            bundle.put("playlists", getPlaylistsJson());
            bundle.put("songsMetadata", getAllSongsJson());
            return bundle.toString(2);
        } catch (Exception e) {
            return "{}";
        }
    }

    public int importCloudSyncBundle(String jsonStr) {
        int imported = 0;
        try {
            JSONObject obj = new JSONObject(jsonStr);
            JSONArray playlists = obj.optJSONArray("playlists");
            if (playlists == null) return 0;
            SQLiteDatabase db = getWritableDatabase();
            for (int i = 0; i < playlists.length(); i++) {
                JSONObject pl = playlists.getJSONObject(i);
                String id = pl.optString("id", "pl_" + System.currentTimeMillis() + "_" + i);
                ContentValues cv = new ContentValues();
                cv.put("id", id);
                cv.put("name", pl.optString("name", "Synced Playlist"));
                cv.put("artworkUri", pl.optString("artworkUri", ""));
                cv.put("createdAt", pl.optLong("createdAt", System.currentTimeMillis()));
                cv.put("updatedAt", System.currentTimeMillis());
                cv.put("isSmartPlaylist", pl.optBoolean("isSmartPlaylist") ? 1 : 0);
                cv.put("isPinned", pl.optBoolean("isPinned") ? 1 : 0);
                cv.put("smartRule", pl.optString("smartRule", "custom"));
                db.insertWithOnConflict("Playlists", null, cv, SQLiteDatabase.CONFLICT_REPLACE);
                JSONArray songIds = pl.optJSONArray("songIds");
                if (songIds != null) {
                    for (int j = 0; j < songIds.length(); j++) {
                        addSongToPlaylist(id, songIds.getString(j));
                    }
                }
                imported++;
            }
        } catch (Exception ignored) {
        }
        return imported;
    }

    public JSONObject getUserJson() {
        JSONObject obj = new JSONObject();
        try (Cursor c = getReadableDatabase().rawQuery("SELECT * FROM Users LIMIT 1", null)) {
            if (c.moveToFirst()) {
                obj.put("id", c.getString(c.getColumnIndexOrThrow("id")));
                obj.put("displayName", c.getString(c.getColumnIndexOrThrow("displayName")));
                obj.put("email", c.getString(c.getColumnIndexOrThrow("email")));
                obj.put("createdAt", c.getLong(c.getColumnIndexOrThrow("createdAt")));
                String prefStr = c.getString(c.getColumnIndexOrThrow("preferences"));
                obj.put("preferences", new JSONObject(prefStr != null ? prefStr : "{}"));
            }
        } catch (Exception ignored) {
        }
        return obj;
    }

    public void updateUserProfile(String displayName, String email, String preferencesJson) {
        ContentValues cv = new ContentValues();
        cv.put("displayName", displayName.trim());
        cv.put("email", email.trim());
        cv.put("preferences", preferencesJson);
        getWritableDatabase().update("Users", cv, "id = 'local_user'", null);
    }

    private String computeSongSignature(String title, String artist, long size, String path) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((title + "|" + artist + "|" + size + "|" + path).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < Math.min(8, digest.length); i++) {
                sb.append(String.format("%02x", digest[i]));
            }
            return sb.toString();
        } catch (Exception e) {
            return title.hashCode() + "_" + size;
        }
    }

    public void updateSongArtwork(String songId, String artworkUri) {
        ContentValues cv = new ContentValues();
        cv.put("artworkUri", artworkUri != null ? artworkUri.trim() : "");
        getWritableDatabase().update("Songs", cv, "id = ?", new String[]{songId});
    }

    public static String buildGradientArtworkDataUri(String title, String artist, String color1, String color2) {
        String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 300\">"
                + "<defs><linearGradient id=\"g\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">"
                + "<stop offset=\"0%\" stop-color=\"" + color1 + "\"/>"
                + "<stop offset=\"100%\" stop-color=\"" + color2 + "\"/>"
                + "</linearGradient></defs>"
                + "<rect width=\"300\" height=\"300\" rx=\"36\" fill=\"#0C0E15\"/>"
                + "<circle cx=\"150\" cy=\"150\" r=\"122\" fill=\"#05070A\" stroke=\"url(#g)\" stroke-width=\"3.5\"/>"
                + "<circle cx=\"150\" cy=\"150\" r=\"96\" fill=\"none\" stroke=\"#FFFFFF\" stroke-opacity=\"0.08\" stroke-width=\"1.5\"/>"
                + "<circle cx=\"150\" cy=\"150\" r=\"72\" fill=\"none\" stroke=\"#FFFFFF\" stroke-opacity=\"0.08\" stroke-width=\"1.5\"/>"
                + "<circle cx=\"150\" cy=\"150\" r=\"48\" fill=\"url(#g)\" fill-opacity=\"0.35\"/>"
                + "<g transform=\"translate(150, 150) scale(0.65) translate(-150, -150)\">"
                + "<path d=\"M150,56 C150,110 110,150 56,150 C110,150 150,190 150,244 C150,190 190,150 244,150 C190,150 150,110 150,56 Z\" fill=\"#FFFFFF\" fill-opacity=\"0.95\"/>"
                + "<circle cx=\"150\" cy=\"150\" r=\"16\" fill=\"#05070A\"/>"
                + "</g>"
                + "</svg>";
        String encoded = Base64.encodeToString(svg.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
        return "data:image/svg+xml;base64," + encoded;
    }
}
