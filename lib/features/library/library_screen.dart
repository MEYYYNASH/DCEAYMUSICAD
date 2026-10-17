import 'package:flutter/material.dart';
import '../../core/animations/transitions.dart';
import '../../core/theme/color_palette.dart';
import '../../services/audio/audio_models.dart';
import '../../services/database/track_dao.dart';
import '../import/import_screen.dart';
import 'albums_view.dart';
import 'artists_view.dart';
import 'songs_view.dart';

class LibraryScreen extends StatefulWidget {
  final AppPalette palette;

  const LibraryScreen({super.key, required this.palette});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final TrackDao _trackDao = TrackDao();

  List<Track> _allTracks = [];
  List<Track> _favoriteTracks = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadTracks();
  }

  Future<void> _loadTracks() async {
    setState(() => _isLoading = true);
    final all = await _trackDao.getAllTracks();
    final favs = await _trackDao.getFavoriteTracks();

    setState(() {
      _allTracks = all;
      _favoriteTracks = favs;
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: widget.palette.background,
      appBar: AppBar(
        title: Text(
          'Your Library',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            color: widget.palette.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.add_rounded, color: widget.palette.accentPrimary),
            tooltip: 'Import music',
            onPressed: () async {
              await Navigator.push(
                context,
                SmoothTransitions.slideUpRoute(
                  ImportScreen(palette: widget.palette),
                ),
              );
              _loadTracks();
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: widget.palette.accentPrimary,
          labelColor: widget.palette.accentPrimary,
          unselectedLabelColor: widget.palette.textSecondary,
          tabs: const [
            Tab(text: 'Songs'),
            Tab(text: 'Favorites'),
            Tab(text: 'Artists'),
            Tab(text: 'Albums'),
          ],
        ),
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(color: widget.palette.accentPrimary),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                SongsView(
                  tracks: _allTracks,
                  palette: widget.palette,
                  onRefresh: _loadTracks,
                ),
                SongsView(
                  tracks: _favoriteTracks,
                  palette: widget.palette,
                  onRefresh: _loadTracks,
                ),
                ArtistsView(tracks: _allTracks, palette: widget.palette),
                AlbumsView(tracks: _allTracks, palette: widget.palette),
              ],
            ),
    );
  }
}
