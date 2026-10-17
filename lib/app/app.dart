import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../core/theme/color_palette.dart';
import '../features/home/home_screen.dart';
import '../features/library/library_screen.dart';
import '../features/player/mini_player.dart';
import '../features/playlists/playlists_screen.dart';
import '../features/search/search_screen.dart';
import '../features/settings/settings_screen.dart';

class DCEAYApp extends StatefulWidget {
  const DCEAYApp({super.key});

  @override
  State<DCEAYApp> createState() => _DCEAYAppState();
}

class _DCEAYAppState extends State<DCEAYApp> {
  AppThemeMode _currentThemeMode = AppThemeMode.midnightSlate;
  bool _reducedMotion = false;
  int _currentIndex = 0;

  void _onThemeChanged(AppThemeMode mode) {
    setState(() => _currentThemeMode = mode);
  }

  void _onReducedMotionChanged(bool value) {
    setState(() => _reducedMotion = value);
  }

  @override
  Widget build(BuildContext context) {
    final palette = AppPalette.forMode(_currentThemeMode);
    final themeData = AppTheme.buildTheme(palette);

    return MaterialApp(
      title: 'DCEAY Music',
      debugShowCheckedModeBanner: false,
      theme: themeData,
      home: Scaffold(
        backgroundColor: palette.background,
        body: IndexedStack(
          index: _currentIndex,
          children: [
            HomeScreen(palette: palette),
            LibraryScreen(palette: palette),
            PlaylistsScreen(palette: palette),
            SearchScreen(palette: palette),
            SettingsScreen(
              palette: palette,
              currentTheme: _currentThemeMode,
              onThemeChanged: _onThemeChanged,
              reducedMotion: _reducedMotion,
              onReducedMotionChanged: _onReducedMotionChanged,
            ),
          ],
        ),
        bottomNavigationBar: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Persistent docked mini player above navigation
            DCEAYMiniPlayer(palette: palette),

            // Modern Bottom Navigation Bar
            NavigationBar(
              selectedIndex: _currentIndex,
              backgroundColor: palette.surface,
              indicatorColor: palette.accentPrimary.withValues(alpha: 0.2),
              onDestinationSelected: (index) {
                setState(() => _currentIndex = index);
              },
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.home_outlined),
                  selectedIcon: Icon(Icons.home_rounded, color: palette.accentPrimary),
                  label: 'Home',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.library_music_outlined),
                  selectedIcon: Icon(Icons.library_music_rounded, color: palette.accentPrimary),
                  label: 'Library',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.queue_music_outlined),
                  selectedIcon: Icon(Icons.queue_music_rounded, color: palette.accentPrimary),
                  label: 'Playlists',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.search_rounded),
                  selectedIcon: Icon(Icons.search_rounded, color: palette.accentPrimary),
                  label: 'Search',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.tune_rounded),
                  selectedIcon: Icon(Icons.tune_rounded, color: palette.accentPrimary),
                  label: 'Settings',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
