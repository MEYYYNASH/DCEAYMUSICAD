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
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

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
        createNotificationChannel(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            String action = intent != null ? intent.getAction() : null;
            if (ACTION_TOGGLE.equals(action) || ACTION_NEXT.equals(action) || ACTION_PREV.equals(action)) {
                if (actionCallback != null) {
                    actionCallback.onAction(action);
                }
                return START_NOT_STICKY;
            }

            String title = (intent != null && intent.getStringExtra("title") != null)
                    ? intent.getStringExtra("title") : "XECEAY Music Player";
            String artist = (intent != null && intent.getStringExtra("artist") != null)
                    ? intent.getStringExtra("artist") : "Your Music. Your Quality. Your World.";
            boolean isPlaying = intent == null || intent.getBooleanExtra("isPlaying", true);

            Notification notification = buildNotification(this, title, artist, isPlaying);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Throwable ignored) {
        }
        return START_NOT_STICKY;
    }

    public static void updateNotificationSafely(Context context, String title, String artist, boolean isPlaying) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
                    return;
                }
            }
            createNotificationChannel(context);
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                Notification notification = buildNotification(context, title, artist, isPlaying);
                nm.notify(NOTIFICATION_ID, notification);
            }
        } catch (Throwable ignored) {
        }
    }

    private static Notification buildNotification(Context ctx, String title, String artist, boolean isPlaying) {
        Intent openAppIntent = new Intent(ctx, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
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

        return new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_launcher_monochrome)
                .setContentTitle(title != null ? title : "XECEAY")
                .setContentText(artist != null ? artist : "Khmer & Global Hi-Fi")
                .setSubText("XECEAY Hi-Fi")
                .setContentIntent(contentPending)
                .setOngoing(isPlaying)
                .setSilent(true)
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
}
