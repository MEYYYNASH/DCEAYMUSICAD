(function () {
  const isNative = typeof window.XeceayNative !== "undefined";

  // Crisp Vector SVG Icon Library
  const SVG = {
    play: `<svg class="svg-icon sm fill-current" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    playLg: `<svg class="svg-icon lg fill-current" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    pause: `<svg class="svg-icon sm fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    pauseLg: `<svg class="svg-icon lg fill-current" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
    heartFill: `<svg class="svg-icon sm fill-current" style="color:#EF4444;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    heartOutline: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    download: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>`,
    video: `<svg class="svg-icon sm fill-current" viewBox="0 0 24 24"><rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="22 7 16 12 22 17 22 7"/></svg>`,
    musicNote: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    eqBars: `<svg class="svg-icon sm" style="color:var(--accent-primary);" viewBox="0 0 24 24"><line x1="5" y1="20" x2="5" y2="11" stroke-width="2.5"/><line x1="10" y1="20" x2="10" y2="4" stroke-width="2.5"/><line x1="15" y1="20" x2="15" y2="14" stroke-width="2.5"/><line x1="20" y1="20" x2="20" y2="8" stroke-width="2.5"/></svg>`,
    moreDots: `<svg class="svg-icon sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>`,
    trash: `<svg class="svg-icon sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
    retry: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    close: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
    check: `<svg class="svg-icon sm" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`
  };

  const GENRES = [
    "All",
    "Khmer Music",
    "Electronic",
    "Lo-fi",
    "Pop",
    "Hip-Hop",
    "R&B",
    "Rock",
    "Classical",
    "Acoustic"
  ];

  const EQ_PRESETS = {
    "Normal": [0, 0, 0, 0, 0],
    "Bass Boost": [9, 6, 0, 1, 2],
    "Treble Boost": [-1, 0, 2, 6, 9],
    "Vocal": [-3, 2, 6, 4, -1],
    "Classical": [5, 3, -2, 4, 5],
    "Rock": [6, 3, -2, 4, 7],
    "Jazz": [4, 2, -1, 3, 5],
    "Electronic": [7, 4, 0, 3, 8],
    "Custom": [3, 2, 1, 2, 4]
  };

  const EQ_FREQ_LABELS = ["60Hz", "230Hz", "910Hz", "3.6kHz", "14kHz"];

  //Deterministic waveform bar heights (42 bars matching Screenshot 2)
  const WAVEFORM_HEIGHTS = [
    18, 26, 15, 32, 42, 28, 20, 36, 54, 44, 68, 82, 60, 48,
    74, 92, 64, 50, 86, 100, 76, 58, 42, 68, 84, 70, 52, 38,
    62, 78, 56, 44, 66, 50, 34, 48, 30, 24, 36, 22, 18, 14
  ];

  const AUTHORIZED_CATALOG = [
    {
      id: "cat_dl_1",
      title: "MONTAGEM ELDER (AMV)",
      artist: "DJ Samir, Nulteex, John Bis.T",
      album: "Phonk & Night Drift",
      genre: "Electronic",
      duration: 132000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 2850400,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("ME", "#1E293B", "#3B82F6")
    },
    {
      id: "cat_dl_2",
      title: "Viva La Vida (Official Mix)",
      artist: "Coldplay",
      album: "Viva La Vida",
      genre: "Pop",
      duration: 185000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 3420000,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("VV", "#7C2D12", "#F59E0B")
    },
    {
      id: "cat_dl_3",
      title: "Unstable (Midnight Session)",
      artist: "Mr. Kitty",
      album: "Fragments",
      genre: "Electronic",
      duration: 172000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 3180000,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("UN", "#0F172A", "#8B5CF6")
    },
    {
      id: "cat_dl_4",
      title: "Angkor Starlight (Khmer Acoustic)",
      artist: "Mekong Strings",
      album: "Golden Khmer Melodies",
      genre: "Khmer Music",
      duration: 198000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 3890000,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("AS", "#4C1D95", "#EC4899")
    },
    {
      id: "cat_dl_5",
      title: "Velvet Rain Lo-Fi Beats",
      artist: "Kora Lo-Fi",
      album: "Focus & Flow",
      genre: "Lo-fi",
      duration: 152000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 2640000,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("VR", "#064E3B", "#10B981")
    }
  ];

  function makeSvgUri(initials, c1, c2) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="300" height="300" rx="36" fill="url(#g)"/><circle cx="150" cy="150" r="88" fill="#0F1218" fill-opacity="0.38"/><text x="150" y="165" font-family="sans-serif" font-weight="800" font-size="48" fill="#F8FAFC" text-anchor="middle">${initials}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  const state = {
    activeTab: "home",
    selectedGenre: "All",
    searchFilter: "all",
    searchQuery: "",
    libraryTab: "all",
    downloadFilter: "all",
    songs: [],
    playlists: [],
    downloads: [],
    liveDiscovery: [],
    searchResultsCatalog: [],
    isSearchingCatalog: false,
    storage: {
      totalDeviceBytes: 64 * 1024 * 1024 * 1024,
      availableDeviceBytes: 42 * 1024 * 1024 * 1024,
      audioBytes: 0,
      videoBytes: 0,
      totalMusicBytes: 0,
      songCount: 0,
      duplicates: []
    },
    versionInfo: {
      versionName: "1.0.1",
      versionCode: 101,
      canInstallPackages: true
    },
    user: {
      displayName: "XECEAY Audiophile",
      email: "listener@xeceay.app",
      preferences: {
        theme: "dark",
        audioQuality: "High Quality (320kbps)",
        eqPreset: "Normal",
        githubRepo: "MEYYYNASH/XECEAY"
      }
    },
    player: {
      songId: "",
      title: "Midnight Horizon",
      artist: "XECEAY Synth Ensemble",
      album: "Nocturnal Odyssey",
      artworkUri: makeSvgUri("MH", "#8B5CF6", "#22D3EE"),
      format: "WAV",
      isPlaying: false,
      positionMs: 0,
      durationMs: 24000,
      speed: 1.0,
      volume: 0.9,
      shuffle: false,
      repeatMode: "all",
      eqPreset: "Normal",
      eqBands: [0, 0, 0, 0, 0],
      bassStrength: 150,
      sleepRemainingSec: 0,
      isDraggingSeek: false
    },
    analyzedLink: null
  };

  let webAudio = null;
  if (!isNative) {
    webAudio = new Audio();
    webAudio.crossOrigin = "anonymous";
    webAudio.addEventListener("timeupdate", () => {
      if (!state.player.isDraggingSeek) {
        state.player.positionMs = Math.floor((webAudio.currentTime || 0) * 1000);
        state.player.durationMs = Math.floor((webAudio.duration || 24) * 1000);
        updatePlayerUiOnly();
      }
    });
    webAudio.addEventListener("ended", () => handleTrackEnded());
  }

  function showToast(msg) {
    const box = document.getElementById("toast-box");
    if (!box) return;
    box.textContent = msg;
    box.classList.add("show");
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.classList.remove("show"), 2600);
  }

  function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return min + ":" + (sec < 10 ? "0" + sec : sec);
  }

  function formatBytes(bytes) {
    const b = Number(bytes) || 0;
    if (b <= 0) return "0 KB";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(2) + " MB";
    return (b / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return String(str || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
  }

  function refreshFromNative() {
    if (!isNative) {
      if (state.songs.length === 0) {
        state.songs = AUTHORIZED_CATALOG.map((item, idx) => ({
          ...item,
          id: "seed_" + (idx + 1),
          sourceType: "local",
          isFavorite: idx < 2,
          playCount: idx * 2 + 1,
          addedAt: Date.now() - idx * 60000
        }));
        state.playlists = [
          { id: "pl_favorites", name: "Favorites", isSmartPlaylist: true, isPinned: true, smartRule: "favorites", songIds: [] },
          { id: "pl_khmer_gold", name: "Khmer & Night Vibes", isSmartPlaylist: false, isPinned: true, smartRule: "custom", songIds: ["seed_1", "seed_2"] }
        ];
      }
      renderAll();
      return;
    }
    try {
      const raw = window.XeceayNative.getBootstrapData();
      const data = JSON.parse(raw);
      if (data.songs) state.songs = data.songs;
      if (data.playlists) state.playlists = data.playlists;
      if (data.downloads) state.downloads = data.downloads;
      if (data.storage) state.storage = data.storage;
      if (data.versionInfo) state.versionInfo = data.versionInfo;
      if (data.user) state.user = data.user;
      if (data.playerState && data.playerState.songId) {
        Object.assign(state.player, data.playerState);
      } else if (state.songs.length > 0 && !state.player.songId) {
        const first = state.songs[0];
        state.player.songId = first.id;
        state.player.title = first.title;
        state.player.artist = first.artist;
        state.player.album = first.album;
        state.player.artworkUri = first.artworkUri;
        state.player.durationMs = first.duration;
        state.player.format = first.format || "WAV";
      }
      renderAll();
    } catch (e) {
      console.error("Bootstrap error:", e);
    }
  }

  function renderAll() {
    updateGreetingAndStats();
    renderGenreChips();
    renderHomeSections();
    renderSearchScreen();
    renderLibraryContent();
    renderDownloadsScreen();
    renderEqualizerModal();
    renderStorageCard();
    updateVersionBadge();
    updatePlayerUiOnly();
  }

  function updateGreetingAndStats() {
    const hr = new Date().getHours();
    const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    const el = document.getElementById("home-greeting");
    if (el) el.textContent = greet;

    const favCount = state.songs.filter(s => s.isFavorite).length;
    const dlCount = state.downloads.filter(d => d.status === "Completed").length || state.songs.filter(s => s.sourceType === "downloaded").length;
    const plCount = state.playlists.length;
    const histCount = state.songs.filter(s => (s.playCount || 0) > 0).length || state.songs.length;

    const favEl = document.getElementById("stat-fav-count");
    if (favEl) favEl.textContent = String(favCount);
    const dlEl = document.getElementById("stat-dl-count");
    if (dlEl) dlEl.textContent = dlCount > 0 ? `${dlCount} Offline` : "Offline";
    const plEl = document.getElementById("stat-pl-count");
    if (plEl) plEl.textContent = `${plCount} Curated`;
    const histEl = document.getElementById("stat-hist-count");
    if (histEl) histEl.textContent = String(histCount);

    // Update dynamic downloads badge on bottom nav
    const activeDls = state.downloads.filter(d => d.status === "Downloading" || d.status === "Waiting").length;
    const navBadge = document.getElementById("nav-dl-badge");
    if (navBadge) {
      navBadge.textContent = String(activeDls);
      navBadge.classList.toggle("visible", activeDls > 0);
    }
  }

  function renderGenreChips() {
    const row = document.getElementById("home-genre-chips");
    if (!row) return;
    row.innerHTML = GENRES.map(g => {
      const active = state.selectedGenre === g ? "active" : "";
      return `<div class="chip ${active}" onclick="XeceayApp.selectGenre('${escapeAttr(g)}')">${escapeHtml(g)}</div>`;
    }).join("");
  }

  function renderHomeSections() {
    // 1. Continue Listening Large Horizontal Cards (Screenshot 4)
    const contEl = document.getElementById("home-continue-carousel");
    if (contEl) {
      const list = state.songs.length > 0 ? state.songs.slice(0, 8) : AUTHORIZED_CATALOG;
      contEl.innerHTML = list.map(song => `
        <div class="continue-card" onclick="XeceayApp.playSongById('${escapeAttr(song.id)}')">
          <div class="continue-art-wrap">
            <img src="${song.artworkUri || makeSvgUri(song.title.slice(0,2), '#1E293B', '#8B5CF6')}" alt="" />
            <div class="white-play-fab">
              ${state.player.songId === song.id && state.player.isPlaying ? SVG.pause : SVG.play}
            </div>
          </div>
          <div class="media-title">${escapeHtml(song.title)}</div>
          <div class="media-sub">${escapeHtml(song.artist)} • ${formatDuration(song.duration)}</div>
        </div>
      `).join("");
    }

    // 2. Recommended for you
    const trendEl = document.getElementById("home-trending-carousel");
    if (trendEl) {
      const items = state.liveDiscovery.length > 0 ? state.liveDiscovery : AUTHORIZED_CATALOG;
      trendEl.innerHTML = items.map((item, idx) => `
        <div class="media-card" onclick="XeceayApp.playDiscoveryItem(${idx})">
          <div class="media-art-wrap">
            <img src="${item.artworkUri || makeSvgUri('XC', '#8B5CF6', '#22D3EE')}" alt="" />
            <div class="white-play-fab" style="width:32px;height:32px;right:7px;bottom:7px;">
              ${SVG.play}
            </div>
          </div>
          <div class="media-title">${escapeHtml(item.title)}</div>
          <div class="media-sub">${escapeHtml(item.artist)}</div>
        </div>
      `).join("");
    }

    // 3. Top Tracks & Quick Download (Screenshot 3 bottom rows)
    const dlListEl = document.getElementById("home-downloadable-list");
    if (dlListEl) {
      const sourceList = state.liveDiscovery.length > 0 ? state.liveDiscovery.slice(0, 8) : AUTHORIZED_CATALOG;
      dlListEl.innerHTML = sourceList.map((item, idx) => renderDownloadableTrackRow(item, idx)).join("");
    }
  }

  function renderDownloadableTrackRow(item, idx) {
    const isPlaying = state.player.songId === item.id;
    const numStr = String(idx + 1).padStart(2, "0");
    const art = item.artworkUri || makeSvgUri((item.title || "XC").slice(0, 2), "#1E293B", "#8B5CF6");
    return `
      <div class="song-row ${isPlaying ? 'playing' : ''}" onclick="XeceayApp.playAnyTrack('${escapeAttr(item.id)}','${escapeAttr(item.title)}','${escapeAttr(item.artist)}','${escapeAttr(art)}','${escapeAttr(item.sourceReference)}',${item.duration || 30000})">
        <div class="track-num-col">${isPlaying ? SVG.eqBars : numStr}</div>
        <img class="song-thumb" src="${art}" alt="" />
        <div class="song-info">
          <div class="song-name">${escapeHtml(item.title)}</div>
          <div class="song-meta">
            <span>${escapeHtml(item.artist)} • ${formatDuration(item.duration)}</span>
          </div>
        </div>
        <div class="song-actions" onclick="event.stopPropagation()">
          <button class="dl-format-pill" onclick="XeceayApp.downloadDirectTrack('${escapeAttr(item.title)}','${escapeAttr(item.artist)}','${escapeAttr(art)}','${escapeAttr(item.sourceReference)}','MP4','video')">
            ${SVG.download}
            <span>MP4</span>
          </button>
          <button class="dl-orange-btn" title="Download MP3" onclick="XeceayApp.downloadDirectTrack('${escapeAttr(item.title)}','${escapeAttr(item.artist)}','${escapeAttr(art)}','${escapeAttr(item.sourceReference)}','MP3','audio')">
            ${SVG.download}
          </button>
        </div>
      </div>
    `;
  }

  function getSongsForPlaylist(pl) {
    if (!pl) return [];
    if (pl.smartRule === "favorites") return state.songs.filter(s => s.isFavorite);
    if (pl.smartRule === "recent_added") return state.songs.slice(0, 12);
    if (pl.smartRule === "recent_played") return state.songs.filter(s => s.lastPlayedAt > 0).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    if (pl.smartRule === "most_played") return state.songs.slice().sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    if (pl.smartRule === "focus") return state.songs.filter(s => ["Lo-fi", "Classical", "Instrumental", "Khmer Music"].includes(s.genre));
    const ids = pl.songIds || [];
    return ids.map(id => state.songs.find(s => s.id === id)).filter(Boolean);
  }

  function renderSearchScreen() {
    const container = document.getElementById("search-results-container");
    if (!container) return;
    const q = (state.searchQuery || "").trim().toLowerCase();

    if (state.searchFilter === "playlists") {
      const matchedPl = state.playlists.filter(p => !q || p.name.toLowerCase().includes(q));
      container.innerHTML = matchedPl.map(pl => `
        <div class="song-row" onclick="XeceayApp.openPlaylistDetails('${escapeAttr(pl.id)}')">
          <div class="stat-icon-box green">${SVG.musicNote}</div>
          <div class="song-info">
            <div class="song-name">${escapeHtml(pl.name)}</div>
            <div class="song-meta">${getSongsForPlaylist(pl).length} tracks • ${pl.isSmartPlaylist ? "Smart Playlist" : "Custom Playlist"}</div>
          </div>
          <span class="badge cyan">Open</span>
        </div>
      `).join("");
      return;
    }

    const localMatches = state.songs.filter(s => {
      if (!q) return true;
      return (
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.artist && s.artist.toLowerCase().includes(q)) ||
        (s.album && s.album.toLowerCase().includes(q)) ||
        (s.genre && s.genre.toLowerCase().includes(q))
      );
    }).map(s => ({ ...s, isLocal: true }));

    const onlinePool = state.searchResultsCatalog.length > 0
      ? state.searchResultsCatalog
      : [...AUTHORIZED_CATALOG, ...state.liveDiscovery];

    const onlineMatches = onlinePool.filter(s => {
      if (!q) return true;
      return (
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.artist && s.artist.toLowerCase().includes(q)) ||
        (s.album && s.album.toLowerCase().includes(q))
      );
    });

    let combined = [];
    if (state.searchFilter === "local") {
      combined = localMatches;
    } else if (state.searchFilter === "downloadable") {
      combined = onlineMatches;
    } else {
      combined = [...onlineMatches, ...localMatches];
    }

    if (state.isSearchingCatalog && combined.length === 0) {
      container.innerHTML = `
        <div class="song-row" style="cursor:default;">
          <div class="stat-icon-box purple">${SVG.musicNote}</div>
          <div class="song-info">
            <div class="song-name">Searching music catalog for "${escapeHtml(state.searchQuery)}"...</div>
            <div class="song-meta">Fetching downloadable MP3 & MP4 streams</div>
          </div>
        </div>
      `;
      return;
    }

    if (combined.length === 0) {
      container.innerHTML = `
        <div class="song-row" style="cursor:default;">
          <div class="stat-icon-box purple">${SVG.musicNote}</div>
          <div class="song-info">
            <div class="song-name">No local match for "${escapeHtml(state.searchQuery)}"</div>
            <div class="song-meta">Tap the "Search" button to search online catalog tracks</div>
          </div>
          <button class="pill-btn accent" onclick="XeceayApp.triggerCatalogSearchNow()">Search Online</button>
        </div>
      `;
      return;
    }

    container.innerHTML = combined.slice(0, 35).map((item, idx) => {
      if (item.isLocal) {
        const isPlaying = state.player.songId === item.id;
        const numStr = String(idx + 1).padStart(2, "0");
        return `
          <div class="song-row ${isPlaying ? 'playing' : ''}" onclick="XeceayApp.playSongById('${escapeAttr(item.id)}')">
            <div class="track-num-col">${isPlaying ? SVG.eqBars : numStr}</div>
            <img class="song-thumb" src="${item.artworkUri}" alt="" />
            <div class="song-info">
              <div class="song-name">${escapeHtml(item.title)}</div>
              <div class="song-meta">
                <span>${escapeHtml(item.artist)} • ${formatDuration(item.duration)}</span>
                <span class="badge green">OFFLINE</span>
              </div>
            </div>
            <div class="song-actions" onclick="event.stopPropagation()">
              <button class="icon-btn ${item.isFavorite ? 'fav-active' : ''}" onclick="XeceayApp.toggleFav('${escapeAttr(item.id)}')">
                ${item.isFavorite ? SVG.heartFill : SVG.heartOutline}
              </button>
            </div>
          </div>
        `;
      }
      return renderDownloadableTrackRow(item, idx);
    }).join("");
  }

  function renderLibraryContent() {
    const heroArt = document.getElementById("lib-hero-art");
    const heroCount = document.getElementById("lib-hero-count");
    if (heroArt) {
      const firstArt = (state.songs[0] && state.songs[0].artworkUri) || makeSvgUri("XC", "#1E293B", "#8B5CF6");
      heroArt.src = firstArt;
    }
    if (heroCount) {
      heroCount.textContent = `Library • ${state.songs.length} songs • 2026`;
    }

    const area = document.getElementById("library-content-area");
    if (!area) return;
    const filterQ = ((document.getElementById("library-filter-input") || {}).value || "").trim().toLowerCase();

    if (state.libraryTab === "playlists") {
      area.innerHTML = state.playlists.map(pl => {
        const tracks = getSongsForPlaylist(pl);
        return `
          <div class="song-row" onclick="XeceayApp.openPlaylistDetails('${escapeAttr(pl.id)}')">
            <div class="stat-icon-box green">${SVG.musicNote}</div>
            <div class="song-info">
              <div class="song-name">${escapeHtml(pl.name)}</div>
              <div class="song-meta">${tracks.length} songs • ${pl.isSmartPlaylist ? "Smart Playlist" : "Personal Playlist"}</div>
            </div>
            <span class="badge cyan">Open</span>
          </div>
        `;
      }).join("");
      return;
    }

    if (state.libraryTab === "albums") {
      const byAlbum = {};
      state.songs.forEach(s => {
        const key = s.album || "Single Releases";
        if (!byAlbum[key]) byAlbum[key] = { album: key, artist: s.artist, songs: [], artworkUri: s.artworkUri };
        byAlbum[key].songs.push(s);
      });
      area.innerHTML = Object.values(byAlbum).map(alb => `
        <div class="song-row" onclick="XeceayApp.playSongById('${escapeAttr(alb.songs[0].id)}')">
          <img class="song-thumb" src="${alb.artworkUri}" alt="" />
          <div class="song-info">
            <div class="song-name">${escapeHtml(alb.album)}</div>
            <div class="song-meta">${escapeHtml(alb.artist)} • ${alb.songs.length} tracks</div>
          </div>
          <span class="badge green">Play</span>
        </div>
      `).join("");
      return;
    }

    if (state.libraryTab === "duplicates") {
      const dups = (state.storage && state.storage.duplicates) || [];
      if (dups.length === 0) {
        area.innerHTML = `
          <div class="song-row" style="cursor:default;">
            <div class="stat-icon-box green">${SVG.check}</div>
            <div class="song-info">
              <div class="song-name">No Duplicate Audio Files Detected</div>
              <div class="song-meta">All ${state.songs.length} tracks in your library are unique.</div>
            </div>
          </div>
        `;
      } else {
        area.innerHTML = dups.map(d => `
          <div class="song-row">
            <div class="song-info">
              <div class="song-name">${escapeHtml(d.title)}</div>
              <div class="song-meta">${escapeHtml(d.artist)} • ${formatBytes(d.fileSize)}</div>
            </div>
            <button class="icon-btn" style="color:var(--error);" onclick="XeceayApp.deleteSongById('${escapeAttr(d.id)}')">${SVG.trash}</button>
          </div>
        `).join("");
      }
      return;
    }

    let list = state.songs.slice();
    if (state.libraryTab === "downloaded") list = list.filter(s => s.sourceType === "downloaded");
    if (state.libraryTab === "favorites") list = list.filter(s => s.isFavorite);
    if (state.libraryTab === "recent") list = list.filter(s => s.lastPlayedAt > 0).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);

    if (filterQ) {
      list = list.filter(s =>
        (s.title && s.title.toLowerCase().includes(filterQ)) ||
        (s.artist && s.artist.toLowerCase().includes(filterQ)) ||
        (s.album && s.album.toLowerCase().includes(filterQ))
      );
    }

    if (list.length === 0) {
      area.innerHTML = `
        <div class="song-row" style="cursor:default;">
          <div class="stat-icon-box purple">${SVG.musicNote}</div>
          <div class="song-info">
            <div class="song-name">No Tracks Found in This Filter</div>
            <div class="song-meta">Tap Scan Device, Import File, or download songs from Search.</div>
          </div>
        </div>
      `;
      return;
    }

    // Numbered rows matching Screenshot 2 Right Side (01, 02, or equalizer bars when playing)
    area.innerHTML = list.map((song, idx) => {
      const isPlaying = state.player.songId === song.id;
      const numStr = String(idx + 1).padStart(2, "0");
      return `
        <div class="song-row ${isPlaying ? 'playing' : ''}" onclick="XeceayApp.playSongById('${escapeAttr(song.id)}')">
          <div class="track-num-col">${isPlaying ? SVG.eqBars : numStr}</div>
          <img class="song-thumb" src="${song.artworkUri}" alt="" />
          <div class="song-info">
            <div class="song-name">${escapeHtml(song.title)}</div>
            <div class="song-meta">
              <span>${escapeHtml(song.artist)} • ${formatDuration(song.duration)}</span>
              ${song.sourceType === "downloaded" ? `<span class="badge green">${song.format || "MP3"}</span>` : ""}
            </div>
          </div>
          <div class="song-actions" onclick="event.stopPropagation()">
            <button class="icon-btn ${song.isFavorite ? 'fav-active' : ''}" onclick="XeceayApp.toggleFav('${escapeAttr(song.id)}')">
              ${song.isFavorite ? SVG.heartFill : SVG.heartOutline}
            </button>
            <button class="icon-btn" onclick="XeceayApp.openTagEditor('${escapeAttr(song.id)}')" title="Options">${SVG.moreDots}</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderDownloadsScreen() {
    const qEl = document.getElementById("downloads-queue-list");
    if (qEl) {
      let list = state.downloads.slice();
      if (state.downloadFilter === "active") list = list.filter(d => d.status !== "Completed");
      if (state.downloadFilter === "completed") list = list.filter(d => d.status === "Completed");
      if (state.downloadFilter === "audio") list = list.filter(d => d.mediaType !== "video");
      if (state.downloadFilter === "video") list = list.filter(d => d.mediaType === "video");

      if (list.length === 0) {
        qEl.innerHTML = `
          <div class="song-row" style="cursor:default;">
            <div class="stat-icon-box orange">${SVG.download}</div>
            <div class="song-info">
              <div class="song-name">No Downloads in This Filter</div>
              <div class="song-meta">Use YouTube Link Downloader or Search to download MP3 & MP4 files.</div>
            </div>
          </div>
        `;
      } else {
        qEl.innerHTML = list.map(d => {
          const speedText = d.speedBps > 0 ? `${formatBytes(d.speedBps)}/s` : "";
          const badgeCls = d.status === "Completed" ? "green" : d.status === "Failed" || d.status === "Cancelled" ? "red" : "cyan";
          return `
            <div class="song-row" style="flex-direction:column;align-items:stretch;cursor:default;">
              <div style="display:flex;align-items:center;gap:12px;">
                <img class="song-thumb" src="${d.artworkUri || makeSvgUri('DL', '#1E293B', '#8B5CF6')}" alt="" />
                <div class="song-info">
                  <div class="song-name">${escapeHtml(d.title)}</div>
                  <div class="song-meta">
                    <span>${escapeHtml(d.artist)}</span>
                    <span class="badge ${badgeCls}">${d.status} (${d.progress || 0}%)</span>
                    <span class="badge">${d.format || "MP3"}</span>
                    <span>${formatBytes(d.downloadedBytes)}</span>
                    ${speedText ? `<span>• ${speedText}</span>` : ""}
                  </div>
                </div>
                <div class="song-actions">
                  ${d.status === "Downloading" || d.status === "Waiting" ? `<button class="icon-btn" onclick="XeceayApp.pauseDl('${escapeAttr(d.id)}')">${SVG.pause}</button>` : ""}
                  ${d.status === "Paused" ? `<button class="icon-btn" onclick="XeceayApp.resumeDl('${escapeAttr(d.id)}')">${SVG.play}</button>` : ""}
                  ${d.status === "Failed" || d.status === "Cancelled" ? `<button class="icon-btn" onclick="XeceayApp.retryDl('${escapeAttr(d.id)}')">${SVG.retry}</button>` : ""}
                  ${d.status === "Completed" && d.songId ? `<button class="pill-btn white-pill" onclick="XeceayApp.playSongById('${escapeAttr(d.songId)}')">${SVG.play}<span>Play</span></button>` : ""}
                  <button class="icon-btn" onclick="XeceayApp.deleteDl('${escapeAttr(d.id)}')">${SVG.trash}</button>
                </div>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width:${d.progress || 0}%;"></div>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    const catEl = document.getElementById("authorized-catalog-downloads");
    if (catEl) {
      catEl.innerHTML = AUTHORIZED_CATALOG.map((item, idx) => renderDownloadableTrackRow(item, idx)).join("");
    }
  }

  function renderEqualizerModal() {
    const presetRow = document.getElementById("eq-presets-row");
    if (presetRow) {
      presetRow.innerHTML = Object.keys(EQ_PRESETS).map(name => `
        <div class="chip ${state.player.eqPreset === name ? 'active' : ''}" onclick="XeceayApp.selectEqPreset('${escapeAttr(name)}')">${name}</div>
      `).join("");
    }
    const bandsBox = document.getElementById("eq-bands-container");
    if (bandsBox) {
      const bands = state.player.eqBands || [0, 0, 0, 0, 0];
      bandsBox.innerHTML = EQ_FREQ_LABELS.map((freq, idx) => {
        const val = bands[idx] || 0;
        return `
          <div class="eq-band-col">
            <span style="font-size:11px;font-weight:700;color:var(--accent-secondary);">${val > 0 ? "+" + val : val} dB</span>
            <input
              type="range"
              min="-15"
              max="15"
              value="${val}"
              class="range-slider"
              style="writing-mode: bt-lr; -webkit-appearance: slider-vertical; width: 24px; height: 110px;"
              oninput="XeceayApp.onEqBandSlider(${idx}, this.value)"
            />
            <span style="font-size:11px;color:#94A3B8;">${freq}</span>
          </div>
        `;
      }).join("");
    }
    const setEq = document.getElementById("settings-eq-summary");
    if (setEq) setEq.textContent = `Preset: ${state.player.eqPreset} • Sub-Bass ${(state.player.bassStrength / 10).toFixed(0)}%`;
  }

  function renderStorageCard() {
    const card = document.getElementById("settings-storage-card");
    if (!card) return;
    const st = state.storage || {};
    const usedDevice = Math.max(0, (st.totalDeviceBytes || 1) - (st.availableDeviceBytes || 0));
    const pct = Math.min(100, Math.round((usedDevice * 100) / Math.max(1, st.totalDeviceBytes || 1)));
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:700;font-size:14px;">Device & XECEAY Storage</span>
        <span class="badge cyan">${formatBytes(st.availableDeviceBytes)} Free</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;font-size:11px;color:var(--text-secondary);">
        <div>Audio: <strong style="color:var(--text-primary);">${formatBytes(st.audioBytes)}</strong></div>
        <div>Video: <strong style="color:var(--text-primary);">${formatBytes(st.videoBytes)}</strong></div>
        <div>Tracks: <strong style="color:var(--text-primary);">${st.songCount || state.songs.length}</strong></div>
      </div>
    `;
  }

  function updateVersionBadge() {
    const b = document.getElementById("installed-version-badge");
    if (b && state.versionInfo) {
      b.textContent = `v${state.versionInfo.versionName || "1.0.1"}`;
    }
  }

  function renderWaveformBars(pct) {
    const wf = document.getElementById("fp-waveform-bars");
    if (!wf) return;
    const activeCount = Math.round((pct / 100) * WAVEFORM_HEIGHTS.length);
    wf.innerHTML = WAVEFORM_HEIGHTS.map((h, i) => `
      <div class="wf-bar ${i < activeCount ? 'played' : ''}" style="height:${Math.max(14, Math.round(h * 0.36))}px;"></div>
    `).join("");
  }

  function updatePlayerUiOnly() {
    const p = state.player;
    const pct = p.durationMs > 0 ? Math.min(100, (p.positionMs * 100) / p.durationMs) : 0;
    const currentSongObj = state.songs.find(s => s.id === p.songId);
    const isFav = Boolean(currentSongObj && currentSongObj.isFavorite);

    // Mini Player
    const mTitle = document.getElementById("mini-title");
    const mArtist = document.getElementById("mini-artist");
    const mArt = document.getElementById("mini-art");
    const mPlay = document.getElementById("mini-play-btn");
    const mFav = document.getElementById("mini-fav-btn");
    const mFill = document.getElementById("mini-progress-fill");
    if (mTitle) mTitle.textContent = p.title || "Select a Song";
    if (mArtist) mArtist.textContent = p.artist || "XECEAY";
    if (mArt && p.artworkUri) mArt.src = p.artworkUri;
    if (mPlay) mPlay.innerHTML = p.isPlaying ? SVG.pause : SVG.play;
    if (mFav) mFav.innerHTML = isFav ? SVG.heartFill : SVG.heartOutline;
    if (mFill) mFill.style.width = pct + "%";

    // Full Player
    const fpTitle = document.getElementById("fp-title");
    const fpArtist = document.getElementById("fp-artist");
    const fpAlbum = document.getElementById("fp-album-label");
    const fpArt = document.getElementById("fp-art");
    const fpPlay = document.getElementById("fp-play-btn");
    const fpCur = document.getElementById("fp-current-time");
    const fpTot = document.getElementById("fp-total-time");
    const fpSeek = document.getElementById("fp-seek-slider");
    const fpSpeed = document.getElementById("fp-speed-btn");
    const fpSleep = document.getElementById("fp-sleep-btn");
    const fpFav = document.getElementById("fp-fav-btn");

    if (fpTitle) fpTitle.textContent = p.title || "Select a Song";
    if (fpArtist) fpArtist.textContent = p.artist || "XECEAY";
    if (fpAlbum) fpAlbum.textContent = p.album || "XECEAY Hi-Res";
    if (fpArt && p.artworkUri) fpArt.src = p.artworkUri;
    if (fpPlay) fpPlay.innerHTML = p.isPlaying ? SVG.pauseLg : SVG.playLg;
    if (fpCur) fpCur.textContent = formatDuration(p.positionMs);
    if (fpTot) fpTot.textContent = formatDuration(p.durationMs);
    if (fpSeek && !p.isDraggingSeek) {
      fpSeek.value = p.durationMs > 0 ? Math.floor((p.positionMs * 1000) / p.durationMs) : 0;
    }
    renderWaveformBars(pct);

    if (fpSpeed) fpSpeed.textContent = `${Number(p.speed || 1).toFixed(2).replace(/\.00$/, ".0")}x`;
    if (fpSleep) {
      fpSleep.textContent = p.sleepRemainingSec > 0
        ? `Sleep: ${Math.ceil(p.sleepRemainingSec / 60)}m`
        : "Sleep: Off";
    }
    if (fpFav) {
      fpFav.innerHTML = isFav ? SVG.heartFill : SVG.heartOutline;
    }
  }

  function playSongObject(song) {
    if (!song) return;
    state.player.songId = song.id;
    state.player.title = song.title;
    state.player.artist = song.artist;
    state.player.album = song.album || "XECEAY Library";
    state.player.artworkUri = song.artworkUri || makeSvgUri((song.title || "XC").slice(0, 2), "#1E293B", "#8B5CF6");
    state.player.durationMs = song.duration || 180000;
    state.player.format = song.format || "MP3";

    if (isNative) {
      window.XeceayNative.playSong(
        song.id,
        song.title,
        song.artist,
        song.album || "XECEAY",
        state.player.artworkUri,
        song.sourceReference,
        0
      );
    } else if (webAudio) {
      webAudio.src = song.sourceReference;
      webAudio.play().catch(() => {});
      state.player.isPlaying = true;
    }
    updatePlayerUiOnly();
    renderPlayerQueue();
    renderHomeSections();
    renderLibraryContent();
  }

  function renderPlayerQueue() {
    const qList = document.getElementById("fp-queue-list");
    if (!qList) return;
    const queue = state.songs.slice(0, 15);
    qList.innerHTML = queue.map((s, idx) => {
      const isPlaying = state.player.songId === s.id;
      return `
        <div class="song-row ${isPlaying ? 'playing' : ''}" style="background:#161B24;border-color:rgba(255,255,255,0.08);" onclick="XeceayApp.playSongById('${escapeAttr(s.id)}')">
          <div class="track-num-col">${isPlaying ? SVG.eqBars : String(idx + 1).padStart(2, "0")}</div>
          <img class="song-thumb" src="${s.artworkUri}" alt="" style="width:40px;height:40px;" />
          <div class="song-info">
            <div class="song-name" style="color:#FFFFFF;">${escapeHtml(s.title)}</div>
            <div class="song-meta">${escapeHtml(s.artist)} • ${formatDuration(s.duration)}</div>
          </div>
          <span class="badge ${isPlaying ? 'cyan' : ''}">${isPlaying ? "PLAYING" : "UP NEXT"}</span>
        </div>
      `;
    }).join("");
  }

  function handleTrackEnded() {
    if (state.player.repeatMode === "one") {
      const current = state.songs.find(s => s.id === state.player.songId);
      if (current) playSongObject(current);
      return;
    }
    window.XeceayApp.nextTrack();
  }

  function requestNativeOrWebSearch(query, requestType) {
    const q = (query || "").trim() || "top hits 2026";
    if (requestType === "search") {
      state.isSearchingCatalog = true;
      renderSearchScreen();
    }
    if (isNative && window.XeceayNative.searchCatalog) {
      window.XeceayNative.searchCatalog(q, requestType || "search");
      return;
    }
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=20`)
      .then(r => r.json())
      .then(data => {
        state.isSearchingCatalog = false;
        if (data && Array.isArray(data.results)) {
          const items = data.results.filter(r => r.previewUrl).map(r => ({
            id: "cat_" + r.trackId,
            title: r.trackName || "Track",
            artist: r.artistName || "Artist",
            album: r.collectionName || "Single",
            genre: r.primaryGenreName || "Pop",
            duration: r.trackTimeMillis || 30000,
            format: "MP3",
            quality: "320kbps",
            fileSize: 3250000,
            artworkUri: (r.artworkUrl100 || "").replace("100x100bb", "400x400bb"),
            sourceReference: r.previewUrl,
            downloadable: true
          }));
          if (requestType === "discovery") {
            state.liveDiscovery = items;
            renderHomeSections();
          } else {
            state.searchResultsCatalog = items;
            renderSearchScreen();
          }
        }
      })
      .catch(() => {
        state.isSearchingCatalog = false;
        renderSearchScreen();
      });
  }

  // Public API
  window.XeceayApp = {
    switchTab(tab) {
      state.activeTab = tab;
      ["home", "search", "library", "downloads", "settings"].forEach(t => {
        const sec = document.getElementById("screen-" + t);
        if (sec) sec.classList.toggle("active", t === tab);
        const nav = document.getElementById("nav-" + t);
        if (nav) nav.classList.toggle("active", t === tab);
      });
      if (tab === "settings") {
        this.refreshStorageCard();
      }
    },

    openYouTubeLinkMode() {
      this.switchTab("search");
      this.setDownloaderSubMode("yt");
      const inp = document.getElementById("link-importer-input");
      if (inp) inp.focus();
    },

    openSearchDownloadMode() {
      this.switchTab("search");
      this.setDownloaderSubMode("search");
      const inp = document.getElementById("search-input");
      if (inp) inp.focus();
    },

    setDownloaderSubMode(mode) {
      const btnSearch = document.getElementById("mode-btn-search");
      const btnYt = document.getElementById("mode-btn-yt");
      const ytCard = document.getElementById("yt-link-card");
      if (mode === "search") {
        if (btnSearch) btnSearch.classList.add("dark-navy");
        if (btnYt) btnYt.classList.remove("dark-navy");
        if (ytCard) ytCard.style.display = "none";
      } else {
        if (btnYt) btnYt.classList.add("dark-navy");
        if (btnSearch) btnSearch.classList.remove("dark-navy");
        if (ytCard) ytCard.style.display = "block";
      }
    },

    openLibrarySubTab(sub) {
      this.switchTab("library");
      state.libraryTab = sub;
      renderLibraryContent();
    },

    handleBackPress() {
      const fp = document.getElementById("full-player-modal");
      if (fp && fp.classList.contains("open")) {
        fp.classList.remove("open");
        return true;
      }
      if (state.activeTab !== "home") {
        this.switchTab("home");
        return true;
      }
      return false;
    },

    selectGenre(genre) {
      state.selectedGenre = genre;
      renderGenreChips();
      requestNativeOrWebSearch(genre === "All" ? "top hits 2026" : genre, "discovery");
    },

    refreshLiveDiscovery() {
      showToast("Refreshing recommendations...");
      requestNativeOrWebSearch(state.selectedGenre === "All" ? "electronic phonk hits" : state.selectedGenre, "discovery");
    },

    playSongById(songId) {
      const song = state.songs.find(s => s.id === songId) ||
                   AUTHORIZED_CATALOG.find(c => c.id === songId) ||
                   state.liveDiscovery.find(d => d.id === songId) ||
                   state.searchResultsCatalog.find(x => x.id === songId);
      if (song) playSongObject(song);
    },

    playAllLibrary(shuffle) {
      if (state.songs.length === 0) return;
      state.player.shuffle = Boolean(shuffle);
      const target = shuffle
        ? state.songs[Math.floor(Math.random() * state.songs.length)]
        : state.songs[0];
      playSongObject(target);
    },

    playDiscoveryItem(idx) {
      const list = state.liveDiscovery.length > 0 ? state.liveDiscovery : AUTHORIZED_CATALOG;
      if (list[idx]) {
        playSongObject(list[idx]);
      }
    },

    playAnyTrack(id, title, artist, artworkUri, sourceUrl, durationMs) {
      const localMatch = state.songs.find(s => s.id === id);
      if (localMatch) {
        playSongObject(localMatch);
        return;
      }
      playSongObject({
        id: id || ("stream_" + Date.now()),
        title,
        artist,
        album: "XECEAY Stream",
        artworkUri,
        duration: durationMs || 30000,
        format: "MP3",
        sourceReference: sourceUrl
      });
    },

    togglePlay() {
      if (isNative) {
        const playing = window.XeceayNative.togglePlayPause();
        state.player.isPlaying = playing;
        if (!state.player.songId && state.songs.length > 0) {
          playSongObject(state.songs[0]);
        }
      } else if (webAudio) {
        if (!webAudio.src && state.songs.length > 0) {
          playSongObject(state.songs[0]);
          return;
        }
        if (webAudio.paused) {
          webAudio.play();
          state.player.isPlaying = true;
        } else {
          webAudio.pause();
          state.player.isPlaying = false;
        }
      }
      updatePlayerUiOnly();
    },

    nextTrack() {
      if (state.songs.length === 0) return;
      if (state.player.shuffle) {
        playSongObject(state.songs[Math.floor(Math.random() * state.songs.length)]);
        return;
      }
      const idx = state.songs.findIndex(s => s.id === state.player.songId);
      playSongObject(state.songs[(idx + 1) % state.songs.length]);
    },

    prevTrack() {
      if (state.songs.length === 0) return;
      const idx = state.songs.findIndex(s => s.id === state.player.songId);
      playSongObject(state.songs[(idx - 1 + state.songs.length) % state.songs.length]);
    },

    onWaveformTap(event) {
      const box = document.getElementById("fp-waveform-bars");
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      const targetMs = Math.floor(ratio * (state.player.durationMs || 1));
      state.player.positionMs = targetMs;
      if (isNative) {
        window.XeceayNative.seekTo(targetMs);
      } else if (webAudio) {
        webAudio.currentTime = targetMs / 1000;
      }
      updatePlayerUiOnly();
    },

    onSeekSliderInput(val) {
      state.player.isDraggingSeek = true;
      const targetMs = Math.floor((Number(val) / 1000) * (state.player.durationMs || 1));
      const curEl = document.getElementById("fp-current-time");
      if (curEl) curEl.textContent = formatDuration(targetMs);
      renderWaveformBars(Number(val) / 10);
    },

    onSeekSliderCommit(val) {
      state.player.isDraggingSeek = false;
      const targetMs = Math.floor((Number(val) / 1000) * (state.player.durationMs || 1));
      state.player.positionMs = targetMs;
      if (isNative) {
        window.XeceayNative.seekTo(targetMs);
      } else if (webAudio) {
        webAudio.currentTime = targetMs / 1000;
      }
      updatePlayerUiOnly();
    },

    toggleShuffle() {
      state.player.shuffle = !state.player.shuffle;
      const btn = document.getElementById("fp-shuffle-btn");
      if (btn) btn.classList.toggle("active", state.player.shuffle);
      showToast(state.player.shuffle ? "Shuffle On" : "Shuffle Off");
    },

    cycleRepeatMode() {
      const modes = ["all", "one", "off"];
      const next = modes[(modes.indexOf(state.player.repeatMode) + 1) % modes.length];
      state.player.repeatMode = next;
      showToast("Repeat: " + next.toUpperCase());
    },

    cyclePlaybackSpeed() {
      const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
      const curIdx = speeds.findIndex(s => Math.abs(s - (state.player.speed || 1.0)) < 0.05);
      const nextSpeed = speeds[(curIdx + 1) % speeds.length];
      state.player.speed = nextSpeed;
      if (isNative) window.XeceayNative.setSpeed(nextSpeed);
      else if (webAudio) webAudio.playbackRate = nextSpeed;
      updatePlayerUiOnly();
      showToast(`Speed: ${nextSpeed}x`);
    },

    cycleSleepTimer() {
      const curMin = state.player.sleepRemainingSec > 0 ? Math.round(state.player.sleepRemainingSec / 60) : 0;
      const nextMin = curMin === 0 ? 15 : curMin <= 15 ? 30 : curMin <= 30 ? 60 : 0;
      if (isNative) window.XeceayNative.setSleepTimer(nextMin);
      else state.player.sleepRemainingSec = nextMin * 60;
      updatePlayerUiOnly();
      showToast(nextMin > 0 ? `Sleep Timer: ${nextMin}m` : "Sleep Timer Off");
    },

    openFullPlayer() {
      renderPlayerQueue();
      document.getElementById("full-player-modal").classList.add("open");
    },

    closeFullPlayer() {
      document.getElementById("full-player-modal").classList.remove("open");
    },

    openEqualizerModal() {
      renderEqualizerModal();
      document.getElementById("eq-modal").classList.add("open");
    },

    closeEqualizerModal() {
      document.getElementById("eq-modal").classList.remove("open");
    },

    selectEqPreset(presetName) {
      state.player.eqPreset = presetName;
      state.player.eqBands = (EQ_PRESETS[presetName] || [0, 0, 0, 0, 0]).slice();
      if (isNative) {
        window.XeceayNative.setEqualizer(presetName, JSON.stringify(state.player.eqBands), state.player.bassStrength);
      }
      renderEqualizerModal();
      showToast("Equalizer: " + presetName);
    },

    onEqBandSlider(bandIdx, dbVal) {
      state.player.eqPreset = "Custom";
      state.player.eqBands[bandIdx] = Number(dbVal);
      if (isNative) {
        window.XeceayNative.setEqualizer("Custom", JSON.stringify(state.player.eqBands), state.player.bassStrength);
      }
      renderEqualizerModal();
    },

    onBassSliderChange(val) {
      state.player.bassStrength = Number(val);
      const label = document.getElementById("eq-bass-val");
      if (label) label.textContent = Math.round(val / 10) + "%";
      if (isNative) {
        window.XeceayNative.setEqualizer(state.player.eqPreset, JSON.stringify(state.player.eqBands), state.player.bassStrength);
      }
    },

    toggleFav(songId) {
      if (isNative) {
        const newFav = window.XeceayNative.toggleFavorite(songId);
        const s = state.songs.find(x => x.id === songId);
        if (s) s.isFavorite = newFav;
      } else {
        const s = state.songs.find(x => x.id === songId);
        if (s) s.isFavorite = !s.isFavorite;
      }
      renderAll();
    },

    toggleCurrentFavorite() {
      if (state.player.songId) this.toggleFav(state.player.songId);
    },

    // Search Songs & Online Catalog
    onSearchInput(val) {
      state.searchQuery = val;
      renderSearchScreen();
      clearTimeout(this._searchTimer);
      if (val.trim().length >= 2) {
        this._searchTimer = setTimeout(() => {
          requestNativeOrWebSearch(val.trim(), "search");
        }, 380);
      }
    },

    triggerCatalogSearchNow() {
      const q = (document.getElementById("search-input").value || "").trim();
      if (!q) {
        showToast("Type a song or artist name to search");
        return;
      }
      requestNativeOrWebSearch(q, "search");
    },

    setSearchFilter(filter, el) {
      state.searchFilter = filter;
      document.querySelectorAll("#search-filter-chips .chip").forEach(c => c.classList.remove("active"));
      if (el) el.classList.add("active");
      renderSearchScreen();
    },

    setLibraryTab(tab, el) {
      state.libraryTab = tab;
      document.querySelectorAll("#library-subtabs .chip").forEach(c => c.classList.remove("active"));
      if (el) el.classList.add("active");
      if (tab === "duplicates") this.refreshStorageCard();
      renderLibraryContent();
    },

    setDownloadFilter(filter, el) {
      state.downloadFilter = filter;
      if (el && el.parentElement) {
        el.parentElement.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        el.classList.add("active");
      }
      renderDownloadsScreen();
    },

    // Direct & YouTube Track Downloader (MP3 & MP4)
    downloadDirectTrack(title, artist, artworkUri, sourceUrl, format, mediaType) {
      if (!sourceUrl) {
        showToast("Stream URL unavailable");
        return;
      }
      if (isNative) {
        const res = JSON.parse(
          window.XeceayNative.enqueueDownload(
            title || "Track",
            artist || "Artist",
            "XECEAY Downloads",
            "Music",
            artworkUri || "",
            sourceUrl,
            format || "MP3",
            "320kbps",
            mediaType || "audio"
          )
        );
        if (res.ok) {
          showToast(`Downloading ${format}: ${title}`);
          refreshFromNative();
        } else {
          showToast(res.error || "Already in download queue");
        }
      } else {
        window.open(sourceUrl, "_blank");
      }
    },

    pasteFromClipboard() {
      const inp = document.getElementById("link-importer-input");
      if (isNative && window.XeceayNative.getClipboardText) {
        const clip = window.XeceayNative.getClipboardText();
        if (clip && clip.trim()) {
          inp.value = clip.trim();
          this.analyzeLinkInput();
          return;
        }
      }
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text && text.trim()) {
            inp.value = text.trim();
            this.analyzeLinkInput();
          } else {
            showToast("Clipboard is empty — long-press the input box to paste");
          }
        }).catch(() => {
          inp.focus();
          showToast("Long-press inside the link box to paste");
        });
      } else {
        inp.focus();
      }
    },

    quickTryYouTube(url, label) {
      const inp = document.getElementById("link-importer-input");
      if (inp) inp.value = url;
      showToast("Analyzing: " + label);
      this.analyzeLinkInput();
    },

    analyzeLinkInput() {
      const url = (document.getElementById("link-importer-input").value || "").trim();
      if (!url) {
        showToast("Paste a YouTube or audio/video link first");
        return;
      }
      const box = document.getElementById("link-analysis-result");
      if (box) {
        box.innerHTML = `
          <div class="yt-analyzed-box">
            <div style="font-size:13px;font-weight:700;color:var(--accent-secondary);">Analyzing link & resolving MP4 / MP3 streams...</div>
          </div>
        `;
      }
      if (isNative) {
        window.XeceayNative.analyzeLink(url);
      } else {
        this.renderLinkAnalysisCard({
          ok: true,
          sourceType: "youtube",
          url,
          title: "Coldplay - Viva La Vida (Official Video)",
          artist: "Coldplay",
          durationText: "0:30",
          thumbnail: makeSvgUri("YT", "#1E293B", "#EF4444"),
          downloadUrlMp3: AUTHORIZED_CATALOG[1].sourceReference,
          downloadUrlMp4: AUTHORIZED_CATALOG[1].sourceReference
        });
      }
    },

    // Matches Screenshot 3: Thumbnail + Title + Artist + [Download MP4] & [Download MP3]
    renderLinkAnalysisCard(info) {
      const box = document.getElementById("link-analysis-result");
      if (!box) return;
      if (!info.ok) {
        box.innerHTML = `
          <div class="yt-analyzed-box" style="color:var(--error);font-size:12px;font-weight:600;">
            ${escapeHtml(info.error || "Could not analyze link.")}
          </div>
        `;
        return;
      }
      state.analyzedLink = info;
      const thumb = info.thumbnail || makeSvgUri("YT", "#1E293B", "#8B5CF6");
      const mp3Url = info.downloadUrlMp3 || info.url;
      const mp4Url = info.downloadUrlMp4 || mp3Url;

      box.innerHTML = `
        <div class="yt-analyzed-box">
          <div class="yt-analyzed-header" onclick="XeceayApp.playAnyTrack('yt_${Date.now()}','${escapeAttr(info.title)}','${escapeAttr(info.artist)}','${escapeAttr(thumb)}','${escapeAttr(mp3Url)}',30000)">
            <img src="${thumb}" class="yt-analyzed-thumb" alt="" />
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;color:var(--text-secondary);font-weight:700;">${escapeHtml(info.sourceWebsite || "YouTube Video")} • ${escapeHtml(info.durationText || "0:30")}</div>
              <div style="font-size:17px;font-weight:800;margin-top:3px;line-height:1.25;">${escapeHtml(info.title)}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${escapeHtml(info.artist)}</div>
            </div>
          </div>

          <div class="dual-action-row" style="margin-bottom:0;">
            <button class="dual-pill-btn dark-navy" onclick="XeceayApp.downloadDirectTrack('${escapeAttr(info.title)}','${escapeAttr(info.artist)}','${escapeAttr(thumb)}','${escapeAttr(mp4Url)}','MP4','video')">
              ${SVG.video}
              <span>Download MP4</span>
            </button>
            <button class="dual-pill-btn" onclick="XeceayApp.downloadDirectTrack('${escapeAttr(info.title)}','${escapeAttr(info.artist)}','${escapeAttr(thumb)}','${escapeAttr(mp3Url)}','MP3','audio')">
              ${SVG.musicNote}
              <span>Download MP3</span>
            </button>
          </div>
        </div>
      `;
    },

    pauseDl(id) { if (isNative) window.XeceayNative.pauseDownload(id); },
    resumeDl(id) { if (isNative) window.XeceayNative.resumeDownload(id); },
    cancelDl(id) { if (isNative) window.XeceayNative.cancelDownload(id); },
    retryDl(id) { if (isNative) window.XeceayNative.retryDownload(id); },
    deleteDl(id) {
      if (isNative) window.XeceayNative.deleteDownload(id, true);
      state.downloads = state.downloads.filter(d => d.id !== id);
      renderDownloadsScreen();
    },

    scanDeviceMusic() {
      if (isNative) {
        const count = window.XeceayNative.scanLocalMusic();
        refreshFromNative();
        showToast(`Scanned device (${count} new audio tracks imported)`);
      }
    },

    importLocalFile() {
      if (isNative) window.XeceayNative.openLocalFilePicker();
    },

    promptCreatePlaylist() {
      const name = prompt("Enter new playlist name:", "My XECEAY Mix");
      if (name && name.trim()) {
        if (isNative) {
          window.XeceayNative.createPlaylist(name.trim());
          refreshFromNative();
        }
        showToast("Playlist created: " + name.trim());
      }
    },

    openPlaylistDetails(plId) {
      const pl = state.playlists.find(p => p.id === plId);
      if (!pl) return;
      const songs = getSongsForPlaylist(pl);
      const totalMs = songs.reduce((acc, s) => acc + (s.duration || 0), 0);

      document.getElementById("pl-modal-title").textContent = pl.name;
      document.getElementById("pl-modal-meta").textContent = `${songs.length} songs • Total Duration: ${formatDuration(totalMs)}`;

      document.getElementById("pl-modal-actions").innerHTML = `
        <button class="pill-btn white-pill" onclick="XeceayApp.playPlaylistAll('${escapeAttr(pl.id)}', false)">${SVG.play}<span>Play All</span></button>
        <button class="pill-btn" onclick="XeceayApp.playPlaylistAll('${escapeAttr(pl.id)}', true)">Shuffle</button>
        ${!pl.isSmartPlaylist ? `<button class="pill-btn" style="color:var(--error);" onclick="XeceayApp.deletePlaylistNow('${escapeAttr(pl.id)}')">Delete</button>` : ""}
      `;

      document.getElementById("pl-modal-songs").innerHTML = songs.length === 0
        ? `<div style="font-size:12px;color:#94A3B8;">No songs in this playlist yet.</div>`
        : songs.map((s, idx) => `
          <div class="song-row" style="background:#1C222E;" onclick="XeceayApp.playSongById('${escapeAttr(s.id)}')">
            <div class="track-num-col">${String(idx + 1).padStart(2, "0")}</div>
            <img class="song-thumb" src="${s.artworkUri}" alt="" style="width:40px;height:40px;" />
            <div class="song-info">
              <div class="song-name">${escapeHtml(s.title)}</div>
              <div class="song-meta">${escapeHtml(s.artist)} • ${formatDuration(s.duration)}</div>
            </div>
            ${!pl.isSmartPlaylist ? `<button class="icon-btn" onclick="event.stopPropagation();XeceayApp.removeSongFromPl('${escapeAttr(pl.id)}','${escapeAttr(s.id)}')">${SVG.close}</button>` : ""}
          </div>
        `).join("");

      document.getElementById("playlist-modal").classList.add("open");
    },

    closePlaylistModal() {
      document.getElementById("playlist-modal").classList.remove("open");
    },

    playPlaylistAll(plId, shuffle) {
      const pl = state.playlists.find(p => p.id === plId);
      const songs = getSongsForPlaylist(pl);
      if (songs.length === 0) return;
      state.player.shuffle = Boolean(shuffle);
      const first = shuffle ? songs[Math.floor(Math.random() * songs.length)] : songs[0];
      playSongObject(first);
      this.closePlaylistModal();
    },

    deletePlaylistNow(plId) {
      if (isNative) {
        window.XeceayNative.deletePlaylist(plId);
        refreshFromNative();
        this.closePlaylistModal();
      }
    },

    removeSongFromPl(plId, songId) {
      if (isNative) {
        window.XeceayNative.removeSongFromPlaylist(plId, songId);
        refreshFromNative();
        this.openPlaylistDetails(plId);
      }
    },

    promptAddCurrentToPlaylist() {
      const customPls = state.playlists.filter(p => !p.isSmartPlaylist);
      if (customPls.length === 0) {
        this.promptCreatePlaylist();
        return;
      }
      const names = customPls.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
      const pick = prompt(`Add current song to playlist:\n${names}`, "1");
      const idx = parseInt(pick, 10) - 1;
      if (customPls[idx] && state.player.songId && isNative) {
        window.XeceayNative.addSongToPlaylist(customPls[idx].id, state.player.songId);
        refreshFromNative();
        showToast(`Added to ${customPls[idx].name}`);
      }
    },

    openTagEditor(songId) {
      const s = state.songs.find(x => x.id === songId);
      if (!s) return;
      document.getElementById("tag-song-id").value = s.id;
      document.getElementById("tag-title").value = s.title || "";
      document.getElementById("tag-artist").value = s.artist || "";
      document.getElementById("tag-album").value = s.album || "";
      document.getElementById("tag-genre").value = s.genre || "Electronic";
      document.getElementById("tag-modal").classList.add("open");
    },

    openTagEditorForCurrent() {
      if (state.player.songId) this.openTagEditor(state.player.songId);
    },

    saveTagEdits() {
      const id = document.getElementById("tag-song-id").value;
      const title = document.getElementById("tag-title").value;
      const artist = document.getElementById("tag-artist").value;
      const album = document.getElementById("tag-album").value;
      const genre = document.getElementById("tag-genre").value;
      if (id && isNative) {
        window.XeceayNative.updateSongTags(id, title, artist, album, genre);
        refreshFromNative();
      }
      document.getElementById("tag-modal").classList.remove("open");
      showToast("Metadata tags updated");
    },

    deleteSongById(songId) {
      if (isNative) {
        window.XeceayNative.deleteSong(songId);
        refreshFromNative();
        showToast("Track removed");
      }
    },

    // GitHub Release Auto-Updater (ONLY shows update UI when a strictly NEWER version exists!)
    openGitHubUpdateQuick() {
      this.switchTab("settings");
    },

    checkGitHubReleaseNow(silent) {
      this._silentUpdateCheck = Boolean(silent);
      if (isNative) {
        window.XeceayNative.checkGitHubUpdate("MEYYYNASH/XECEAY");
      }
    },

    downloadReleaseApk(url) {
      if (isNative) {
        window.XeceayNative.downloadAndInstallGitHubApk(url, true);
      }
    },

    installStagedApk() {
      if (isNative) {
        window.XeceayNative.installDownloadedApkNow();
      }
    },

    setTheme(themeName, el) {
      document.body.classList.remove("theme-light", "theme-glass");
      if (themeName === "light") document.body.classList.add("theme-light");
      if (themeName === "glass") document.body.classList.add("theme-glass");
      if (el && el.parentElement) {
        el.parentElement.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        el.classList.add("active");
      }
      state.user.preferences.theme = themeName;
    },

    refreshStorageCard() {
      if (isNative) {
        try {
          state.storage = JSON.parse(window.XeceayNative.getStorageInfo());
        } catch (_e) {}
      }
      renderStorageCard();
    },

    onNativeEvent(evt) {
      if (!evt || !evt.eventType) return;
      const p = evt.payload || {};

      if (evt.eventType === "player_state") {
        Object.assign(state.player, p);
        updatePlayerUiOnly();
        if (p.event === "ended") handleTrackEnded();
      } else if (evt.eventType === "catalog_results") {
        state.isSearchingCatalog = false;
        const arr = p.results || [];
        if (p.requestType === "discovery") {
          state.liveDiscovery = arr;
          renderHomeSections();
        } else {
          state.searchResultsCatalog = arr;
          renderSearchScreen();
        }
      } else if (evt.eventType === "download_update") {
        if (p.deletedId) {
          state.downloads = state.downloads.filter(d => d.id !== p.deletedId);
        } else if (p.id) {
          const idx = state.downloads.findIndex(d => d.id === p.id);
          if (idx >= 0) state.downloads[idx] = p;
          else state.downloads.unshift(p);
          if (p.status === "Completed") {
            refreshFromNative();
            showToast(`Downloaded: ${p.title}`);
          }
        }
        updateGreetingAndStats();
        renderDownloadsScreen();
      } else if (evt.eventType === "link_analysis") {
        this.renderLinkAnalysisCard(p);
      } else if (evt.eventType === "github_update") {
        this.handleGitHubUpdateEvent(p);
      } else if (evt.eventType === "file_imported" || evt.eventType === "media_scanned") {
        refreshFromNative();
      } else if (evt.eventType === "shared_link") {
        if (p.sharedText) {
          this.openYouTubeLinkMode();
          const inp = document.getElementById("link-importer-input");
          if (inp) inp.value = p.sharedText;
          this.analyzeLinkInput();
        }
      }
    },

    handleGitHubUpdateEvent(p) {
      const box = document.getElementById("github-update-status-box");
      const headerBtn = document.getElementById("header-update-btn");
      const headerLbl = document.getElementById("header-update-label");
      const navDot = document.getElementById("nav-update-dot");
      const upToDatePill = document.getElementById("github-up-to-date-pill");
      const upToDateText = document.getElementById("github-up-to-date-text");

      if (p.type === "up_to_date") {
        if (headerBtn) headerBtn.style.display = "none";
        if (navDot) navDot.classList.remove("visible");
        if (box) box.style.display = "none";
        if (upToDatePill) upToDatePill.style.display = "inline-flex";
        if (upToDateText) upToDateText.textContent = `Latest version installed (v${p.installedVersion || "1.0.1"})`;
        if (!this._silentUpdateCheck) {
          showToast(`You already have the latest version (v${p.installedVersion || "1.0.1"})`);
        }
      } else if (p.type === "release_info" && p.isNewer && p.apkUrl) {
        if (headerBtn) headerBtn.style.display = "inline-flex";
        if (headerLbl) headerLbl.textContent = `Update ${p.tagName}`;
        if (navDot) navDot.classList.add("visible");
        if (upToDatePill) upToDatePill.style.display = "none";
        if (box) {
          box.style.display = "block";
          box.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
              <div>
                <span class="badge green">NEW VERSION AVAILABLE</span>
                <strong style="margin-left:6px;">${escapeHtml(p.releaseTitle || p.tagName)}</strong>
              </div>
              <span style="color:var(--text-secondary);">v${escapeHtml(p.installedVersion)} → ${escapeHtml(p.tagName)}</span>
            </div>
            <div style="margin:6px 0;color:var(--text-secondary);">${escapeHtml(p.changelog || "")}</div>
            <div style="margin-top:8px;">
              <button class="pill-btn pulse-update" onclick="XeceayApp.downloadReleaseApk('${escapeAttr(p.apkUrl)}')">
                ${SVG.download}
                <span>Update & Install ${escapeHtml(p.tagName)} (${formatBytes(p.apkSize)})</span>
              </button>
            </div>
          `;
        }
      } else if (p.type === "download_progress") {
        if (box) {
          box.style.display = "block";
          box.innerHTML = `
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <strong>Downloading Update (${p.progress || 0}%)</strong>
              <span>${formatBytes(p.downloadedBytes)} • ${formatBytes(p.speedBps)}/s</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${p.progress || 0}%;"></div></div>
          `;
        }
      } else if (p.type === "download_complete") {
        if (box) {
          box.style.display = "block";
          box.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span class="badge green">UPDATE READY</span>
              <button class="pill-btn white-pill" onclick="XeceayApp.installStagedApk()">Install Update Now</button>
            </div>
          `;
        }
      }
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    refreshFromNative();
    requestNativeOrWebSearch("trending music 2026", "discovery");
    setTimeout(() => {
      const splash = document.getElementById("splash-screen");
      if (splash) splash.classList.add("hidden");
      // Silent background check for strictly newer GitHub releases
      window.XeceayApp.checkGitHubReleaseNow(true);
    }, 950);
  });
})();
