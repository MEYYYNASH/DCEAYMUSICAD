import 'package:flutter/material.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/database/track_dao.dart';
import '../library/songs_view.dart';

class SearchScreen extends StatefulWidget {
  final AppPalette palette;

  const SearchScreen({super.key, required this.palette});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  final TrackDao _trackDao = TrackDao();

  List<Track> _results = [];
  bool _onlyLyrics = false;
  bool _onlyFavorites = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      setState(() => _results = []);
      return;
    }

    final rawResults = await _trackDao.searchTracks(query.trim());
    final filtered = rawResults.where((t) {
      if (_onlyLyrics && !t.hasLyrics) return false;
      if (_onlyFavorites && !t.isFavorite) return false;
      return true;
    }).toList();

    setState(() => _results = filtered);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.palette.background,
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          style: TextStyle(color: widget.palette.textPrimary),
          decoration: InputDecoration(
            hintText: 'Search songs, artists, albums...',
            hintStyle: TextStyle(color: widget.palette.textSecondary),
            border: InputBorder.none,
            prefixIcon: Icon(Icons.search_rounded, color: widget.palette.accentPrimary),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: Icon(Icons.clear_rounded, color: widget.palette.textSecondary),
                    onPressed: () {
                      _searchController.clear();
                      _performSearch('');
                    },
                  )
                : null,
          ),
          onChanged: _performSearch,
        ),
      ),
      body: Column(
        children: [
          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('With Lyrics'),
                  selected: _onlyLyrics,
                  selectedColor: widget.palette.accentPrimary.withValues(alpha: 0.2),
                  onSelected: (selected) {
                    setState(() => _onlyLyrics = selected);
                    _performSearch(_searchController.text);
                  },
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Favorites Only'),
                  selected: _onlyFavorites,
                  selectedColor: widget.palette.accentPrimary.withValues(alpha: 0.2),
                  onSelected: (selected) {
                    setState(() => _onlyFavorites = selected);
                    _performSearch(_searchController.text);
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Results List
          Expanded(
            child: _results.isEmpty
                ? Center(
                    child: Text(
                      _searchController.text.isEmpty
                          ? 'Type above to search your music'
                          : 'No matching tracks found',
                      style: TextStyle(color: widget.palette.textSecondary),
                    ),
                  )
                : SongsView(
                    tracks: _results,
                    palette: widget.palette,
                    onRefresh: () => _performSearch(_searchController.text),
                  ),
          ),
        ],
      ),
    );
  }
}
