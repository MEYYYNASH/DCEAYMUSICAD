package com.xeceay.music;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.util.Base64;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import java.io.File;
import java.io.InputStream;

public class MusicPlaybackService extends Service {

    public static final String CHANNEL_ID = "xeceay_playback_channel";
    public static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_TOGGLE = "com.xeceay.music.ACTION_TOGGLE";
    public static final String ACTION_NEXT = "com.xeceay.music.ACTION_NEXT";
    public static final String ACTION_PREV = "com.xeceay.music.ACTION_PREV";
    public static final String ACTION_STOP = "com.xeceay.music.ACTION_STOP";

    public interface ActionHandler {
        void onAction(String action);
    }

    public interface SeekHandler {
        void onSeek(long positionMs);
    }

    public static ActionHandler actionCallback = null;
    public static SeekHandler seekCallback = null;

    private static MediaSessionCompat mediaSession = null;
    private static Bitmap cachedArtworkBitmap = null;
    private static String cachedArtworkUri = "";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel(this);
        initMediaSession(this);
    }

    public static synchronized void initMediaSession(Context context) {
        if (mediaSession == null) {
            mediaSession = new MediaSessionCompat(context.getApplicationContext(), "XeceayMediaSession");
            mediaSession.setCallback(new MediaSessionCompat.Callback() {
                @Override
                public void onPlay() {
                    if (actionCallback != null) actionCallback.onAction(ACTION_TOGGLE);
                }

                @Override
                public void onPause() {
                    if (actionCallback != null) actionCallback.onAction(ACTION_TOGGLE);
                }

                @Override
                public void onSkipToNext() {
                    if (actionCallback != null) actionCallback.onAction(ACTION_NEXT);
                }

                @Override
                public void onSkipToPrevious() {
                    if (actionCallback != null) actionCallback.onAction(ACTION_PREV);
                }

                @Override
                public void onSeekTo(long pos) {
                    if (seekCallback != null) seekCallback.onSeek(pos);
                }

                @Override
                public void onStop() {
                    if (actionCallback != null) actionCallback.onAction(ACTION_STOP);
                }
            });
            mediaSession.setActive(true);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            String action = intent != null ? intent.getAction() : null;
            if (ACTION_TOGGLE.equals(action) || ACTION_NEXT.equals(action) || ACTION_PREV.equals(action) || ACTION_STOP.equals(action)) {
                if (actionCallback != null) {
                    actionCallback.onAction(action);
                }
                if (ACTION_STOP.equals(action)) {
                    stopForeground(true);
                    stopSelf();
                }
                return START_NOT_STICKY;
            }

            initMediaSession(this);

            String title = (intent != null && intent.getStringExtra("title") != null)
                    ? intent.getStringExtra("title") : "XECEAY Music Player";
            String artist = (intent != null && intent.getStringExtra("artist") != null)
                    ? intent.getStringExtra("artist") : "Hi-Fi Audio";
            String album = (intent != null && intent.getStringExtra("album") != null)
                    ? intent.getStringExtra("album") : "XECEAY";
            String artworkUri = intent != null ? intent.getStringExtra("artworkUri") : null;
            boolean isPlaying = intent == null || intent.getBooleanExtra("isPlaying", true);
            long positionMs = intent != null ? intent.getLongExtra("positionMs", 0L) : 0L;
            long durationMs = intent != null ? intent.getLongExtra("durationMs", 0L) : 0L;

            Bitmap art = resolveArtworkBitmap(this, artworkUri);
            updateMediaSessionState(title, artist, album, durationMs, positionMs, isPlaying, art);

            Notification notification = buildMediaNotification(this, title, artist, isPlaying, art);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Throwable ignored) {
        }
        return START_NOT_STICKY;
    }

    public static void updateNotificationSafely(
            Context context,
            String title,
            String artist,
            String album,
            String artworkUri,
            boolean isPlaying,
            long positionMs,
            long durationMs
    ) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
                    return;
                }
            }
            createNotificationChannel(context);
            initMediaSession(context);

            Bitmap art = resolveArtworkBitmap(context, artworkUri);
            updateMediaSessionState(title, artist, album, durationMs, positionMs, isPlaying, art);

            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                Notification notification = buildMediaNotification(context, title, artist, isPlaying, art);
                nm.notify(NOTIFICATION_ID, notification);
            }
        } catch (Throwable ignored) {
        }
    }

    private static void updateMediaSessionState(
            String title,
            String artist,
            String album,
            long durationMs,
            long positionMs,
            boolean isPlaying,
            Bitmap artwork
    ) {
        if (mediaSession == null) return;
        try {
            long playbackActions = PlaybackStateCompat.ACTION_PLAY
                    | PlaybackStateCompat.ACTION_PAUSE
                    | PlaybackStateCompat.ACTION_PLAY_PAUSE
                    | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                    | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                    | PlaybackStateCompat.ACTION_SEEK_TO
                    | PlaybackStateCompat.ACTION_STOP;

            PlaybackStateCompat state = new PlaybackStateCompat.Builder()
                    .setActions(playbackActions)
                    .setState(
                            isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                            Math.max(0, positionMs),
                            isPlaying ? 1.0f : 0.0f
                    )
                    .build();
            mediaSession.setPlaybackState(state);

            MediaMetadataCompat.Builder meta = new MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title != null ? title : "XECEAY")
                    .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist != null ? artist : "XECEAY Hi-Fi")
                    .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album != null ? album : "")
                    .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, Math.max(0, durationMs));

            if (artwork != null) {
                meta.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artwork);
                meta.putBitmap(MediaMetadataCompat.METADATA_KEY_ART, artwork);
            }
            mediaSession.setMetadata(meta.build());
        } catch (Throwable ignored) {
        }
    }

    private static Notification buildMediaNotification(
            Context ctx,
            String title,
            String artist,
            boolean isPlaying,
            Bitmap artwork
    ) {
        Intent openAppIntent = new Intent(ctx, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPending = PendingIntent.getActivity(
                ctx, 0, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        PendingIntent prevPending = PendingIntent.getService(
                ctx, 1, new Intent(ctx, MusicPlaybackService.class).setAction(ACTION_PREV),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent togglePending = PendingIntent.getService(
                ctx, 2, new Intent(ctx, MusicPlaybackService.class).setAction(ACTION_TOGGLE),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent nextPending = PendingIntent.getService(
                ctx, 3, new Intent(ctx, MusicPlaybackService.class).setAction(ACTION_NEXT),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent stopPending = PendingIntent.getService(
                ctx, 4, new Intent(ctx, MusicPlaybackService.class).setAction(ACTION_STOP),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        MediaStyle mediaStyle = new MediaStyle();
        if (mediaSession != null) {
            mediaStyle.setMediaSession(mediaSession.getSessionToken());
        }
        mediaStyle.setShowActionsInCompactView(0, 1, 2);
        mediaStyle.setShowCancelButton(true);
        mediaStyle.setCancelButtonIntent(stopPending);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_launcher_monochrome)
                .setContentTitle(title != null ? title : "XECEAY")
                .setContentText(artist != null ? artist : "Khmer & Global Hi-Fi")
                .setSubText("XECEAY Hi-Fi")
                .setContentIntent(contentPending)
                .setDeleteIntent(stopPending)
                .setOngoing(isPlaying)
                .setSilent(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setStyle(mediaStyle)
                .addAction(android.R.drawable.ic_media_previous, "Previous", prevPending)
                .addAction(
                        isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        isPlaying ? "Pause" : "Play",
                        togglePending
                )
                .addAction(android.R.drawable.ic_media_next, "Next", nextPending);

        if (artwork != null) {
            builder.setLargeIcon(artwork);
        }

        return builder.build();
    }

    private static Bitmap resolveArtworkBitmap(Context ctx, String artworkUri) {
        if (artworkUri == null || artworkUri.isEmpty()) {
            return getDefaultAppArtwork(ctx);
        }
        if (artworkUri.equals(cachedArtworkUri) && cachedArtworkBitmap != null && !cachedArtworkBitmap.isRecycled()) {
            return cachedArtworkBitmap;
        }

        Bitmap bmp = null;
        try {
            if (artworkUri.startsWith("data:image/") && artworkUri.contains("base64,")) {
                String b64 = artworkUri.substring(artworkUri.indexOf("base64,") + 7);
                byte[] decoded = Base64.decode(b64, Base64.DEFAULT);
                bmp = BitmapFactory.decodeByteArray(decoded, 0, decoded.length);
            } else if (artworkUri.startsWith("file://")) {
                String path = Uri.parse(artworkUri).getPath();
                if (path != null && new File(path).exists()) {
                    bmp = BitmapFactory.decodeFile(path);
                }
            } else if (artworkUri.startsWith("content://")) {
                try (InputStream in = ctx.getContentResolver().openInputStream(Uri.parse(artworkUri))) {
                    if (in != null) bmp = BitmapFactory.decodeStream(in);
                }
            }
        } catch (Throwable ignored) {
        }

        if (bmp == null) {
            bmp = getDefaultAppArtwork(ctx);
        } else {
            int maxDim = 400;
            if (bmp.getWidth() > maxDim || bmp.getHeight() > maxDim) {
                float scale = Math.min((float) maxDim / bmp.getWidth(), (float) maxDim / bmp.getHeight());
                int w = Math.round(bmp.getWidth() * scale);
                int h = Math.round(bmp.getHeight() * scale);
                bmp = Bitmap.createScaledBitmap(bmp, w, h, true);
            }
        }

        cachedArtworkUri = artworkUri;
        cachedArtworkBitmap = bmp;
        return bmp;
    }

    private static Bitmap getDefaultAppArtwork(Context ctx) {
        try {
            Drawable d = ContextCompat.getDrawable(ctx, R.mipmap.ic_launcher);
            if (d != null) {
                int w = Math.max(1, d.getIntrinsicWidth());
                int h = Math.max(1, d.getIntrinsicHeight());
                Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
                Canvas c = new Canvas(b);
                d.setBounds(0, 0, w, h);
                d.draw(c);
                return b;
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    private static void createNotificationChannel(Context ctx) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "XECEAY Playback Controls",
                        NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Background audio playback & lock-screen controls");
                channel.setShowBadge(false);
                NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.createNotificationChannel(channel);
                }
            }
        } catch (Throwable ignored) {
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            if (mediaSession != null) {
                mediaSession.setActive(false);
                mediaSession.release();
                mediaSession = null;
            }
        } catch (Throwable ignored) {
        }
    }
}
