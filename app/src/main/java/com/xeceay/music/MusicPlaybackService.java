package com.xeceay.music;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

public class MusicPlaybackService extends Service {

    private static final String CHANNEL_ID = "xeceay_playback_channel";
    private static final int NOTIFICATION_ID = 1001;
    public static final String ACTION_TOGGLE = "com.xeceay.music.ACTION_TOGGLE";
    public static final String ACTION_NEXT = "com.xeceay.music.ACTION_NEXT";
    public static final String ACTION_PREV = "com.xeceay.music.ACTION_PREV";

    public interface ActionHandler {
        void onAction(String action);
    }

    public static ActionHandler actionCallback = null;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_TOGGLE.equals(action) || ACTION_NEXT.equals(action) || ACTION_PREV.equals(action)) {
            if (actionCallback != null) {
                actionCallback.onAction(action);
            }
            return START_STICKY;
        }

        String title = (intent != null && intent.getStringExtra("title") != null)
                ? intent.getStringExtra("title") : "XECEAY Music Player";
        String artist = (intent != null && intent.getStringExtra("artist") != null)
                ? intent.getStringExtra("artist") : "Your Music. Your Quality. Your World.";
        boolean isPlaying = intent == null || intent.getBooleanExtra("isPlaying", true);

        Notification notification = buildNotification(title, artist, isPlaying);
        try {
            startForeground(NOTIFICATION_ID, notification);
        } catch (Exception ignored) {
        }
        return START_STICKY;
    }

    private Notification buildNotification(String title, String artist, boolean isPlaying) {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentPending = PendingIntent.getActivity(
                this, 0, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        PendingIntent prevPending = PendingIntent.getService(
                this, 1, new Intent(this, MusicPlaybackService.class).setAction(ACTION_PREV),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent togglePending = PendingIntent.getService(
                this, 2, new Intent(this, MusicPlaybackService.class).setAction(ACTION_TOGGLE),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        PendingIntent nextPending = PendingIntent.getService(
                this, 3, new Intent(this, MusicPlaybackService.class).setAction(ACTION_NEXT),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_launcher_monochrome)
                .setContentTitle(title)
                .setContentText(artist)
                .setSubText("XECEAY Hi-Fi")
                .setContentIntent(contentPending)
                .setOngoing(isPlaying)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .addAction(android.R.drawable.ic_media_previous, "Previous", prevPending)
                .addAction(
                        isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        isPlaying ? "Pause" : "Play",
                        togglePending
                )
                .addAction(android.R.drawable.ic_media_next, "Next", nextPending)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "XECEAY Playback Controls",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background audio playback & lock-screen controls");
            channel.setShowBadge(false);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
