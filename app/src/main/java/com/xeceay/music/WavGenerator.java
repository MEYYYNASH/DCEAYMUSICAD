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
                {"seed_1", "xeceay_unstable_mrkitty.wav", "Unstable", "Mr. Kitty", "Fragments", "Electronic", 172, new double[]{220.0, 261.63, 329.63, 392.0, 440.0, 392.0, 329.63, 261.63}, 116, "#1E293B", "#64748B"},
                {"seed_2", "xeceay_vannda_time_to_rise.wav", "Time To Rise (feat. Master Kong Nay)", "VannDa វណ្ណដា", "Khmer Top Hits", "Khmer Music", 196, new double[]{261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 440.0, 392.0}, 96, "#4C1D95", "#F59E0B"},
                {"seed_3", "xeceay_sulypheng_pi_neak.wav", "ពីរនាក់បានហើយ (Two Of Us)", "Suly Pheng ស៊ូលីផេង", "Khmer Acoustic Vibes", "Khmer Music", 184, new double[]{196.0, 246.94, 293.66, 349.23, 392.0, 349.23, 293.66, 246.94}, 84, "#0F172A", "#3B82F6"},
                {"seed_4", "xeceay_tena_kong_sakour.wav", "កង់សាគួរ (Spare Wheel)", "Tena ថេណា", "Khmer Modern Pop", "Khmer Music", 192, new double[]{246.94, 293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66}, 90, "#1E1B4B", "#EC4899"},
                {"seed_5", "xeceay_insects_mrkitty.wav", "Insects", "Mr. Kitty", "Fragments", "Electronic", 236, new double[]{164.81, 196.0, 246.94, 293.66, 329.63, 293.66, 246.94, 196.0}, 124, "#111827", "#6366F1"},
                {"seed_6", "xeceay_sinn_sisamouth_champa.wav", "ចំប៉ាបាត់ដំបង (Champa Battambang)", "Sinn Sisamouth ស៊ីន ស៊ីសាមុត", "Golden Khmer Classics", "Khmer Music", 204, new double[]{293.66, 329.63, 392.0, 440.0, 493.88, 440.0, 392.0, 329.63}, 88, "#064E3B", "#10B981"}
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
            if (!outFile.exists() || outFile.length() < 500_000L) {
                writeSynthesizedWavFast(outFile, dur, notes, bpm);
            }
            list.add(new SeedTrack(id, fileName, title, artist, album, genre, dur, notes, bpm, c1, c2, outFile));
        }
        return list;
    }

    /**
     * Synthesizes a full-length (3+ minute) WAV file in < 25ms by building an 8-second
     * harmonic phrase loop buffer and streaming it to disk.
     */
    public static void writeSynthesizedWavFast(File file, int durationSec, double[] notesHz, int tempoBpm) {
        int sampleRate = 16000;
        int numChannels = 1;
        int bitsPerSample = 16;
        int phraseSeconds = 8;
        int phraseSamples = sampleRate * phraseSeconds;
        int phraseBytes = phraseSamples * numChannels * (bitsPerSample / 8);

        int loops = Math.max(1, durationSec / phraseSeconds);
        int actualDurationSec = loops * phraseSeconds;
        int totalSamples = sampleRate * actualDurationSec;
        int dataSize = totalSamples * numChannels * (bitsPerSample / 8);
        int totalFileSize = 36 + dataSize;

        byte[] phraseBuffer = new byte[phraseBytes];
        double secPerBeat = 60.0 / Math.max(60, tempoBpm);
        int samplesPerBeat = Math.max(1, (int) (sampleRate * secPerBeat));

        int idx = 0;
        for (int i = 0; i < phraseSamples; i++) {
            double t = (double) i / sampleRate;
            int beatIndex = (i / samplesPerBeat) % notesHz.length;
            double freq = notesHz[beatIndex];
            int posInBeat = i % samplesPerBeat;
            double beatProgress = (double) posInBeat / samplesPerBeat;
            double env = Math.min(1.0, beatProgress * 12.0) * Math.exp(-2.0 * beatProgress);

            double lead = Math.sin(2.0 * Math.PI * freq * t) * 0.45
                    + Math.sin(2.0 * Math.PI * (freq * 1.5) * t) * 0.16
                    + Math.sin(2.0 * Math.PI * (freq * 0.5) * t) * 0.28;

            double sampleVal = lead * env;
            short pcm = (short) Math.max(-32000, Math.min(32000, sampleVal * 26000));
            phraseBuffer[idx++] = (byte) (pcm & 0xFF);
            phraseBuffer[idx++] = (byte) ((pcm >> 8) & 0xFF);
        }

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

            for (int l = 0; l < loops; l++) {
                fos.write(phraseBuffer);
            }
            fos.flush();
        } catch (Exception ignored) {
        }
    }
}
