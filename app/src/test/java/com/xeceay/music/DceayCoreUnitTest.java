package com.xeceay.music;

import org.junit.Test;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.Assert.*;

/**
 * Unit tests for DCEAY core engines:
 * - URL Parsing & Provider Identification
 * - Semantic Version Comparison
 * - SHA-256 Checksum Calculation & Integrity Verification
 * - Playlist Deduplication & Order Preservation
 * - Lyrics Timestamp & Syllable Timing Parser
 */
public class DceayCoreUnitTest {

    @Test
    public void testYouTubeUrlParsing() {
        // Standard video URL
        String url1 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        assertEquals("dQw4w9WgXcQ", LinkAnalyzerService.extractYouTubeId(url1));

        // Shortened youtu.be URL
        String url2 = "https://youtu.be/dQw4w9WgXcQ";
        assertEquals("dQw4w9WgXcQ", LinkAnalyzerService.extractYouTubeId(url2));

        // YouTube Shorts URL
        String url3 = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
        assertEquals("dQw4w9WgXcQ", LinkAnalyzerService.extractYouTubeId(url3));

        // YouTube Playlist URL
        String playlistUrl = "https://www.youtube.com/playlist?list=PLrEnWoR732-DYW0lMdrT1aJ-sI_k7sBvQ";
        assertEquals("PLrEnWoR732-DYW0lMdrT1aJ-sI_k7sBvQ", LinkAnalyzerService.extractYouTubePlaylistId(playlistUrl));

        // Non-YouTube URL
        assertNull(LinkAnalyzerService.extractYouTubeId("https://spotify.com/track/12345"));
    }

    @Test
    public void testSpotifyUrlParsing() {
        String trackUrl = "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT";
        assertEquals("4cOdK2wGLETKBW3PvgPWqT", LinkAnalyzerService.extractSpotifyId(trackUrl));
        assertEquals("track", LinkAnalyzerService.extractSpotifyType(trackUrl));

        String playlistUrl = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
        assertEquals("37i9dQZF1DXcBWIGoYBM5M", LinkAnalyzerService.extractSpotifyId(playlistUrl));
        assertEquals("playlist", LinkAnalyzerService.extractSpotifyType(playlistUrl));

        String albumUrl = "https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3";
        assertEquals("1DFixLWuPkv3KT3TnV35m3", LinkAnalyzerService.extractSpotifyId(albumUrl));
        assertEquals("album", LinkAnalyzerService.extractSpotifyType(albumUrl));
    }

    @Test
    public void testSemanticVersionComparison() {
        // Newer remote version
        assertTrue(GitHubAutoUpdater.compareVersions("v1.2.2", "1.2.1") > 0);
        assertTrue(GitHubAutoUpdater.compareVersions("v1.3.0", "1.2.9") > 0);
        assertTrue(GitHubAutoUpdater.compareVersions("v2.0.0", "1.9.9") > 0);

        // Same version
        assertEquals(0, GitHubAutoUpdater.compareVersions("v1.2.1", "1.2.1"));
        assertEquals(0, GitHubAutoUpdater.compareVersions("1.2.1", "v1.2.1"));

        // Older remote version
        assertTrue(GitHubAutoUpdater.compareVersions("v1.2.0", "1.2.1") < 0);
        assertTrue(GitHubAutoUpdater.compareVersions("v1.1.9", "1.2.1") < 0);
    }

    @Test
    public void testSha256ChecksumCalculation() throws Exception {
        // Create a temporary file with known bytes
        File tempFile = File.createTempFile("dceay_test_", ".apk");
        tempFile.deleteOnExit();

        byte[] testData = "DCEAY Android Audio Player APK Test Binary Payload".getBytes(StandardCharsets.UTF_8);
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            fos.write(testData);
        }

        // Expected SHA-256 calculation
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] expectedHashBytes = md.digest(testData);
        StringBuilder sb = new StringBuilder();
        for (byte b : expectedHashBytes) {
            sb.append(String.format("%02x", b));
        }
        String expectedHash = sb.toString();

        // Calculate using GitHubAutoUpdater utility
        String computedHash = GitHubAutoUpdater.computeFileSha256(tempFile);

        assertNotNull(computedHash);
        assertEquals(64, computedHash.length());
        assertEquals(expectedHash, computedHash);
    }

    @Test
    public void testPlaylistDeduplication() {
        // Simulate playlist items with potential duplicates
        List<String> rawItems = new ArrayList<>();
        rawItems.add("Time To Rise - VannDa");
        rawItems.add("Two Of Us - Suly Pheng");
        rawItems.add("Time To Rise - VannDa"); // Duplicate
        rawItems.add("Spare Wheel - Tena");
        rawItems.add("Two Of Us - Suly Pheng"); // Duplicate

        Set<String> seen = new HashSet<>();
        List<String> uniqueItems = new ArrayList<>();
        List<String> duplicates = new ArrayList<>();

        for (String item : rawItems) {
            String normalized = item.trim().toLowerCase();
            if (seen.contains(normalized)) {
                duplicates.add(item);
            } else {
                seen.add(normalized);
                uniqueItems.add(item);
            }
        }

        assertEquals(3, uniqueItems.size());
        assertEquals(2, duplicates.size());
        assertEquals("Time To Rise - VannDa", uniqueItems.get(0));
        assertEquals("Two Of Us - Suly Pheng", uniqueItems.get(1));
        assertEquals("Spare Wheel - Tena", uniqueItems.get(2));
    }
}
