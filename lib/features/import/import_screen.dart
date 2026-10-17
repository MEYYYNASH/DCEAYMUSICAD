import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../core/theme/text_styles.dart';
import '../../services/database/track_dao.dart';
import 'file_import_service.dart';
import 'link_importer.dart';

class ImportScreen extends StatefulWidget {
  final AppPalette palette;

  const ImportScreen({super.key, required this.palette});

  @override
  State<ImportScreen> createState() => _ImportScreenState();
}

class _ImportScreenState extends State<ImportScreen> {
  final _urlController = TextEditingController();
  final _fileImportService = FileImportService();
  final _trackDao = TrackDao();

  bool _isAnalyzing = false;
  AnalyzedLinkResult? _analyzedResult;
  String? _statusMessage;

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _importLocalFiles() async {
    setState(() => _statusMessage = 'Selecting files...');
    final imported = await _fileImportService.pickAndImportAudioFiles();
    setState(() {
      _statusMessage = imported.isNotEmpty
          ? 'Successfully imported ${imported.length} track(s)!'
          : 'No new files imported.';
    });
  }

  Future<void> _analyzeUrl() async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;

    setState(() {
      _isAnalyzing = true;
      _statusMessage = null;
      _analyzedResult = null;
    });

    try {
      final result = await LinkImporter.analyzeUrl(url);
      setState(() {
        _analyzedResult = result;
        _isAnalyzing = false;
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Could not analyze link: $e';
        _isAnalyzing = false;
      });
    }
  }

  Future<void> _saveAnalyzedTrack() async {
    if (_analyzedResult == null) return;
    final track = _analyzedResult!.toTrack();
    await _trackDao.insertTrack(track);
    setState(() {
      _statusMessage = 'Saved "${track.title}" to library!';
      _analyzedResult = null;
      _urlController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.palette.background,
      appBar: AppBar(
        title: const Text('Import Music & Links'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: Local Audio Files
            Text(
              'Local Audio Import',
              style: AppTextStyles.headingMedium(widget.palette.textPrimary),
            ),
            const SizedBox(height: 6),
            Text(
              'Import your offline audio files (MP3, FLAC, WAV, M4A, OGG). Scoped storage is used to protect your privacy.',
              style: TextStyle(fontSize: 13, color: widget.palette.textSecondary),
            ),
            const SizedBox(height: 14),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: widget.palette.accentPrimary,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.audio_file_rounded),
              label: const Text(
                'Browse & Import Audio Files',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              onPressed: _importLocalFiles,
            ),

            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 24),

            // Section 2: Universal Links
            Text(
              'Universal Link Importer',
              style: AppTextStyles.headingMedium(widget.palette.textPrimary),
            ),
            const SizedBox(height: 6),
            Text(
              'Paste a Spotify track or YouTube video link to catalogue metadata. Direct audio URLs will be streamed natively.',
              style: TextStyle(fontSize: 13, color: widget.palette.textSecondary),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _urlController,
                    style: TextStyle(color: widget.palette.textPrimary),
                    decoration: InputDecoration(
                      hintText: 'https://open.spotify.com/track/...',
                      hintStyle: TextStyle(color: widget.palette.textSecondary),
                      filled: true,
                      fillColor: widget.palette.cardBackground,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: widget.palette.border),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                IconButton.filled(
                  style: IconButton.styleFrom(
                    backgroundColor: widget.palette.accentPrimary,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.all(14),
                  ),
                  icon: _isAnalyzing
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                        )
                      : const Icon(Icons.arrow_forward_rounded),
                  onPressed: _isAnalyzing ? null : _analyzeUrl,
                ),
              ],
            ),

            if (_analyzedResult != null) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: widget.palette.cardBackground,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: widget.palette.accentPrimary.withValues(alpha: 0.5)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_analyzedResult!.artworkUrl != null) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          _analyzedResult!.artworkUrl!,
                          height: 160,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    Text(
                      _analyzedResult!.title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: widget.palette.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _analyzedResult!.artist,
                      style: TextStyle(fontSize: 13, color: widget.palette.textSecondary),
                    ),
                    if (_analyzedResult!.note != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: widget.palette.surfaceVariant,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _analyzedResult!.note!,
                          style: TextStyle(fontSize: 11, color: widget.palette.textSecondary),
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: widget.palette.accentPrimary,
                        foregroundColor: Colors.black,
                        minimumSize: const Size(double.infinity, 44),
                      ),
                      onPressed: _saveAnalyzedTrack,
                      child: const Text('Add to DCEAY Library'),
                    ),
                  ],
                ),
              ),
            ],

            if (_statusMessage != null) ...[
              const SizedBox(height: 16),
              Text(
                _statusMessage!,
                style: TextStyle(
                  color: widget.palette.accentPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
