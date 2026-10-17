import 'package:dio/dio.dart';
import '../../core/networking/http_client.dart';
import '../../core/utils/logger.dart';
import '../../services/audio/audio_models.dart';

enum LinkType {
  spotifyTrack,
  spotifyPlaylist,
  youTubeVideo,
  directAudio,
  unsupported,
}

class AnalyzedLinkResult {
  final LinkType type;
  final String url;
  final String title;
  final String artist;
  final String? artworkUrl;
  final String? note;
  final bool isPlayableAudio;

  const AnalyzedLinkResult({
    required this.type,
    required this.url,
    required this.title,
    required this.artist,
    this.artworkUrl,
    this.note,
    this.isPlayableAudio = false,
  });

  Track toTrack() {
    return Track(
      id: 'link_${url.hashCode.abs()}',
      title: title,
      artist: artist,
      album: type == LinkType.spotifyTrack ? 'Spotify Import' : 'YouTube Import',
      duration: const Duration(minutes: 3, seconds: 45),
      artworkUrl: artworkUrl,
      source: type == LinkType.spotifyTrack
          ? TrackSource.spotifyMeta
          : (type == LinkType.youTubeVideo ? TrackSource.youTubeMeta : TrackSource.streamUrl),
      audioPath: isPlayableAudio ? url : null,
      dateAdded: DateTime.now().millisecondsSinceEpoch,
    );
  }
}

class LinkImporter {
  static final DCEAYHttpClient _client = DCEAYHttpClient();

  static LinkType identify(String url) {
    final uri = Uri.tryParse(url.trim());
    if (uri == null) return LinkType.unsupported;

    final host = uri.host.toLowerCase();
    if (host.contains('spotify.com')) {
      if (uri.path.contains('/track/')) return LinkType.spotifyTrack;
      if (uri.path.contains('/playlist/')) return LinkType.spotifyPlaylist;
    } else if (host.contains('youtube.com') || host.contains('youtu.be')) {
      return LinkType.youTubeVideo;
    } else if (url.endsWith('.mp3') || url.endsWith('.m4a') || url.endsWith('.flac') || url.endsWith('.wav')) {
      return LinkType.directAudio;
    }
    return LinkType.unsupported;
  }

  static Future<AnalyzedLinkResult> analyzeUrl(String url) async {
    final type = identify(url);

    switch (type) {
      case LinkType.spotifyTrack:
        try {
          final oembedUrl = 'https://open.spotify.com/oembed?url=${Uri.encodeComponent(url)}';
          final res = await _client.get<Map<String, dynamic>>(oembedUrl);
          final title = res.data?['title'] as String? ?? 'Spotify Track';
          final thumbnail = res.data?['thumbnail_url'] as String?;
          return AnalyzedLinkResult(
            type: LinkType.spotifyTrack,
            url: url,
            title: title,
            artist: 'Spotify Artist',
            artworkUrl: thumbnail,
            note: 'Spotify metadata entry. Audio playback requires Spotify app integration.',
            isPlayableAudio: false,
          );
        } catch (e) {
          AppLogger.warn('Spotify oEmbed lookup failed: $e');
          return AnalyzedLinkResult(
            type: LinkType.spotifyTrack,
            url: url,
            title: 'Imported Spotify Track',
            artist: 'Spotify',
            note: 'Metadata import only.',
          );
        }

      case LinkType.youTubeVideo:
        try {
          final oembedUrl = 'https://www.youtube.com/oembed?url=${Uri.encodeComponent(url)}&format=json';
          final res = await _client.get<Map<String, dynamic>>(oembedUrl);
          final title = res.data?['title'] as String? ?? 'YouTube Video';
          final author = res.data?['author_name'] as String? ?? 'YouTube Creator';
          final thumbnail = res.data?['thumbnail_url'] as String?;
          return AnalyzedLinkResult(
            type: LinkType.youTubeVideo,
            url: url,
            title: title,
            artist: author,
            artworkUrl: thumbnail,
            note: 'YouTube metadata catalogued.',
            isPlayableAudio: false,
          );
        } catch (e) {
          return AnalyzedLinkResult(
            type: LinkType.youTubeVideo,
            url: url,
            title: 'YouTube Audio',
            artist: 'YouTube',
            note: 'External YouTube metadata entry.',
          );
        }

      case LinkType.directAudio:
        return AnalyzedLinkResult(
          type: LinkType.directAudio,
          url: url,
          title: Uri.parse(url).pathSegments.isNotEmpty
              ? Uri.parse(url).pathSegments.last
              : 'Direct Audio Stream',
          artist: 'Web Audio',
          isPlayableAudio: true,
          note: 'Direct playable audio stream.',
        );

      case LinkType.unsupported:
      default:
        throw Exception('Unsupported or unrecognized music link format.');
    }
  }
}
