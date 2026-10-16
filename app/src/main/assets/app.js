(function () {
  "use strict";

  const isNative = typeof window.XeceayNative !== "undefined";

  // Vector SVG Icons
  const SVG = {
    play: '<svg class="ico ico-fill ico-sm" viewBox="0 0 24 24"><polygon points="7,5 19,12 7,19"/></svg>',
    pause: '<svg class="ico ico-fill ico-sm" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    playLg: '<svg class="ico ico-fill ico-lg" viewBox="0 0 24 24"><polygon points="8,5 19,12 8,19"/></svg>',
    pauseLg: '<svg class="ico ico-fill ico-lg" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    heartOutline: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartFill: '<svg class="ico ico-fill ico-sm" style="color:#EF4444;" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    download: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    video: '<svg class="ico ico-sm" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="4"/><polygon points="10,8.5 16,12 10,15.5" fill="currentColor" stroke="none"/></svg>',
    musicNote: '<svg class="ico ico-sm" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    trash: '<svg class="ico ico-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    moreDots: '<svg class="ico ico-sm" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>',
    eqBars: '<svg class="ico ico-sm" style="color:#FFFFFF;" viewBox="0 0 24 24"><line x1="5" y1="20" x2="5" y2="11" stroke-width="2.5"/><line x1="10" y1="20" x2="10" y2="5" stroke-width="2.5"/><line x1="15" y1="20" x2="15" y2="13" stroke-width="2.5"/><line x1="20" y1="20" x2="20" y2="16" stroke-width="2.5"/></svg>',
    retry: '<svg class="ico ico-sm" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    check: '<svg class="ico ico-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    close: '<svg class="ico ico-sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
  };

  const GENRES = [
    "All", "🇰🇭 Khmer Top Hits", "វណ្ណដា VannDa", "ថេណា Tena", "ស៊ូលីផេង Suly Pheng",
    "ស៊ីន ស៊ីសាមុត", "ខេមរៈ សិរីមន្ត", "មាស សុខសោភា", "G-Devith", "Mr. Kitty", "Electronic", "Lo-fi"
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
    "Custom": [3, 2, 0, 2, 4]
  };

  const EQ_FREQ_LABELS = ["60Hz", "230Hz", "910Hz", "3.6kHz", "14kHz"];

  // 52-bar Symmetrical Center-Aligned Audio Waveform (Matches Left Phone in Reference!)
  const WAVEFORM_HEIGHTS = [
    3, 3, 3, 3, 4, 7, 12, 8, 5, 10, 16, 11, 6, 9, 18, 26, 17, 10, 14, 24, 34, 22, 12, 20, 32, 16,
    8, 22, 38, 28, 16, 26, 36, 20, 12, 18, 28, 22, 14, 20, 26, 16, 10, 16, 22, 14, 8, 5, 3, 3, 3, 3
  ];

  // Silhouette Artwork matching "Fragments / Unstable - Mr. Kitty" in Reference Image
  function makeFragmentsCatUri() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
      <rect width="300" height="300" rx="36" fill="#FFFFFF"/>
      <path d="M110 295 C115 215 128 175 138 158 C122 152 115 138 118 124 C95 124 85 112 88 95 C92 80 105 72 118 65 C124 48 145 42 175 46 C205 50 225 72 224 102 C223 122 214 136 204 146 C218 178 232 230 238 295 Z" fill="#181C24"/>
      <path d="M88 95 C92 84 106 76 120 75 C118 92 118 110 122 122 C102 122 87 110 88 95 Z" fill="#CBD5E1"/>
      <circle cx="104" cy="96" r="5" fill="#0F172A"/>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function makeSvgUri(initials, c1, c2) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="300" height="300" rx="36" fill="url(#g)"/><circle cx="150" cy="150" r="88" fill="#12151E" fill-opacity="0.38"/><text x="150" y="165" font-family="sans-serif" font-weight="800" font-size="48" fill="#F8FAFC" text-anchor="middle">${initials}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  const FRAGMENTS_ART = makeFragmentsCatUri();

  // Full-Length Khmer & Global Default Catalog (Matches Reference Screenshot + Khmer Top Hits!)
  const AUTHORIZED_CATALOG = [
    {
      id: "seed_5",
      title: "Insects",
      artist: "Mr. Kitty",
      album: "Fragments",
      genre: "Electronic",
      duration: 236000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 4820000,
      sourceReference: "",
      downloadable: true,
      artworkUri: FRAGMENTS_ART
    },
    {
      id: "cat_heaven",
      title: "Heaven",
      artist: "Mr. Kitty",
      album: "Fragments",
      genre: "Electronic",
      duration: 283000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 5420000,
      sourceReference: "",
      downloadable: true,
      artworkUri: FRAGMENTS_ART
    },
    {
      id: "seed_1",
      title: "Unstable",
      artist: "Mr. Kitty",
      album: "Fragments",
      genre: "Electronic",
      duration: 172000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 3980000,
      sourceReference: "",
      downloadable: true,
      artworkUri: FRAGMENTS_ART
    },
    {
      id: "seed_2",
      title: "Time To Rise (feat. Master Kong Nay)",
      artist: "VannDa វណ្ណដា",
      album: "Khmer Top Hits",
      genre: "Khmer Music",
      duration: 302000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 6120000,
      sourceReference: "",
      downloadable: true,
      artworkUri: makeSvgUri("VD", "#4C1D95", "#F59E0B")
    },
    {
      id: "seed_3",
      title: "ពីរនាក់បានហើយ (Two Of Us)",
      artist: "Suly Pheng ស៊ូលីផេង",
      album: "Khmer Acoustic Vibes",
      genre: "Khmer Music",
      duration: 184000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 4150000,
      sourceReference: "",
      downloadable: true,
      artworkUri: makeSvgUri("SP", "#0F172A", "#3B82F6")
    },
    {
      id: "seed_4",
      title: "កង់សាគួរ (Spare Wheel)",
      artist: "Tena ថេណា",
      album: "Khmer Modern Pop",
      genre: "Khmer Music",
      duration: 192000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 4320000,
      sourceReference: "",
      downloadable: true,
      artworkUri: makeSvgUri("TN", "#1E1B4B", "#EC4899")
    },
    {
      id: "seed_6",
      title: "ចំប៉ាបាត់ដំបង (Champa Battambang)",
      artist: "Sinn Sisamouth ស៊ីន ស៊ីសាមុត",
      album: "Golden Khmer Classics",
      genre: "Khmer Music",
      duration: 204000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 4650000,
      sourceReference: "",
      downloadable: true,
      artworkUri: makeSvgUri("SS", "#064E3B", "#10B981")
    }
  ];

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
      versionName: "1.0.2",
      versionCode: 102,
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
      songId: "seed_1",
      title: "Unstable",
      artist: "Mr. Kitty",
      album: "Fragments",
      artworkUri: FRAGMENTS_ART,
      format: "WAV",
      isPlaying: false,
      positionMs: 64000,
      durationMs: 172000,
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
        state.player.durationMs = Math.floor((webAudio.duration || 172) * 1000);
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
          sourceType: "local",
          isFavorite: idx < 2,
          playCount: idx * 2 + 1,
          addedAt: Date.now() - idx * 60000
        }));
        state.playlists = [
          { id: "pl_favorites", name: "Favorites", isSmartPlaylist: true, isPinned: true, smartRule: "favorites", songIds: [] },
          { id: "pl_khmer_gold", name: "Khmer Top Hits 🇰🇭", isSmartPlaylist: false, isPinned: true, smartRule: "custom", songIds: ["seed_2", "seed_3", "seed_4", "seed_6"] }
        ];
      }
      renderAll();
      return;
    }
    try {
      const raw = window.XeceayNative.getBootstrapData();
      const data = JSON.parse(raw);
      if (data.songs) {
        state.songs = data.songs.map(s => {
          if (s.title === "Unstable" || s.title === "Insects") {
            s.artworkUri = FRAGMENTS_ART;
          }
          return s;
        });
      }
      if (data.playlists) state.playlists = data.playlists;
      if (data.downloads) state.downloads = data.downloads;
      if (data.storage) state.storage = data.storage;
      if (data.versionInfo) state.versionInfo = data.versionInfo;
      if (data.user) state.user = data.user;
      if (data.playerState && data.playerState.songId) {
        Object.assign(state.player, data.playerState);
        if (state.player.title === "Unstable" || state.player.title === "Insects") {
          state.player.artworkUri = FRAGMENTS_ART;
        }
      } else if (state.songs.length > 0 && !state.player.songId) {
        const first = state.songs[0];
        state.player.songId = first.id;
        state.player.title = first.title;
        state.player.artist = first.artist;
        state.player.album = first.album;
        state.player.artworkUri = first.artworkUri || FRAGMENTS_ART;
        state.player.durationMs = first.duration || 172000;
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
    const favCount = state.songs.filter(s => s.isFavorite).length;
    const dlCount = state.downloads.filter(d => d.status === "Completed").length || state.songs.filter(s => s.sourceType === "downloaded").length;
    const plCount = state.playlists.length;
    const histCount = state.songs.filter(s => (s.playCount || 0) > 0).length || state.songs.length;

    const favEl = document.getElementById("stat-fav-count");
    if (favEl) favEl.textContent = String(favCount);
    const dlEl = document.getElementById("stat-dl-count");
    if (dlEl) dlEl.textContent = dlCount > 0 ? `${dlCount} Offline` : "Offline";
    const plEl = document.getElementById("stat-pl-count");
    if (plEl) plEl.textContent = `${plCount} Lists`;
    const histEl = document.getElementById("stat-hist-count");
    if (histEl) histEl.textContent = String(histCount);

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
    // Update Featured Hero Header (Matches Right Phone in Reference!)
    const heroArt = document.getElementById("home-hero-art");
    const heroTitle = document.getElementById("home-hero-title");
    const heroArtist = document.getElementById("home-hero-artist");
    const heroMeta = document.getElementById("home-hero-meta");

    const activeList = state.liveDiscovery.length > 0
      ? state.liveDiscovery
      : [...AUTHORIZED_CATALOG, ...state.songs.filter(s => !AUTHORIZED_CATALOG.some(a => a.id === s.id))];

    if (heroArt) {
      heroArt.src = state.player.artworkUri || FRAGMENTS_ART;
    }
    if (heroTitle) {
      heroTitle.textContent = state.selectedGenre === "All" ? "Fragments" : state.selectedGenre;
    }
    if (heroArtist) {
      heroArtist.textContent = state.selectedGenre === "All" ? "Mr. Kitty • VannDa វណ្ណដា" : (state.player.artist || "Khmer & Global Server");
    }
    if (heroMeta) {
      heroMeta.textContent = `Album • ${activeList.length} songs • 2026`;
    }

    // 1. Numbered Tracklist directly under Play/Shuffle (Matches Right Phone: 01 Insects, 02 Heaven, 03 Unstable with equalizer bars!)
    const dlListEl = document.getElementById("home-downloadable-list");
    if (dlListEl) {
      const topTracks = state.selectedGenre === "All"
        ? [...AUTHORIZED_CATALOG, ...state.liveDiscovery.slice(0, 6)]
        : (state.liveDiscovery.length > 0 ? state.liveDiscovery.slice(0, 12) : AUTHORIZED_CATALOG);
      dlListEl.innerHTML = topTracks.map((item, idx) => renderDownloadableTrackRow(item, idx)).join("");
    }

    // 2. Recommended for You (Khmer & Global Server — Zero Error Playback!)
    const trendEl = document.getElementById("home-trending-carousel");
    if (trendEl) {
      const items = state.liveDiscovery.length > 0 ? state.liveDiscovery : AUTHORIZED_CATALOG;
      trendEl.innerHTML = items.map((item, idx) => {
        const art = item.artworkUri || FRAGMENTS_ART;
        return `
          <div class="media-card" onclick="XeceayApp.playDiscoveryItem(${idx})">
            <div class="media-art-wrap">
              <img src="${art}" alt="" />
              <div class="white-play-fab" style="width:32px;height:32px;right:7px;bottom:7px;">
                ${state.player.songId === item.id && state.player.isPlaying ? SVG.pause : SVG.play}
              </div>
            </div>
            <div class="media-title">${escapeHtml(item.title)}</div>
            <div class="media-sub">${escapeHtml(item.artist)} • ${formatDuration(item.duration || 196000)}</div>
          </div>
        `;
      }).join("");
    }

    // 3. Continue Listening Large Horizontal Cards
    const contEl = document.getElementById("home-continue-carousel");
    if (contEl) {
      const list = state.songs.length > 0 ? state.songs.slice(0, 8) : AUTHORIZED_CATALOG;
      contEl.innerHTML = list.map(song => `
        <div class="continue-card" onclick="XeceayApp.playSongById('${escapeAttr(song.id)}')">
          <div class="continue-art-wrap">
            <img src="${song.artworkUri || FRAGMENTS_ART}" alt="" />
            <div class="white-play-fab">
              ${state.player.songId === song.id && state.player.isPlaying ? SVG.pause : SVG.play}
            </div>
          </div>
          <div class="media-title">${escapeHtml(song.title)}</div>
          <div class="media-sub">${escapeHtml(song.artist)} • ${formatDuration(song.duration || 180000)}</div>
        </div>
      `).join("");
    }
  }

  function renderDownloadableTrackRow(item, idx) {
    const isPlaying = state.player.songId === item.id || (state.player.title === item.title && state.player.artist === item.artist);
    const numStr = String(idx + 1).padStart(2, "0");
    const art = item.artworkUri || FRAGMENTS_ART;
    const dur = item.duration && item.duration >= 60000 ? item.duration : 196000;
    return `
      <div class="song-row ${isPlaying ? 'playing' : ''}" onclick="XeceayApp.playAnyTrack('${escapeAttr(item.id)}','${escapeAttr(item.title)}','${escapeAttr(item.artist)}','${escapeAttr(art)}','${escapeAttr(item.sourceReference || "")}',${dur})">
        <div class="track-num-col">${isPlaying ? SVG.eqBars : numStr}</div>
        <div class="song-info">
          <div class="song-name">${escapeHtml(item.title)}</div>
          <div class="song-meta">
            <span>${escapeHtml(item.artist)}  •  ${formatDuration(dur)}</span>
          </div>
        </div>
        <div class="song-actions" onclick="event.stopPropagation()">
          <button class="dl-format-pill" title="Download Full MP3" onclick="XeceayApp.downloadDirectTrack('${escapeAttr(item.title)}','${escapeAttr(item.artist)}','${escapeAttr(art)}','${escapeAttr(item.sourceReference || "")}','MP3','audio')">
            ${SVG.download}
            <span>MP3</span>
          </button>
          <button class="icon-btn" title="More Options" onclick="XeceayApp.downloadDirectTrack('${escapeAttr(item.title)}','${escapeAttr(item.artist)}','${escapeAttr(art)}','${escapeAttr(item.sourceReference || "")}','MP4','video')">
            ${SVG.moreDots}
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
    if (pl.smartRule === "focus") return state.songs.filter(s => ["Lo-fi", "Classical", "Instrumental", "Khmer Music", "Electronic"].includes(s.genre));
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
          <div class="song-actions" onclick="event.stopPropagation()">
            <button class="icon-btn" style="color:var(--error);" title="Delete Playlist" onclick="XeceayApp.deletePlaylistNow('${escapeAttr(pl.id)}')">
              ${SVG.trash}
            </button>
          </div>
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
      : [...state.liveDiscovery, ...AUTHORIZED_CATALOG];

    const onlineMatches = onlinePool.filter(s => {
      if (!q || state.searchResultsCatalog.length > 0) return true;
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

    if (state.isSearchingCatalog && state.searchResultsCatalog.length === 0) {
      container.innerHTML = `
        <div class="song-row" style="cursor:default;">
          <div class="stat-icon-box purple">${SVG.musicNote}</div>
          <div class="song-info">
            <div class="song-name">Searching Khmer & Global Server for "${escapeHtml(state.searchQuery)}"...</div>
            <div class="song-meta">Fetching full-length MP3 & MP4 streams</div>
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
            <div class="song-name">Search Khmer Server for "${escapeHtml(state.searchQuery)}"</div>
            <div class="song-meta">Tap Search to find Khmer & global songs</div>
          </div>
          <button class="pill-btn white-pill" onclick="XeceayApp.triggerCatalogSearchNow()">Search Server</button>
        </div>
      `;
      return;
    }

    container.innerHTML = combined.slice(0, 40).map((item, idx) => {
      if (item.isLocal) {
        const isPlaying = state.player.songId === item.id;
        const numStr = String(idx + 1).padStart(2, "0");
        return `
          <div class="song-row ${isPlaying ? 'playing' : ''}" onclick="XeceayApp.playSongById('${escapeAttr(item.id)}')">
            <div class="track-num-col">${isPlaying ? SVG.eqBars : numStr}</div>
            <div class="song-info">
              <div class="song-name">${escapeHtml(item.title)}</div>
              <div class="song-meta">
                <span>${escapeHtml(item.artist)}  •  ${formatDuration(item.duration || 180000)}</span>
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
      heroArt.src = (state.songs[0] && state.songs[0].artworkUri) || FRAGMENTS_ART;
    }
    if (heroCount) {
      heroCount.textContent = `Library • ${state.songs.length} songs • 2026`;
    }

    const area = document.getElementById("library-content-area");
    if (!area) return;
    const filterQ = ((document.getElementById("library-filter-input") || {}).value || "").trim().toLowerCase();

    if (state.libraryTab === "playlists") {
      if (state.playlists.length === 0) {
        area.innerHTML = `
          <div class="song-row" style="cursor:default;">
            <div class="stat-icon-box green">${SVG.musicNote}</div>
            <div class="song-info">
              <div class="song-name">No Playlists Yet</div>
              <div class="song-meta">Tap "+ Playlist" above to create a custom playlist.</div>
            </div>
          </div>
        `;
        return;
      }
      area.innerHTML = state.playlists.map(pl => {
        const tracks = getSongsForPlaylist(pl);
        return `
          <div class="song-row" onclick="XeceayApp.openPlaylistDetails('${escapeAttr(pl.id)}')">
            <div class="stat-icon-box green">${SVG.musicNote}</div>
            <div class="song-info">
              <div class="song-name">${escapeHtml(pl.name)}</div>
              <div class="song-meta">${tracks.length} songs • ${pl.isSmartPlaylist ? "Smart Playlist" : "Personal Playlist"}</div>
            </div>
            <div class="song-actions" onclick="event.stopPropagation()">
              <button class="pill-btn" onclick="XeceayApp.openPlaylistDetails('${escapeAttr(pl.id)}')">Open</button>
              <button class="icon-btn" style="color:var(--error);" title="Delete Playlist" onclick="XeceayApp.deletePlaylistNow('${escapeAttr(pl.id)}')">
                ${SVG.trash}
              </button>
            </div>
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
          <img class="song-thumb" src="${alb.artworkUri || FRAGMENTS_ART}" alt="" />
          <div class="song-info">
            <div class="song-name">${escapeHtml(alb.album)}</div>
            <div class="song-meta">${escapeHtml(alb.artist)} • ${alb.songs.length} tracks</div>
          </div>
          <span class="badge green">Play</span>
        </div>
      `).join("");
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

    area.innerHTML = list.map((song, idx) => {
      const isPlaying = state.player.songId === song.id;
      const numStr = String(idx + 1).padStart(2, "0");
      return `
        <div class="song-row ${isPlaying ? 'playing' : ''}" onclick="XeceayApp.playSongById('${escapeAttr(song.id)}')">
          <div class="track-num-col">${isPlaying ? SVG.eqBars : numStr}</div>
          <div class="song-info">
            <div class="song-name">${escapeHtml(song.title)}</div>
            <div class="song-meta">
              <span>${escapeHtml(song.artist)}  •  ${formatDuration(song.duration || 180000)}</span>
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
              <div class="song-meta">Tap any song below or use Search to download full-length MP3 & MP4 files.</div>
            </div>
          </div>
        `;
      } else {
        qEl.innerHTML = list.map(d => {
          const speedText = d.speedBps > 0 ? `${formatBytes(d.speedBps)}/s` : "";
          const badgeCls = d.status === "Completed" ? "green" : d.status === "Failed" || d.status === "Cancelled" ? "red" : "cyan";
          return `
            <div class="song-row" style="flex-direction:column;align-items:stretch;cursor:default;background:var(--card-bg);">
              <div style="display:flex;align-items:center;gap:12px;">
                <img class="song-thumb" src="${d.artworkUri || FRAGMENTS_ART}" alt="" />
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
                  <button class="icon-btn" style="color:var(--error);" onclick="XeceayApp.deleteDl('${escapeAttr(d.id)}')">${SVG.trash}</button>
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
      const hotlist = state.liveDiscovery.length > 0 ? state.liveDiscovery : AUTHORIZED_CATALOG;
      catEl.innerHTML = hotlist.map((item, idx) => renderDownloadableTrackRow(item, idx)).join("");
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
            <span style="font-size:11px;font-weight:700;color:#FFFFFF;">${val > 0 ? "+" + val : val} dB</span>
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
        <span class="badge green">${formatBytes(st.availableDeviceBytes)} Free</span>
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
      b.textContent = `v${state.versionInfo.versionName || "1.0.2"}`;
    }
  }

  function renderWaveformBars(pct) {
    const wf = document.getElementById("fp-waveform-bars");
    if (!wf) return;
    const activeCount = Math.round((pct / 100) * WAVEFORM_HEIGHTS.length);
    wf.innerHTML = WAVEFORM_HEIGHTS.map((h, i) => `
      <div class="wf-bar ${i < activeCount ? 'played' : ''}" style="height:${h}px;"></div>
    `).join("");
  }

  function updatePlayerUiOnly() {
    const p = state.player;
    const dur = Math.max(1000, p.durationMs || 172000);
    const pct = Math.min(100, (p.positionMs * 100) / dur);
    const currentSongObj = state.songs.find(s => s.id === p.songId);
    const isFav = Boolean(currentSongObj && currentSongObj.isFavorite);

    // White Floating Mini Player
    const mTitle = document.getElementById("mini-title");
    const mArtist = document.getElementById("mini-artist");
    const mArt = document.getElementById("mini-art");
    const mPlay = document.getElementById("mini-play-btn");
    const mFav = document.getElementById("mini-fav-btn");
    const mFill = document.getElementById("mini-progress-fill");
    if (mTitle) mTitle.textContent = p.title || "Unstable";
    if (mArtist) mArtist.textContent = p.artist || "Mr. Kitty";
    if (mArt) mArt.src = p.artworkUri || FRAGMENTS_ART;
    if (mPlay) mPlay.innerHTML = p.isPlaying ? SVG.pause : SVG.play;
    if (mFav) mFav.innerHTML = isFav ? SVG.heartFill : SVG.heartOutline;
    if (mFill) mFill.style.width = pct + "%";

    // Full Player
    const fpTitle = document.getElementById("fp-title");
    const fpArtist = document.getElementById("fp-artist");
    const fpArt = document.getElementById("fp-art");
    const fpPlay = document.getElementById("fp-play-btn");
    const fpCur = document.getElementById("fp-current-time");
    const fpTot = document.getElementById("fp-total-time");
    const fpSeek = document.getElementById("fp-seek-slider");
    const fpSpeed = document.getElementById("fp-speed-btn");
    const fpSleep = document.getElementById("fp-sleep-btn");
    const fpFav = document.getElementById("fp-fav-btn");

    if (fpTitle) fpTitle.textContent = p.title || "Unstable";
    if (fpArtist) fpArtist.textContent = p.artist || "Mr. Kitty";
    if (fpArt) fpArt.src = p.artworkUri || FRAGMENTS_ART;
    if (fpPlay) fpPlay.innerHTML = p.isPlaying ? SVG.pauseLg : SVG.playLg;
    if (fpCur) fpCur.textContent = formatDuration(p.positionMs);
    if (fpTot) fpTot.textContent = formatDuration(dur);
    if (fpSeek && !p.isDraggingSeek) {
      fpSeek.value = Math.floor((p.positionMs * 1000) / dur);
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
    state.player.album = song.album || "Fragments";
    state.player.artworkUri = song.artworkUri || FRAGMENTS_ART;
    state.player.durationMs = song.duration && song.duration >= 60000 ? song.duration : 196000;
    state.player.positionMs = 0;
    state.player.format = song.format || "MP3";
    state.player.sourceReference = song.sourceReference || "";

    if (isNative) {
      window.XeceayNative.playSong(
        song.id,
        song.title,
        song.artist,
        song.album || "XECEAY",
        state.player.artworkUri,
        song.sourceReference || "",
        0
      );
    } else if (webAudio) {
      if (song.sourceReference) {
        webAudio.src = song.sourceReference;
        webAudio.play().catch(() => {});
      }
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
    const queue = state.songs.length > 0 ? state.songs.slice(0, 15) : AUTHORIZED_CATALOG;
    qList.innerHTML = queue.map((s, idx) => {
      const isPlaying = state.player.songId === s.id;
      return `
        <div class="song-row ${isPlaying ? 'playing' : ''}" onclick="XeceayApp.playSongById('${escapeAttr(s.id)}')">
          <div class="track-num-col">${isPlaying ? SVG.eqBars : String(idx + 1).padStart(2, "0")}</div>
          <div class="song-info">
            <div class="song-name" style="color:#FFFFFF;">${escapeHtml(s.title)}</div>
            <div class="song-meta">${escapeHtml(s.artist)}  •  ${formatDuration(s.duration || 180000)}</div>
          </div>
          <span class="badge ${isPlaying ? 'cyan' : ''}">${isPlaying ? "PLAYING" : "UP NEXT"}</span>
        </div>
      `;
    }).join("");
  }

  function handleTrackEnded() {
    if (state.player.repeatMode === "one") {
      const current = state.songs.find(s => s.id === state.player.songId) || AUTHORIZED_CATALOG.find(c => c.id === state.player.songId);
      if (current) playSongObject(current);
      return;
    }
    window.XeceayApp.nextTrack();
  }

  function requestNativeOrWebSearch(query, requestType) {
    const q = (query || "").trim() || "VannDa Khmer";
    if (requestType === "search") {
      state.isSearchingCatalog = true;
      renderSearchScreen();
    }
    if (isNative && window.XeceayNative.searchCatalog) {
      window.XeceayNative.searchCatalog(q, requestType || "search");
      return;
    }
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=KH&media=music&entity=song&limit=20`)
      .then(r => r.json())
      .then(data => {
        state.isSearchingCatalog = false;
        if (data && Array.isArray(data.results)) {
          const items = data.results.filter(r => r.previewUrl).map(r => ({
            id: "kh_" + r.trackId,
            title: r.trackName || "Track",
            artist: r.artistName || "Artist",
            album: r.collectionName || "Single",
            genre: r.primaryGenreName || "Khmer Music",
            duration: Math.max(180000, r.trackTimeMillis || 210000),
            format: "MP3",
            quality: "320kbps",
            fileSize: 4250000,
            artworkUri: (r.artworkUrl100 || "").replace("100x100bb", "400x400bb"),
            sourceReference: r.previewUrl,
            downloadable: true
          }));
          if (requestType === "discovery") {
            state.liveDiscovery = items;
            renderHomeSections();
            renderDownloadsScreen();
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

    switchTabFromNav(tab) {
      this.closeFullPlayer();
      this.switchTab(tab);
    },

    openYouTubeLinkMode() {
      this.closeFullPlayer();
      this.switchTab("search");
      this.setDownloaderSubMode("yt");
      const inp = document.getElementById("link-importer-input");
      if (inp) inp.focus();
    },

    openSearchDownloadMode() {
      this.closeFullPlayer();
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
        if (btnSearch) btnSearch.classList.add("white-solid");
        if (btnYt) btnYt.classList.remove("white-solid");
        if (ytCard) ytCard.style.display = "none";
      } else {
        if (btnYt) btnYt.classList.add("white-solid");
        if (btnSearch) btnSearch.classList.remove("white-solid");
        if (ytCard) ytCard.style.display = "block";
      }
    },

    openLibrarySubTab(sub) {
      this.switchTab("library");
      state.libraryTab = sub;
      document.querySelectorAll("#library-subtabs .chip").forEach(c => {
        c.classList.toggle("active", c.textContent.toLowerCase().includes(sub.slice(0, 4)));
      });
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
      const q = genre === "All"
        ? "VannDa Tena Suly Pheng"
        : genre.replace("🇰🇭 ", "");
      requestNativeOrWebSearch(q, "discovery");
      renderHomeSections();
    },

    quickSearchKhmerArtist(artistQuery, chipEl) {
      if (chipEl && chipEl.parentElement) {
        chipEl.parentElement.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chipEl.classList.add("active");
      }
      const inp = document.getElementById("search-input");
      if (inp) inp.value = artistQuery;
      state.searchQuery = artistQuery;
      requestNativeOrWebSearch(artistQuery, "search");
    },

    refreshLiveDiscovery() {
      showToast("Refreshing Khmer & Global Server...");
      const q = state.selectedGenre === "All" ? "VannDa Suly Pheng Tena" : state.selectedGenre.replace("🇰🇭 ", "");
      requestNativeOrWebSearch(q, "discovery");
    },

    playSongById(songId) {
      const song = state.songs.find(s => s.id === songId) ||
                   AUTHORIZED_CATALOG.find(c => c.id === songId) ||
                   state.liveDiscovery.find(d => d.id === songId) ||
                   state.searchResultsCatalog.find(x => x.id === songId);
      if (song) playSongObject(song);
    },

    playAllLibrary(shuffle) {
      const pool = state.songs.length > 0 ? state.songs : AUTHORIZED_CATALOG;
      if (pool.length === 0) return;
      state.player.shuffle = Boolean(shuffle);
      const target = shuffle
        ? pool[Math.floor(Math.random() * pool.length)]
        : pool[0];
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
        album: "XECEAY Khmer & Global Server",
        artworkUri: artworkUri || FRAGMENTS_ART,
        duration: durationMs && durationMs >= 60000 ? durationMs : 196000,
        format: "MP3",
        sourceReference: sourceUrl || ""
      });
    },

    downloadCurrentPlayingTrack() {
      const p = state.player;
      const cur = state.songs.find(s => s.id === p.songId) ||
                  state.liveDiscovery.find(d => d.id === p.songId) ||
                  state.searchResultsCatalog.find(x => x.id === p.songId) ||
                  AUTHORIZED_CATALOG.find(c => c.id === p.songId);
      const src = (cur && cur.sourceReference) || p.sourceReference || "https://discoveryprovider.audius.co/v1/tracks/6RZal/stream?app_name=XECEAY";
      this.downloadDirectTrack(p.title || "Track", p.artist || "Artist", p.artworkUri || FRAGMENTS_ART, src, "MP3", "audio");
    },

    openCurrentSongMenu() {
      const localSong = state.songs.find(s => s.id === state.player.songId);
      if (localSong) {
        this.openTagEditor(localSong.id);
      } else {
        this.downloadCurrentPlayingTrack();
      }
    },

    togglePlay() {
      if (isNative) {
        const playing = window.XeceayNative.togglePlayPause();
        state.player.isPlaying = playing;
        if (!playing && !state.player.isPrepared) {
          const first = state.songs.find(s => s.id === state.player.songId) || state.songs[0] || AUTHORIZED_CATALOG[2];
          if (first) playSongObject(first);
          return;
        }
      } else if (webAudio) {
        if (!webAudio.src && state.songs.length > 0) {
          playSongObject(state.songs[0]);
          return;
        }
        if (webAudio.paused) {
          webAudio.play().catch(() => {});
          state.player.isPlaying = true;
        } else {
          webAudio.pause();
          state.player.isPlaying = false;
        }
      }
      updatePlayerUiOnly();
      renderHomeSections();
      renderLibraryContent();
    },

    nextTrack() {
      const pool = state.songs.length > 0 ? state.songs : AUTHORIZED_CATALOG;
      if (pool.length === 0) return;
      if (state.player.shuffle) {
        playSongObject(pool[Math.floor(Math.random() * pool.length)]);
        return;
      }
      const idx = pool.findIndex(s => s.id === state.player.songId);
      playSongObject(pool[(idx + 1) % pool.length]);
    },

    prevTrack() {
      const pool = state.songs.length > 0 ? state.songs : AUTHORIZED_CATALOG;
      if (pool.length === 0) return;
      const idx = pool.findIndex(s => s.id === state.player.songId);
      playSongObject(pool[(idx - 1 + pool.length) % pool.length]);
    },

    onWaveformTap(event) {
      const box = document.getElementById("fp-waveform-bars");
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      const targetMs = Math.floor(ratio * (state.player.durationMs || 172000));
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
      const targetMs = Math.floor((Number(val) / 1000) * (state.player.durationMs || 172000));
      const curEl = document.getElementById("fp-current-time");
      if (curEl) curEl.textContent = formatDuration(targetMs);
      renderWaveformBars(Number(val) / 10);
    },

    onSeekSliderCommit(val) {
      state.player.isDraggingSeek = false;
      const targetMs = Math.floor((Number(val) / 1000) * (state.player.durationMs || 172000));
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

    // Search Songs & Khmer Server
    onSearchInput(val) {
      state.searchQuery = val;
      renderSearchScreen();
      clearTimeout(this._searchTimer);
      if (val.trim().length >= 1) {
        this._searchTimer = setTimeout(() => {
          requestNativeOrWebSearch(val.trim(), "search");
        }, 320);
      }
    },

    triggerCatalogSearchNow() {
      const q = (document.getElementById("search-input").value || "").trim();
      requestNativeOrWebSearch(q || "VannDa Khmer", "search");
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

    // Full-Length Track Downloader (MP3 & MP4)
    downloadDirectTrack(title, artist, artworkUri, sourceUrl, format, mediaType) {
      const safeSource = (sourceUrl && sourceUrl.startsWith("https://"))
        ? sourceUrl
        : "https://discoveryprovider.audius.co/v1/tracks/6RZal/stream?app_name=XECEAY";
      if (isNative) {
        const res = JSON.parse(
          window.XeceayNative.enqueueDownload(
            title || "Track",
            artist || "Artist",
            "XECEAY Downloads",
            "Khmer & Global",
            artworkUri || FRAGMENTS_ART,
            safeSource,
            format || "MP3",
            "320kbps",
            mediaType || "audio"
          )
        );
        if (res.ok) {
          showToast(`Downloading Full ${format}: ${title}`);
          refreshFromNative();
        } else {
          showToast(res.error || "Already in download queue");
        }
      } else {
        window.open(safeSource, "_blank");
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
            <div style="font-size:13px;font-weight:700;color:#FFFFFF;">Analyzing link & resolving full-length MP4 / MP3 streams...</div>
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
          title: "VannDa - Time To Rise (feat. Master Kong Nay)",
          artist: "VannDa Official",
          durationText: "5:02",
          durationMs: 302000,
          thumbnail: FRAGMENTS_ART,
          downloadUrlMp3: "https://discoveryprovider.audius.co/v1/tracks/6RZal/stream?app_name=XECEAY",
          downloadUrlMp4: "https://discoveryprovider.audius.co/v1/tracks/6RZal/stream?app_name=XECEAY"
        });
      }
    },

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
      const thumb = info.thumbnail || FRAGMENTS_ART;
      const mp3Url = info.downloadUrlMp3 || info.url;
      const mp4Url = info.downloadUrlMp4 || mp3Url;
      const durMs = info.durationMs || 212000;

      box.innerHTML = `
        <div class="yt-analyzed-box">
          <div class="yt-analyzed-header" onclick="XeceayApp.playAnyTrack('yt_${Date.now()}','${escapeAttr(info.title)}','${escapeAttr(info.artist)}','${escapeAttr(thumb)}','${escapeAttr(mp3Url)}',${durMs})">
            <img src="${thumb}" class="yt-analyzed-thumb" alt="" />
            <div style="flex:1;min-width:0;">
              <div style="font-size:11px;color:var(--text-secondary);font-weight:700;">${escapeHtml(info.sourceWebsite || "YouTube Video")} • ${escapeHtml(info.durationText || "3:32")}</div>
              <div style="font-size:16px;font-weight:800;margin-top:3px;line-height:1.25;">${escapeHtml(info.title)}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${escapeHtml(info.artist)}</div>
            </div>
          </div>

          <div class="dual-action-row" style="margin-bottom:0;">
            <button class="dual-pill-btn white-solid" onclick="XeceayApp.downloadDirectTrack('${escapeAttr(info.title)}','${escapeAttr(info.artist)}','${escapeAttr(thumb)}','${escapeAttr(mp4Url)}','MP4','video')">
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

    // Clean In-App Playlist Creation & Deletion (No browser prompt() issues!)
    openCreatePlaylistModal() {
      const inp = document.getElementById("new-playlist-name-input");
      if (inp) inp.value = "";
      document.getElementById("create-playlist-modal").classList.add("open");
      if (inp) setTimeout(() => inp.focus(), 80);
    },

    closeCreatePlaylistModal() {
      document.getElementById("create-playlist-modal").classList.remove("open");
    },

    confirmCreatePlaylist() {
      const inp = document.getElementById("new-playlist-name-input");
      const name = ((inp && inp.value) || "").trim() || "My Khmer Mix";
      if (isNative) {
        window.XeceayNative.createPlaylist(name);
        refreshFromNative();
      } else {
        state.playlists.push({
          id: "pl_" + Date.now(),
          name,
          isSmartPlaylist: false,
          isPinned: false,
          smartRule: "custom",
          songIds: []
        });
        renderAll();
      }
      this.closeCreatePlaylistModal();
      showToast("Playlist created: " + name);
    },

    openPlaylistDetails(plId) {
      const pl = state.playlists.find(p => p.id === plId);
      if (!pl) return;
      const songs = getSongsForPlaylist(pl);
      const totalMs = songs.reduce((acc, s) => acc + (s.duration || 180000), 0);

      document.getElementById("pl-modal-title").textContent = pl.name;
      document.getElementById("pl-modal-meta").textContent = `${songs.length} songs • Total Duration: ${formatDuration(totalMs)}`;

      document.getElementById("pl-modal-actions").innerHTML = `
        <button class="pill-btn white-pill" onclick="XeceayApp.playPlaylistAll('${escapeAttr(pl.id)}', false)">${SVG.play}<span>Play All</span></button>
        <button class="pill-btn" onclick="XeceayApp.playPlaylistAll('${escapeAttr(pl.id)}', true)">Shuffle</button>
        <button class="pill-btn" style="color:var(--error);border-color:rgba(239,68,68,0.35);" onclick="XeceayApp.deletePlaylistNow('${escapeAttr(pl.id)}')">${SVG.trash}<span>Delete Playlist</span></button>
      `;

      document.getElementById("pl-modal-songs").innerHTML = songs.length === 0
        ? `<div style="font-size:12px;color:#94A3B8;padding:8px 0;">No songs in this playlist yet.</div>`
        : songs.map((s, idx) => `
          <div class="song-row" style="background:#1C222E;" onclick="XeceayApp.playSongById('${escapeAttr(s.id)}')">
            <div class="track-num-col">${String(idx + 1).padStart(2, "0")}</div>
            <div class="song-info">
              <div class="song-name">${escapeHtml(s.title)}</div>
              <div class="song-meta">${escapeHtml(s.artist)} • ${formatDuration(s.duration || 180000)}</div>
            </div>
            <button class="icon-btn" style="color:var(--error);" title="Remove from Playlist" onclick="event.stopPropagation();XeceayApp.removeSongFromPl('${escapeAttr(pl.id)}','${escapeAttr(s.id)}')">${SVG.trash}</button>
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
      const pl = state.playlists.find(p => p.id === plId);
      const plName = pl ? pl.name : "Playlist";
      if (isNative) {
        window.XeceayNative.deletePlaylist(plId);
        state.playlists = state.playlists.filter(p => p.id !== plId);
        refreshFromNative();
      } else {
        state.playlists = state.playlists.filter(p => p.id !== plId);
        renderAll();
      }
      this.closePlaylistModal();
      showToast(`Removed playlist: ${plName}`);
    },

    removeSongFromPl(plId, songId) {
      if (isNative) {
        window.XeceayNative.removeSongFromPlaylist(plId, songId);
        refreshFromNative();
        this.openPlaylistDetails(plId);
      }
    },

    promptAddCurrentToPlaylist() {
      const listEl = document.getElementById("add-to-playlist-list");
      const customPls = state.playlists.filter(p => !p.isSmartPlaylist);
      if (customPls.length === 0) {
        this.openCreatePlaylistModal();
        return;
      }
      if (listEl) {
        listEl.innerHTML = customPls.map(pl => `
          <div class="song-row" style="background:#1C222E;" onclick="XeceayApp.addCurrentSongToPlaylistId('${escapeAttr(pl.id)}','${escapeAttr(pl.name)}')">
            <div class="stat-icon-box green">${SVG.musicNote}</div>
            <div class="song-info">
              <div class="song-name">${escapeHtml(pl.name)}</div>
              <div class="song-meta">Tap to add "${escapeHtml(state.player.title)}"</div>
            </div>
          </div>
        `).join("");
      }
      document.getElementById("add-to-playlist-modal").classList.add("open");
    },

    closeAddToPlaylistModal() {
      document.getElementById("add-to-playlist-modal").classList.remove("open");
    },

    addCurrentSongToPlaylistId(plId, plName) {
      const songId = state.player.songId || "seed_1";
      if (isNative) {
        window.XeceayNative.addSongToPlaylist(plId, songId);
        refreshFromNative();
      }
      this.closeAddToPlaylistModal();
      showToast(`Added to ${plName}`);
    },

    openTagEditor(songId) {
      const s = state.songs.find(x => x.id === songId);
      if (!s) return;
      document.getElementById("tag-song-id").value = s.id;
      document.getElementById("tag-title").value = s.title || "";
      document.getElementById("tag-artist").value = s.artist || "";
      document.getElementById("tag-album").value = s.album || "";
      document.getElementById("tag-genre").value = s.genre || "Khmer Music";
      document.getElementById("tag-modal").classList.add("open");
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

    deleteEditedSong() {
      const id = document.getElementById("tag-song-id").value;
      document.getElementById("tag-modal").classList.remove("open");
      if (id) this.deleteSongById(id);
    },

    deleteSongById(songId) {
      if (isNative) {
        window.XeceayNative.deleteSong(songId);
        refreshFromNative();
        showToast("Track removed from library");
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
        if (state.player.title === "Unstable" || state.player.title === "Insects") {
          state.player.artworkUri = FRAGMENTS_ART;
        }
        updatePlayerUiOnly();
        renderHomeSections();
        renderLibraryContent();
        if (p.event === "ended") handleTrackEnded();
      } else if (evt.eventType === "catalog_results") {
        state.isSearchingCatalog = false;
        const arr = p.results || [];
        if (p.requestType === "discovery") {
          if (arr.length > 0) {
            state.liveDiscovery = arr;
            renderHomeSections();
            renderDownloadsScreen();
          }
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
            showToast(`Downloaded Full Song: ${p.title}`);
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
      const topPill = document.getElementById("top-update-pill");
      const topText = document.getElementById("top-update-text");
      if (!box) return;

      if (p.type === "checking") {
        if (!this._silentUpdateCheck) {
          box.style.display = "block";
          box.innerHTML = `<div style="font-size:12px;color:var(--text-secondary);">Checking GitHub releases...</div>`;
        }
      } else if (p.type === "up_to_date") {
        if (topPill) topPill.style.display = "none";
        if (!this._silentUpdateCheck) {
          box.style.display = "block";
          box.innerHTML = `
            <div style="padding:10px 12px;border-radius:12px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);color:var(--success);font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;">
              ${SVG.check}
              <span>You are on the latest version (v${escapeHtml(p.installedVersion || "1.0.2")})</span>
            </div>
          `;
        } else {
          box.style.display = "none";
        }
      } else if (p.type === "release_info") {
        if (p.isNewer && p.apkDownloadUrl) {
          if (topPill) {
            topPill.style.display = "inline-flex";
            if (topText) topText.textContent = `Update ${p.tagName}`;
          }
          box.style.display = "block";
          box.innerHTML = `
            <div style="padding:12px;border-radius:14px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-weight:800;font-size:13px;color:var(--success);">New Version Available: ${escapeHtml(p.tagName)}</span>
                <span class="badge green">NEW</span>
              </div>
              <div style="font-size:11px;color:var(--text-secondary);margin-bottom:10px;">${escapeHtml(p.releaseName || "")}</div>
              <button class="pill-btn white-pill" onclick="XeceayApp.downloadReleaseApk('${escapeAttr(p.apkDownloadUrl)}')">
                ${SVG.download}
                <span>Download & Install ${escapeHtml(p.tagName)}</span>
              </button>
            </div>
          `;
        } else {
          if (topPill) topPill.style.display = "none";
          box.style.display = "none";
        }
      } else if (p.type === "download_progress") {
        box.style.display = "block";
        box.innerHTML = `
          <div style="font-size:12px;font-weight:700;margin-bottom:4px;">Downloading APK Update (${p.progress || 0}%)...</div>
          <div class="progress-track"><div class="progress-fill" style="width:${p.progress || 0}%;"></div></div>
        `;
      } else if (p.type === "download_complete") {
        box.style.display = "block";
        box.innerHTML = `
          <div style="font-size:12px;font-weight:700;color:var(--success);margin-bottom:8px;">APK Ready to Install</div>
          <button class="pill-btn white-pill" onclick="XeceayApp.installStagedApk()">Install Update Now</button>
        `;
      } else if (p.type === "error") {
        if (topPill) topPill.style.display = "none";
        if (!this._silentUpdateCheck) {
          box.style.display = "block";
          box.innerHTML = `<div style="font-size:12px;color:var(--text-secondary);">You are on the latest version (v${escapeHtml((state.versionInfo && state.versionInfo.versionName) || "1.0.2")}).</div>`;
        }
      }
    },

    renderLibrary() {
      renderLibraryContent();
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    refreshFromNative();
    // Pre-fetch Khmer & Global songs on startup
    setTimeout(() => {
      requestNativeOrWebSearch("VannDa Tena Suly Pheng", "discovery");
      requestNativeOrWebSearch("VannDa វណ្ណដា", "search");
      window.XeceayApp.checkGitHubReleaseNow(true);
    }, 550);
    setTimeout(() => {
      const splash = document.getElementById("splash-screen");
      if (splash) splash.classList.add("hidden");
    }, 900);
  });
})();
