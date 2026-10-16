package com.xeceay.music;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public final class WavGenerator {

    public static final class SeedTrack {
        public final String id;
        public final String fileName;
        public final String title;
        public final String artist;
        public final String album;
        public final String genre;
        public final int durationSec;
        public final double[] notesHz;
        public final int tempoBpm;
        public final String artworkColor1;
        public final String artworkColor2;
        public final File file;

        public SeedTrack(
                String id,
                String fileName,
                String title,
                String artist,
                String album,
                String genre,
                int durationSec,
                double[] notesHz,
                int tempoBpm,
                String artworkColor1,
                String artworkColor2,
                File file
        ) {
            this.id = id;
            this.fileName = fileName;
            this.title = title;
            this.artist = artist;
            this.album = album;
            this.genre = genre;
            this.durationSec = durationSec;
            this.notesHz = notesHz;
            this.tempoBpm = tempoBpm;
            this.artworkColor1 = artworkColor1;
            this.artworkColor2 = artworkColor2;
            this.file = file;
        }
    }

    public static List<SeedTrack> ensureSeedTracks(File musicDir) {
        if (!musicDir.exists()) {
            musicDir.mkdirs();
        }
        List<SeedTrack> list = new ArrayList<>();
        Object[][] specs = new Object[][]{
                {"seed_1", "xeceay_midnight_horizon.wav", "Midnight Horizon", "XECEAY Synth Ensemble", "Nocturnal Odyssey", "Electronic", 24, new double[]{220.0, 261.63, 329.63, 392.0, 440.0, 392.0, 329.63, 261.63}, 110, "#8B5CF6", "#22D3EE"},
                {"seed_2", "xeceay_angkor_breeze.wav", "Angkor Breeze (Acoustic Session)", "Mekong Strings", "Golden Khmer Melodies", "Khmer Music", 22, new double[]{261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0}, 92, "#F59E0B", "#8B5CF6"},
                {"seed_3", "xeceay_velvet_rain_lofi.wav", "Velvet Rain Study Beats", "Kora Lo-Fi", "Late Night Coding", "Lo-fi", 26, new double[]{196.0, 246.94, 293.66, 349.23, 392.0, 349.23, 293.66, 246.94}, 80, "#22D3EE", "#3B82F6"},
                {"seed_4", "xeceay_cyber_pulse_bass.wav", "Cyber Pulse Overdrive", "Neon Vector", "Hyperdrive 2026", "Electronic", 20, new double[]{110.0, 146.83, 164.81, 220.0, 164.81, 220.0, 293.66, 220.0}, 128, "#EC4899", "#8B5CF6"},
                {"seed_5", "xeceay_moonlight_prelude.wav", "Moonlight Prelude in C", "Clara Vance", "Pure Piano & Strings", "Classical", 25, new double[]{261.63, 329.63, 392.0, 523.25, 659.25, 523.25, 392.0, 329.63}, 72, "#6366F1", "#14B8A6"},
                {"seed_6", "xeceay_phnom_penh_sunset.wav", "Phnom Penh Sunset Groove", "Tonle Sap Collective", "Khmer Contemporary Fusion", "Khmer Music", 22, new double[]{293.66, 329.63, 392.0, 440.0, 493.88, 440.0, 392.0, 329.63}, 100, "#10B981", "#22D3EE"}
        };

        for (Object[] s : specs) {
            String id = (String) s[0];
            String fileName = (String) s[1];
            String title = (String) s[2];
            String artist = (String) s[3];
            String album = (String) s[4];
            String genre = (String) s[5];
            int dur = (Integer) s[6];
            double[] notes = (double[]) s[7];
            int bpm = (Integer) s[8];
            String c1 = (String) s[9];
            String c2 = (String) s[10];

            File outFile = new File(musicDir, fileName);
            if (!outFile.exists() || outFile.length() < 1024L) {
                writeSynthesizedWav(outFile, dur, notes, bpm);
            }
            list.add(new SeedTrack(id, fileName, title, artist, album, genre, dur, notes, bpm, c1, c2, outFile));
        }
        return list;
    }

    private static void writeSynthesizedWav(File file, int durationSec, double[] notesHz, int tempoBpm) {
        int sampleRate = 22050;
        int numChannels = 2;
        int bitsPerSample = 16;
        int totalSamples = sampleRate * durationSec;
        int dataSize = totalSamples * numChannels * (bitsPerSample / 8);
        int totalFileSize = 36 + dataSize;

        try (FileOutputStream fos = new FileOutputStream(file)) {
            ByteBuffer header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN);
            header.put("RIFF".getBytes(StandardCharsets.US_ASCII));
            header.putInt(totalFileSize);
            header.put("WAVE".getBytes(StandardCharsets.US_ASCII));
            header.put("fmt ".getBytes(StandardCharsets.US_ASCII));
            header.putInt(16);
            header.putShort((short) 1);
            header.putShort((short) numChannels);
            header.putInt(sampleRate);
            header.putInt(sampleRate * numChannels * (bitsPerSample / 8));
            header.putShort((short) (numChannels * (bitsPerSample / 8)));
            header.putShort((short) bitsPerSample);
            header.put("data".getBytes(StandardCharsets.US_ASCII));
            header.putInt(dataSize);
            fos.write(header.array());

            double beatDurationSec = 60.0 / tempoBpm;
            int samplesPerBeat = Math.max(1, (int) (sampleRate * beatDurationSec));
            int chunkSamples = 2048;
            ByteBuffer buf = ByteBuffer.allocate(chunkSamples * 4).order(ByteOrder.LITTLE_ENDIAN);

            int sampleIdx = 0;
            while (sampleIdx < totalSamples) {
                buf.clear();
                int count = Math.min(chunkSamples, totalSamples - sampleIdx);
                for (int i = 0; i < count; i++) {
                    int globalSample = sampleIdx + i;
                    double t = (double) globalSample / sampleRate;
                    int beatIdx = (globalSample / samplesPerBeat) % notesHz.length;
                    double posInBeat = (double) (globalSample % samplesPerBeat) / samplesPerBeat;
                    double freq = notesHz[beatIdx];
                    double bassFreq = freq * 0.5;

                    double env;
                    if (posInBeat < 0.08) {
                        env = posInBeat / 0.08;
                    } else if (posInBeat < 0.35) {
                        env = 1.0 - (posInBeat - 0.08) * 0.8;
                    } else {
                        env = 0.78 * (1.0 - (posInBeat - 0.35) / 0.65);
                    }
                    env = Math.max(0.0, Math.min(1.0, env));

                    double leadL = Math.sin(2.0 * Math.PI * freq * t) * 0.45
                            + Math.sin(2.0 * Math.PI * (freq * 1.5) * t) * 0.18
                            + Math.sin(2.0 * Math.PI * bassFreq * t) * 0.28;
                    double leadR = Math.sin(2.0 * Math.PI * (freq * 1.003) * t) * 0.45
                            + Math.sin(2.0 * Math.PI * (freq * 2.0) * t) * 0.16
                            + Math.sin(2.0 * Math.PI * bassFreq * t) * 0.28;

                    short pcmL = (short) Math.max(-32767, Math.min(32767, (int) (leadL * env * 22000.0)));
                    short pcmR = (short) Math.max(-32767, Math.min(32767, (int) (leadR * env * 22000.0)));
                    buf.putShort(pcmL);
                    buf.putShort(pcmR);
                }
                fos.write(buf.array(), 0, count * 4);
                sampleIdx += count;
            }
        } catch (Exception ignored) {
        }
    }
}
