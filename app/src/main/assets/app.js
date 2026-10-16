(function () {
  const isNative = typeof window.XeceayNative !== "undefined";

  const GENRES = [
    "All",
    "Khmer Music",
    "Electronic",
    "Lo-fi",
    "Pop",
    "Rock",
    "Hip-Hop",
    "R&B",
    "Jazz",
    "Classical",
    "Acoustic",
    "Instrumental",
    "International Music"
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

  // Curated Authorized Downloadable Catalog (Real HTTPS Public Domain / CC Audio Streams)
  const AUTHORIZED_CATALOG = [
    {
      id: "cat_dl_1",
      title: "Kalimba Sunset Groove (Authorized CC)",
      artist: "Kevin MacLeod • Free Music Archive",
      album: "Open Studio Sessions",
      genre: "Instrumental",
      duration: 132000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 2150400,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("KS", "#8B5CF6", "#22D3EE")
    },
    {
      id: "cat_dl_2",
      title: "Mekong Starlight Horizon",
      artist: "SoundHelix Electronic Ensemble",
      album: "Phnom Penh Nights",
      genre: "Khmer Music",
      duration: 185000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 3420000,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("MS", "#F59E0B", "#8B5CF6")
    },
    {
      id: "cat_dl_3",
      title: "Midnight Lo-Fi Study Session",
      artist: "Aurora Beats Collective",
      album: "Focus & Flow Vol. 4",
      genre: "Lo-fi",
      duration: 164000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 2980000,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("ML", "#22D3EE", "#3B82F6")
    },
    {
      id: "cat_dl_4",
      title: "Neon Drift Synthwave",
      artist: "Cyber Vector",
      album: "Outrun 2026",
      genre: "Electronic",
      duration: 198000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 3890000,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("ND", "#EC4899", "#8B5CF6")
    },
    {
      id: "cat_dl_5",
      title: "Acoustic Morning Dew",
      artist: "Sora Strings",
      album: "Unplugged Calm",
      genre: "Acoustic",
      duration: 152000,
      format: "MP3",
      quality: "320kbps",
      fileSize: 2640000,
      sourceReference: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
      downloadable: true,
      artworkUri: makeSvgUri("AM", "#10B981", "#22D3EE")
    }
  ];

  function makeSvgUri(initials, c1, c2) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="300" height="300" rx="32" fill="url(#g)"/><circle cx="150" cy="150" r="88" fill="#0B0D12" fill-opacity="0.4"/><text x="150" y="165" font-family="sans-serif" font-weight="800" font-size="48" fill="#F8FAFC" text-anchor="middle">${initials}</text></svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  const state = {
    activeTab: "home",
    selectedGenre: "All",
    searchFilter: "all",
    searchQuery: "",
    recentSearches: ["Khmer Music", "Midnight Horizon", "Lo-fi Study", "Classical Piano", "Electronic"],
    libraryTab: "all",
    downloadFilter: "all",
    songs: [],
    playlists: [],
    downloads: [],
    liveDiscovery: [],
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
      versionName: "1.0.0",
      versionCode: 100,
      canInstallPackages: true,
      hasDownloadedApk: false
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
      repeatMode: "all", // "off", "all", "one"
      eqPreset: "Normal",
      eqBands: [0, 0, 0, 0, 0],
      bassStrength: 150,
      sleepRemainingSec: 0,
      isDraggingSeek: false
    },
    queue: [],
    analyzedLink: null
  };

  // Fallback Web Audio Player when opened in desktop/web browser
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
    webAudio.addEventListener("ended", () => {
      handleTrackEnded();
    });
  }

  function showToast(msg) {
    const box = document.getElementById("toast-box");
    if (!box) return;
    box.textContent = msg;
    box.classList.add("show");
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.classList.remove("show"), 2700);
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

  function refreshFromNative() {
    if (!isNative) {
      // Seed fallback songs for web preview
      if (state.songs.length === 0) {
        state.songs = AUTHORIZED_CATALOG.map((item, idx) => ({
          ...item,
          id: "seed_" + (idx + 1),
          sourceType: "local",
          isFavorite: idx < 2,
          playCount: idx * 3 + 1,
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
      if (data.user) {
        state.user = data.user;
        const prefs = data.user.preferences || {};
        if (prefs.githubRepo) {
          const repoEl = document.getElementById("github-repo-input");
          if (repoEl) repoEl.value = prefs.githubRepo;
        }
      }
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
      if (state.queue.length === 0) {
        state.queue = state.songs.slice();
      }
      renderAll();
    } catch (e) {
      console.error("Bootstrap error:", e);
    }
  }

  function renderAll() {
    updateGreeting();
    renderGenreChips();
    renderHomeCarousels();
    renderSearchScreen();
    renderLibraryContent();
    renderDownloadsScreen();
    renderEqualizerModal();
    renderStorageCard();
    updateVersionBadge();
    updatePlayerUiOnly();
  }

  function updateGreeting() {
    const hr = new Date().getHours();
    const greet = hr < 12 ? "Good Morning" : hr < 18 ? "Good Afternoon" : "Good Evening";
    const el = document.getElementById("home-greeting");
    if (el) el.textContent = `${greet}, ${state.user.displayName || "Audiophile"}`;
    const netBadge = document.getElementById("network-status-badge");
    if (netBadge) {
      const online = navigator.onLine !== false;
      netBadge.textContent = online ? "ONLINE + OFFLINE READY" : "OFFLINE MODE ACTIVE";
      netBadge.className = online ? "badge green" : "badge cyan";
    }
  }

  function renderGenreChips() {
    const row = document.getElementById("home-genre-chips");
    if (!row) return;
    row.innerHTML = GENRES.map(g => {
      const active = state.selectedGenre === g ? "active" : "";
      return `<div class="chip ${active}" onclick="XeceayApp.selectGenre('${g.replace(/'/g, "\\'")}')">${g}</div>`;
    }).join("");
  }

  function renderHomeCarousels() {
    // 1. Offline & Local Tracks
    const offlineEl = document.getElementById("home-offline-carousel");
    if (offlineEl) {
      const filtered = state.songs.filter(s =>
        state.selectedGenre === "All" ||
        (s.genre && s.genre.toLowerCase() === state.selectedGenre.toLowerCase())
      );
      const list = filtered.length > 0 ? filtered : state.songs;
      offlineEl.innerHTML = list.map(song => `
        <div class="media-card" onclick="XeceayApp.playSongById('${song.id}')">
          <div class="media-art-wrap">
            <img src="${song.artworkUri || makeSvgUri(song.title.slice(0,2), '#8B5CF6', '#22D3EE')}" alt="" />
            <div class="play-fab-overlay">${state.player.songId === song.id && state.player.isPlaying ? "⏸" : "▶"}</div>
          </div>
          <div class="media-title">${escapeHtml(song.title)}</div>
          <div class="media-sub">${escapeHtml(song.artist)} • ${song.format || "WAV"}</div>
        </div>
      `).join("");
    }

    // 2. Authorized Downloadable Catalog
    const dlListEl = document.getElementById("home-downloadable-list");
    if (dlListEl) {
      const filteredCat = AUTHORIZED_CATALOG.filter(c =>
        state.selectedGenre === "All" || c.genre.toLowerCase() === state.selectedGenre.toLowerCase()
      );
      const catList = filteredCat.length > 0 ? filteredCat : AUTHORIZED_CATALOG;
      dlListEl.innerHTML = catList.map(item => `
        <div class="song-row" onclick="XeceayApp.playAuthorizedCatalogItem('${item.id}')">
          <img class="song-thumb" src="${item.artworkUri}" alt="" />
          <div class="song-info">
            <div class="song-name">${escapeHtml(item.title)}</div>
            <div class="song-meta">
              <span>${escapeHtml(item.artist)}</span>
              <span class="badge cyan">${item.format} ${item.quality}</span>
              <span class="badge green">AUTHORIZED DOWNLOAD</span>
            </div>
          </div>
          <div class="song-actions" onclick="event.stopPropagation()">
            <button class="pill-btn accent" onclick="XeceayApp.downloadCatalogItem('${item.id}')">⬇ Download</button>
          </div>
        </div>
      `).join("");
    }

    // 3. Trending Global Discovery
    const trendEl = document.getElementById("home-trending-carousel");
    if (trendEl) {
      const items = state.liveDiscovery.length > 0 ? state.liveDiscovery : AUTHORIZED_CATALOG;
      trendEl.innerHTML = items.map((item, idx) => `
        <div class="media-card" onclick="XeceayApp.playDiscoveryItem(${idx})">
          <div class="media-art-wrap">
            <img src="${item.artworkUri}" alt="" />
            <div class="play-fab-overlay">▶</div>
          </div>
          <div class="media-title">${escapeHtml(item.title)}</div>
          <div class="media-sub">${escapeHtml(item.artist)}</div>
        </div>
      `).join("");
    }

    // 4. Smart & Personalized Playlists
    const plEl = document.getElementById("home-playlists-carousel");
    if (plEl) {
      plEl.innerHTML = state.playlists.map(pl => {
        const count = getSongsForPlaylist(pl).length;
        const art = makeSvgUri(pl.name.slice(0, 2).toUpperCase(), pl.isSmartPlaylist ? "#22D3EE" : "#8B5CF6", "#1E293B");
        return `
          <div class="media-card" onclick="XeceayApp.openPlaylistDetails('${pl.id}')">
            <div class="media-art-wrap">
              <img src="${art}" alt="" />
              <div class="play-fab-overlay">${pl.isPinned ? "📌" : "♫"}</div>
            </div>
            <div class="media-title">${escapeHtml(pl.name)}</div>
            <div class="media-sub">${pl.isSmartPlaylist ? "Smart • " : ""}${count} songs</div>
          </div>
        `;
      }).join("");
    }
  }

  function getSongsForPlaylist(pl) {
    if (!pl) return [];
    if (pl.smartRule === "favorites") return state.songs.filter(s => s.isFavorite);
    if (pl.smartRule === "recent_added") return state.songs.slice(0, 10);
    if (pl.smartRule === "recent_played") return state.songs.filter(s => s.lastPlayedAt > 0).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    if (pl.smartRule === "most_played") return state.songs.slice().sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    if (pl.smartRule === "focus") return state.songs.filter(s => ["Lo-fi", "Classical", "Instrumental", "Khmer Music"].includes(s.genre));
    const ids = pl.songIds || [];
    return ids.map(id => state.songs.find(s => s.id === id)).filter(Boolean);
  }

  function renderSearchScreen() {
    const recRow = document.getElementById("recent-searches-row");
    if (recRow) {
      recRow.innerHTML = state.recentSearches.map(term =>
        `<div class="chip" onclick="XeceayApp.quickSearch('${escapeHtml(term)}')">🕒 ${escapeHtml(term)}</div>`
      ).join("");
    }

    const q = (state.searchQuery || "").trim().toLowerCase();
    const container = document.getElementById("search-results-container");
    if (!container) return;

    // Combine local songs + authorized downloadable catalog + live iTunes discovery
    const combinedSongs = [
      ...state.songs.map(s => ({ ...s, isLocal: true })),
      ...AUTHORIZED_CATALOG.map(c => ({ ...c, isLocal: false, isAuthorizedDownload: true })),
      ...state.liveDiscovery.map(d => ({ ...d, isLocal: false }))
    ];

    const matchedSongs = combinedSongs.filter(s => {
      if (state.searchFilter === "local" && !s.isLocal) return false;
      if (state.searchFilter === "downloadable" && !s.isAuthorizedDownload) return false;
      if (!q) return true;
      return (
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.artist && s.artist.toLowerCase().includes(q)) ||
        (s.album && s.album.toLowerCase().includes(q)) ||
        (s.genre && s.genre.toLowerCase().includes(q))
      );
    });

    if (state.searchFilter === "playlists") {
      const matchedPl = state.playlists.filter(p => !q || p.name.toLowerCase().includes(q));
      container.innerHTML = matchedPl.map(pl => `
        <div class="song-row" onclick="XeceayApp.openPlaylistDetails('${pl.id}')">
          <div class="quick-icon">🎶</div>
          <div class="song-info">
            <div class="song-name">${escapeHtml(pl.name)}</div>
            <div class="song-meta">${getSongsForPlaylist(pl).length} tracks • ${pl.isSmartPlaylist ? "Smart Playlist" : "Custom Playlist"}</div>
          </div>
          <span class="badge cyan">Open</span>
        </div>
      `).join("");
      return;
    }

    container.innerHTML = matchedSongs.map(s => {
      const isDl = Boolean(s.isAuthorizedDownload);
      return `
        <div class="song-row ${state.player.songId === s.id ? 'playing' : ''}" onclick="${s.isLocal ? `XeceayApp.playSongById('${s.id}')` : isDl ? `XeceayApp.playAuthorizedCatalogItem('${s.id}')` : `XeceayApp.playExternalPreview('${escapeAttr(s.title)}','${escapeAttr(s.artist)}','${escapeAttr(s.artworkUri)}','${escapeAttr(s.sourceReference)}')`}">
          <img class="song-thumb" src="${s.artworkUri || makeSvgUri('XC', '#8B5CF6', '#22D3EE')}" alt="" />
          <div class="song-info">
            <div class="song-name">${escapeHtml(s.title)}</div>
            <div class="song-meta">
              <span>${escapeHtml(s.artist)}</span>
              <span>• ${formatDuration(s.duration)}</span>
              <span class="badge ${s.isLocal ? 'green' : 'cyan'}">${s.isLocal ? "OFFLINE LOCAL" : isDl ? "DOWNLOADABLE" : "PREVIEW STREAM"}</span>
            </div>
          </div>
          <div class="song-actions" onclick="event.stopPropagation()">
            ${isDl ? `<button class="pill-btn accent" onclick="XeceayApp.downloadCatalogItem('${s.id}')">⬇</button>` : ""}
            ${s.isLocal ? `<button class="icon-btn ${s.isFavorite ? 'fav-active' : ''}" onclick="XeceayApp.toggleFav('${s.id}')">${s.isFavorite ? "♥" : "♡"}</button>` : ""}
          </div>
        </div>
      `;
    }).join("");
  }

  function renderLibraryContent() {
    const area = document.getElementById("library-content-area");
    if (!area) return;
    const filterQ = ((document.getElementById("library-filter-input") || {}).value || "").trim().toLowerCase();

    if (state.libraryTab === "playlists") {
      area.innerHTML = state.playlists.map(pl => {
        const tracks = getSongsForPlaylist(pl);
        return `
          <div class="song-row" onclick="XeceayApp.openPlaylistDetails('${pl.id}')">
            <div class="quick-icon">${pl.isSmartPlaylist ? "✨" : "🎵"}</div>
            <div class="song-info">
              <div class="song-name">${escapeHtml(pl.name)} ${pl.isPinned ? "📌" : ""}</div>
              <div class="song-meta">${tracks.length} songs • ${pl.isSmartPlaylist ? "Auto-Updating Smart Playlist" : "Personal Offline Playlist"}</div>
            </div>
            <button class="icon-btn" onclick="event.stopPropagation();XeceayApp.togglePinPlaylist('${pl.id}')">📌</button>
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
        <div class="song-row" onclick="XeceayApp.playSongById('${alb.songs[0].id}')">
          <img class="song-thumb" src="${alb.artworkUri}" alt="" />
          <div class="song-info">
            <div class="song-name">${escapeHtml(alb.album)}</div>
            <div class="song-meta">${escapeHtml(alb.artist)} • ${alb.songs.length} tracks offline</div>
          </div>
          <span class="badge green">▶ Play Album</span>
        </div>
      `).join("");
      return;
    }

    if (state.libraryTab === "duplicates") {
      const dups = (state.storage && state.storage.duplicates) || [];
      if (dups.length === 0) {
        area.innerHTML = `
          <div class="song-row" style="cursor:default;">
            <div class="quick-icon">✅</div>
            <div class="song-info">
              <div class="song-name">No Duplicate Audio Files Detected</div>
              <div class="song-meta">All ${state.songs.length} tracks in your offline library have unique signatures.</div>
            </div>
          </div>
        `;
      } else {
        area.innerHTML = dups.map(d => `
          <div class="song-row">
            <div class="quick-icon">⚠️</div>
            <div class="song-info">
              <div class="song-name">${escapeHtml(d.title)}</div>
              <div class="song-meta">${escapeHtml(d.artist)} • ${formatBytes(d.fileSize)} (${d.format})</div>
            </div>
            <button class="pill-btn" style="color:var(--error);" onclick="XeceayApp.deleteSongById('${d.id}')">🗑 Remove Duplicate</button>
          </div>
        `).join("");
      }
      return;
    }

    let list = state.songs.slice();
    if (state.libraryTab === "downloaded") list = list.filter(s => s.sourceType === "downloaded");
    if (state.libraryTab === "favorites") list = list.filter(s => s.isFavorite);
    if (state.libraryTab === "recent") list = list.filter(s => s.lastPlayedAt > 0).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    if (state.libraryTab === "most") list = list.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));

    if (filterQ) {
      list = list.filter(s =>
        (s.title && s.title.toLowerCase().includes(filterQ)) ||
        (s.artist && s.artist.toLowerCase().includes(filterQ)) ||
        (s.album && s.album.toLowerCase().includes(filterQ)) ||
        (s.format && s.format.toLowerCase().includes(filterQ))
      );
    }

    if (list.length === 0) {
      area.innerHTML = `
        <div class="song-row" style="cursor:default;">
          <div class="quick-icon">📂</div>
          <div class="song-info">
            <div class="song-name">No Matching Tracks in This View</div>
            <div class="song-meta">Tap "Scan Device", "Import File", or download songs from the Catalog.</div>
          </div>
        </div>
      `;
      return;
    }

    area.innerHTML = list.map(song => `
      <div class="song-row ${state.player.songId === song.id ? 'playing' : ''}" onclick="XeceayApp.playSongById('${song.id}')">
        <img class="song-thumb" src="${song.artworkUri}" alt="" />
        <div class="song-info">
          <div class="song-name">${escapeHtml(song.title)}</div>
          <div class="song-meta">
            <span>${escapeHtml(song.artist)}</span>
            <span>• ${formatDuration(song.duration)}</span>
            <span class="badge">${song.format || "WAV"}</span>
            <span class="badge green">${formatBytes(song.fileSize)}</span>
            ${song.playCount > 0 ? `<span>• ${song.playCount} plays</span>` : ""}
          </div>
        </div>
        <div class="song-actions" onclick="event.stopPropagation()">
          <button class="icon-btn ${song.isFavorite ? 'fav-active' : ''}" onclick="XeceayApp.toggleFav('${song.id}')">${song.isFavorite ? "♥" : "♡"}</button>
          <button class="icon-btn" onclick="XeceayApp.openTagEditor('${song.id}')" title="Edit Tags">🏷️</button>
          <button class="icon-btn" onclick="XeceayApp.deleteSongById('${song.id}')" title="Delete">🗑</button>
        </div>
      </div>
    `).join("");
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
            <div class="quick-icon">⬇️</div>
            <div class="song-info">
              <div class="song-name">No Downloads in This Filter</div>
              <div class="song-meta">Tap any track below to start a multi-threaded background download with Pause/Resume.</div>
            </div>
          </div>
        `;
      } else {
        qEl.innerHTML = list.map(d => {
          const speedText = d.speedBps > 0 ? `${formatBytes(d.speedBps)}/s` : "";
          const remainingBytes = Math.max(0, (d.fileSize || 0) - (d.downloadedBytes || 0));
          const etaSec = d.speedBps > 0 && remainingBytes > 0 ? Math.ceil(remainingBytes / d.speedBps) + "s left" : "";
          const badgeCls = d.status === "Completed" ? "green" : d.status === "Failed" || d.status === "Cancelled" ? "red" : "cyan";
          return `
            <div class="song-row" style="flex-direction:column;align-items:stretch;cursor:default;">
              <div style="display:flex;align-items:center;gap:12px;">
                <img class="song-thumb" src="${d.artworkUri || makeSvgUri('DL', '#8B5CF6', '#22D3EE')}" alt="" />
                <div class="song-info">
                  <div class="song-name">${escapeHtml(d.title)}</div>
                  <div class="song-meta">
                    <span>${escapeHtml(d.artist)}</span>
                    <span class="badge ${badgeCls}">${d.status} (${d.progress || 0}%)</span>
                    <span class="badge">${d.format || "MP3"} • ${d.quality || "320kbps"}</span>
                    <span>${formatBytes(d.downloadedBytes)} / ${d.fileSize > 0 ? formatBytes(d.fileSize) : "Stream"}</span>
                    ${speedText ? `<span>• ⚡ ${speedText}</span>` : ""}
                    ${etaSec ? `<span>• ⏱ ${etaSec}</span>` : ""}
                  </div>
                </div>
                <div class="song-actions">
                  ${d.status === "Downloading" || d.status === "Waiting" ? `<button class="icon-btn" onclick="XeceayApp.pauseDl('${d.id}')" title="Pause">⏸</button>` : ""}
                  ${d.status === "Paused" ? `<button class="icon-btn" onclick="XeceayApp.resumeDl('${d.id}')" title="Resume">▶</button>` : ""}
                  ${d.status === "Failed" || d.status === "Cancelled" ? `<button class="icon-btn" onclick="XeceayApp.retryDl('${d.id}')" title="Retry">↻</button>` : ""}
                  ${d.status === "Completed" && d.songId ? `<button class="pill-btn accent" onclick="XeceayApp.playSongById('${d.songId}')">▶ Play</button>` : ""}
                  ${d.status !== "Completed" && d.status !== "Cancelled" ? `<button class="icon-btn" onclick="XeceayApp.cancelDl('${d.id}')" title="Cancel">✕</button>` : ""}
                  <button class="icon-btn" onclick="XeceayApp.deleteDl('${d.id}')" title="Delete">🗑</button>
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
      catEl.innerHTML = AUTHORIZED_CATALOG.map(item => `
        <div class="song-row">
          <img class="song-thumb" src="${item.artworkUri}" alt="" />
          <div class="song-info">
            <div class="song-name">${escapeHtml(item.title)}</div>
            <div class="song-meta">
              <span>${escapeHtml(item.artist)}</span>
              <span class="badge cyan">${item.format} • ${formatBytes(item.fileSize)}</span>
            </div>
          </div>
          <button class="pill-btn accent" onclick="XeceayApp.downloadCatalogItem('${item.id}')">⬇ Queue Download</button>
        </div>
      `).join("");
    }
  }

  function renderEqualizerModal() {
    const presetRow = document.getElementById("eq-presets-row");
    if (presetRow) {
      presetRow.innerHTML = Object.keys(EQ_PRESETS).map(name => `
        <div class="chip ${state.player.eqPreset === name ? 'active' : ''}" onclick="XeceayApp.selectEqPreset('${name}')">${name}</div>
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
            <span style="font-size:11px;color:var(--text-secondary);">${freq}</span>
          </div>
        `;
      }).join("");
    }
    const homeEq = document.getElementById("home-eq-label");
    if (homeEq) homeEq.textContent = "Preset: " + state.player.eqPreset;
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
        <span style="font-weight:700;font-size:14px;">Device & XECEAY Music Storage</span>
        <span class="badge cyan">${formatBytes(st.availableDeviceBytes)} Free</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;font-size:11px;color:var(--text-secondary);">
        <div>🎵 Offline Audio: <strong style="color:var(--text-primary);">${formatBytes(st.audioBytes)}</strong></div>
        <div>🎬 Offline Video: <strong style="color:var(--text-primary);">${formatBytes(st.videoBytes)}</strong></div>
        <div>📚 Library Tracks: <strong style="color:var(--text-primary);">${st.songCount || state.songs.length}</strong></div>
      </div>
    `;
  }

  function updateVersionBadge() {
    const b = document.getElementById("installed-version-badge");
    if (b && state.versionInfo) {
      b.textContent = `v${state.versionInfo.versionName || "1.0.0"} (Build ${state.versionInfo.versionCode || 100})`;
    }
  }

  function updatePlayerUiOnly() {
    const p = state.player;
    const pct = p.durationMs > 0 ? Math.min(100, (p.positionMs * 100) / p.durationMs) : 0;

    // Mini Player
    const mTitle = document.getElementById("mini-title");
    const mArtist = document.getElementById("mini-artist");
    const mArt = document.getElementById("mini-art");
    const mPlay = document.getElementById("mini-play-btn");
    const mFill = document.getElementById("mini-progress-fill");
    if (mTitle) mTitle.textContent = p.title || "Select a Song";
    if (mArtist) mArtist.textContent = p.artist || "XECEAY";
    if (mArt && p.artworkUri) mArt.src = p.artworkUri;
    if (mPlay) mPlay.textContent = p.isPlaying ? "⏸" : "▶";
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
    if (fpAlbum) fpAlbum.textContent = p.album || "XECEAY Hi-Res Engine";
    if (fpArt && p.artworkUri) fpArt.src = p.artworkUri;
    if (fpPlay) fpPlay.textContent = p.isPlaying ? "⏸" : "▶";
    if (fpCur) fpCur.textContent = formatDuration(p.positionMs);
    if (fpTot) fpTot.textContent = formatDuration(p.durationMs);
    if (fpSeek && !p.isDraggingSeek) {
      fpSeek.value = p.durationMs > 0 ? Math.floor((p.positionMs * 1000) / p.durationMs) : 0;
    }
    if (fpSpeed) fpSpeed.textContent = `⚡ ${Number(p.speed || 1).toFixed(2).replace(/\.00$/, ".0")}x`;
    if (fpSleep) {
      fpSleep.textContent = p.sleepRemainingSec > 0
        ? `🌙 ${Math.ceil(p.sleepRemainingSec / 60)}m left`
        : "🌙 Sleep: Off";
    }
    const currentSongObj = state.songs.find(s => s.id === p.songId);
    if (fpFav) {
      const fav = currentSongObj && currentSongObj.isFavorite;
      fpFav.textContent = fav ? "♥" : "♡";
      fpFav.className = fav ? "icon-btn fav-active" : "icon-btn";
    }
  }

  function playSongObject(song) {
    if (!song) return;
    state.player.songId = song.id;
    state.player.title = song.title;
    state.player.artist = song.artist;
    state.player.album = song.album || "XECEAY Library";
    state.player.artworkUri = song.artworkUri || makeSvgUri(song.title.slice(0, 2), "#8B5CF6", "#22D3EE");
    state.player.durationMs = song.duration || 180000;
    state.player.format = song.format || "WAV";

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
  }

  function renderPlayerQueue() {
    const qList = document.getElementById("fp-queue-list");
    if (!qList) return;
    const queue = state.songs.slice(0, 12);
    qList.innerHTML = queue.map(s => `
      <div class="song-row ${state.player.songId === s.id ? 'playing' : ''}" onclick="XeceayApp.playSongById('${s.id}')">
        <img class="song-thumb" src="${s.artworkUri}" alt="" style="width:38px;height:38px;" />
        <div class="song-info">
          <div class="song-name">${escapeHtml(s.title)}</div>
          <div class="song-meta">${escapeHtml(s.artist)} • ${formatDuration(s.duration)}</div>
        </div>
        <span class="badge">${state.player.songId === s.id ? "PLAYING" : "UP NEXT"}</span>
      </div>
    `).join("");
  }

  function handleTrackEnded() {
    if (state.player.repeatMode === "one") {
      const current = state.songs.find(s => s.id === state.player.songId);
      if (current) playSongObject(current);
      return;
    }
    window.XeceayApp.nextTrack();
  }

  function fetchLiveItunesCatalog(term) {
    const query = encodeURIComponent(term || "electronic synth");
    fetch(`https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=10`)
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          state.liveDiscovery = data.results.filter(r => r.previewUrl).map(r => ({
            id: "itunes_" + r.trackId,
            title: r.trackName || "Track",
            artist: r.artistName || "Artist",
            album: r.collectionName || "Single",
            genre: r.primaryGenreName || "Pop",
            duration: r.trackTimeMillis || 30000,
            format: "M4A",
            artworkUri: (r.artworkUrl100 || "").replace("100x100bb", "300x300bb"),
            sourceReference: r.previewUrl
          }));
          renderHomeCarousels();
          if (state.activeTab === "search") renderSearchScreen();
        }
      })
      .catch(() => {});
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return String(str || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
  }

  // Public API exposed to HTML handlers and Native Kotlin Bridge
  window.XeceayApp = {
    switchTab(tab) {
      state.activeTab = tab;
      ["home", "search", "library", "downloads", "link", "settings"].forEach(t => {
        const sec = document.getElementById("screen-" + t);
        if (sec) sec.classList.toggle("active", t === tab);
        const nav = document.getElementById("nav-" + t);
        if (nav) nav.classList.toggle("active", t === tab);
      });
      if (tab === "settings") {
        this.refreshStorageCard();
      }
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
      renderHomeCarousels();
      if (genre !== "All") {
        fetchLiveItunesCatalog(genre);
      }
    },

    refreshLiveDiscovery() {
      showToast("Refreshing global music discovery catalog...");
      fetchLiveItunesCatalog(state.selectedGenre === "All" ? "top hits 2026" : state.selectedGenre);
    },

    playSongById(songId) {
      const song = state.songs.find(s => s.id === songId);
      if (song) {
        playSongObject(song);
      }
    },

    playAuthorizedCatalogItem(catId) {
      const item = AUTHORIZED_CATALOG.find(c => c.id === catId);
      if (item) {
        playSongObject(item);
        showToast("Streaming " + item.title);
      }
    },

    playDiscoveryItem(idx) {
      const list = state.liveDiscovery.length > 0 ? state.liveDiscovery : AUTHORIZED_CATALOG;
      const item = list[idx];
      if (item) {
        playSongObject(item);
        showToast("Playing " + item.title);
      }
    },

    playExternalPreview(title, artist, artworkUri, sourceUrl) {
      playSongObject({
        id: "ext_" + Date.now(),
        title,
        artist,
        album: "Catalog Preview",
        artworkUri,
        duration: 30000,
        format: "M4A",
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
        const rnd = state.songs[Math.floor(Math.random() * state.songs.length)];
        playSongObject(rnd);
        return;
      }
      const idx = state.songs.findIndex(s => s.id === state.player.songId);
      const nextIdx = (idx + 1) % state.songs.length;
      playSongObject(state.songs[nextIdx]);
    },

    prevTrack() {
      if (state.songs.length === 0) return;
      const idx = state.songs.findIndex(s => s.id === state.player.songId);
      const prevIdx = (idx - 1 + state.songs.length) % state.songs.length;
      playSongObject(state.songs[prevIdx]);
    },

    onSeekSliderInput(val) {
      state.player.isDraggingSeek = true;
      const targetMs = Math.floor((Number(val) / 1000) * (state.player.durationMs || 1));
      const curEl = document.getElementById("fp-current-time");
      if (curEl) curEl.textContent = formatDuration(targetMs);
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

    setVolume(vol) {
      state.player.volume = vol;
      if (isNative) {
        window.XeceayNative.setVolume(vol);
      } else if (webAudio) {
        webAudio.volume = vol;
      }
    },

    toggleShuffle() {
      state.player.shuffle = !state.player.shuffle;
      const btn = document.getElementById("fp-shuffle-btn");
      if (btn) btn.classList.toggle("fav-active", state.player.shuffle);
      showToast(state.player.shuffle ? "Shuffle Enabled" : "Shuffle Off");
    },

    cycleRepeatMode() {
      const modes = ["all", "one", "off"];
      const next = modes[(modes.indexOf(state.player.repeatMode) + 1) % modes.length];
      state.player.repeatMode = next;
      const btn = document.getElementById("fp-repeat-btn");
      if (btn) btn.textContent = next === "one" ? "🔂" : "🔁";
      showToast("Repeat Mode: " + next.toUpperCase());
    },

    cyclePlaybackSpeed() {
      const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
      const curIdx = speeds.findIndex(s => Math.abs(s - (state.player.speed || 1.0)) < 0.05);
      const nextSpeed = speeds[(curIdx + 1) % speeds.length];
      state.player.speed = nextSpeed;
      if (isNative) {
        window.XeceayNative.setSpeed(nextSpeed);
      } else if (webAudio) {
        webAudio.playbackRate = nextSpeed;
      }
      updatePlayerUiOnly();
      showToast(`Playback Speed: ${nextSpeed}x`);
    },

    cycleSleepTimer() {
      const mins = [0, 15, 30, 60];
      const curMin = state.player.sleepRemainingSec > 0 ? Math.round(state.player.sleepRemainingSec / 60) : 0;
      const nextMin = curMin === 0 ? 15 : curMin <= 15 ? 30 : curMin <= 30 ? 60 : 0;
      if (isNative) {
        window.XeceayNative.setSleepTimer(nextMin);
      } else {
        state.player.sleepRemainingSec = nextMin * 60;
      }
      updatePlayerUiOnly();
      showToast(nextMin > 0 ? `Sleep Timer set for ${nextMin} minutes` : "Sleep Timer Off");
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
        window.XeceayNative.setEqualizer(
          presetName,
          JSON.stringify(state.player.eqBands),
          state.player.bassStrength
        );
      }
      renderEqualizerModal();
      showToast("Equalizer Preset: " + presetName);
    },

    onEqBandSlider(bandIdx, dbVal) {
      state.player.eqPreset = "Custom";
      state.player.eqBands[bandIdx] = Number(dbVal);
      if (isNative) {
        window.XeceayNative.setEqualizer(
          "Custom",
          JSON.stringify(state.player.eqBands),
          state.player.bassStrength
        );
      }
      renderEqualizerModal();
    },

    onBassSliderChange(val) {
      state.player.bassStrength = Number(val);
      const label = document.getElementById("eq-bass-val");
      if (label) label.textContent = Math.round(val / 10) + "%";
      if (isNative) {
        window.XeceayNative.setEqualizer(
          state.player.eqPreset,
          JSON.stringify(state.player.eqBands),
          state.player.bassStrength
        );
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
      if (state.player.songId) {
        this.toggleFav(state.player.songId);
      }
    },

    onSearchInput(val) {
      state.searchQuery = val;
      renderSearchScreen();
      if (val.trim().length >= 3) {
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
          fetchLiveItunesCatalog(val.trim());
        }, 450);
      }
    },

    clearSearch() {
      state.searchQuery = "";
      const input = document.getElementById("search-input");
      if (input) input.value = "";
      renderSearchScreen();
    },

    quickSearch(term) {
      state.searchQuery = term;
      const input = document.getElementById("search-input");
      if (input) input.value = term;
      if (!state.recentSearches.includes(term)) {
        state.recentSearches.unshift(term);
      }
      renderSearchScreen();
      fetchLiveItunesCatalog(term);
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

    downloadCatalogItem(catId) {
      const item = AUTHORIZED_CATALOG.find(c => c.id === catId);
      if (!item) return;
      if (isNative) {
        const res = JSON.parse(
          window.XeceayNative.enqueueDownload(
            item.title,
            item.artist,
            item.album,
            item.genre,
            item.artworkUri,
            item.sourceReference,
            item.format,
            item.quality,
            "audio"
          )
        );
        if (res.ok) {
          showToast("Added to Download Queue: " + item.title);
          this.switchTab("downloads");
        } else {
          showToast(res.error || "Download notice");
        }
      } else {
        showToast("Downloading " + item.title);
      }
    },

    pauseDl(id) {
      if (isNative) window.XeceayNative.pauseDownload(id);
    },
    resumeDl(id) {
      if (isNative) window.XeceayNative.resumeDownload(id);
    },
    cancelDl(id) {
      if (isNative) window.XeceayNative.cancelDownload(id);
    },
    retryDl(id) {
      if (isNative) window.XeceayNative.retryDownload(id);
    },
    deleteDl(id) {
      if (isNative) window.XeceayNative.deleteDownload(id, true);
      state.downloads = state.downloads.filter(d => d.id !== id);
      renderDownloadsScreen();
    },

    scanDeviceMusic() {
      if (isNative) {
        const count = window.XeceayNative.scanLocalMusic();
        refreshFromNative();
        showToast(`Scanned device storage (${count} new audio files imported)`);
      } else {
        showToast("Local library synced");
      }
    },

    importLocalFile() {
      if (isNative) {
        window.XeceayNative.openLocalFilePicker();
      } else {
        showToast("Use Android device picker to import local audio/video");
      }
    },

    promptCreatePlaylist() {
      const name = prompt("Enter new playlist name:", "My XECEAY Mix");
      if (name && name.trim()) {
        if (isNative) {
          window.XeceayNative.createPlaylist(name.trim());
          refreshFromNative();
        } else {
          state.playlists.push({
            id: "pl_" + Date.now(),
            name: name.trim(),
            isSmartPlaylist: false,
            isPinned: false,
            smartRule: "custom",
            songIds: []
          });
          renderAll();
        }
        showToast("Playlist created: " + name.trim());
      }
    },

    togglePinPlaylist(plId) {
      if (isNative) {
        window.XeceayNative.togglePinPlaylist(plId);
        refreshFromNative();
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
        <button class="pill-btn accent" onclick="XeceayApp.playPlaylistAll('${pl.id}', false)">▶ Play All</button>
        <button class="pill-btn cyan" onclick="XeceayApp.playPlaylistAll('${pl.id}', true)">🔀 Shuffle</button>
        ${!pl.isSmartPlaylist ? `<button class="pill-btn" onclick="XeceayApp.renamePlaylistPrompt('${pl.id}')">✏️ Rename</button>` : ""}
        ${!pl.isSmartPlaylist ? `<button class="pill-btn" style="color:var(--error);" onclick="XeceayApp.deletePlaylistNow('${pl.id}')">🗑 Delete</button>` : ""}
      `;

      document.getElementById("pl-modal-songs").innerHTML = songs.length === 0
        ? `<div style="font-size:12px;color:var(--text-secondary);">No songs in this playlist yet.</div>`
        : songs.map(s => `
          <div class="song-row" onclick="XeceayApp.playSongById('${s.id}')">
            <img class="song-thumb" src="${s.artworkUri}" alt="" style="width:40px;height:40px;" />
            <div class="song-info">
              <div class="song-name">${escapeHtml(s.title)}</div>
              <div class="song-meta">${escapeHtml(s.artist)} • ${formatDuration(s.duration)}</div>
            </div>
            ${!pl.isSmartPlaylist ? `<button class="icon-btn" onclick="event.stopPropagation();XeceayApp.removeSongFromPl('${pl.id}','${s.id}')">✕</button>` : ""}
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
      if (songs.length === 0) {
        showToast("Playlist is empty");
        return;
      }
      state.player.shuffle = Boolean(shuffle);
      const first = shuffle ? songs[Math.floor(Math.random() * songs.length)] : songs[0];
      playSongObject(first);
      this.closePlaylistModal();
    },

    renamePlaylistPrompt(plId) {
      const pl = state.playlists.find(p => p.id === plId);
      const name = prompt("Rename playlist:", pl ? pl.name : "");
      if (name && name.trim() && isNative) {
        window.XeceayNative.renamePlaylist(plId, name.trim());
        refreshFromNative();
        this.openPlaylistDetails(plId);
      }
    },

    deletePlaylistNow(plId) {
      if (isNative) {
        window.XeceayNative.deletePlaylist(plId);
        refreshFromNative();
        this.closePlaylistModal();
        showToast("Playlist deleted");
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
      const pick = prompt(`Add current song to playlist (enter number):\n${names}`, "1");
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
        showToast("Track deleted from library");
      }
    },

    // Screen 7: Link Downloader & YouTube / Direct Media Analyzer
    fillSampleLink(type) {
      const input = document.getElementById("link-importer-input");
      if (!input) return;
      if (type === "mp3") {
        input.value = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3";
      } else {
        input.value = "https://www.youtube.com/watch?v=jfKfPfyJRdk";
      }
      this.analyzeLinkInput();
    },

    analyzeLinkInput() {
      const url = (document.getElementById("link-importer-input").value || "").trim();
      if (!url) {
        showToast("Please paste a valid https:// media or YouTube URL first");
        return;
      }
      const box = document.getElementById("link-analysis-result");
      if (box) {
        box.innerHTML = `<div class="song-row"><div class="quick-icon">⏳</div><div class="song-info"><div class="song-name">Analyzing media link...</div><div class="song-meta">${escapeHtml(url)}</div></div></div>`;
      }
      if (isNative) {
        window.XeceayNative.analyzeLink(url);
      } else {
        const isYt = url.includes("youtube.com") || url.includes("youtu.be");
        this.renderLinkAnalysisCard({
          ok: true,
          sourceType: isYt ? "youtube" : "direct",
          url,
          title: isYt ? "YouTube Authorized Stream" : "Direct HTTPS Audio Track",
          artist: isYt ? "YouTube Creator" : "Authorized Host",
          mediaType: isYt ? "video" : "audio",
          format: isYt ? "YOUTUBE" : "MP3",
          fileSize: isYt ? 0 : 3520000,
          sourceWebsite: isYt ? "YouTube" : "HTTPS Media Server",
          directDownloadPermitted: !isYt,
          policyNotice: isYt
            ? "YouTube URLs are recognized via official oEmbed metadata. XECEAY respects YouTube DRM & Terms of Service."
            : "Verified direct HTTPS audio stream ready for offline download."
        });
      }
    },

    renderLinkAnalysisCard(info) {
      const box = document.getElementById("link-analysis-result");
      if (!box) return;
      if (!info.ok) {
        box.innerHTML = `
          <div class="song-row" style="border-color:var(--error);">
            <div class="quick-icon">⚠️</div>
            <div class="song-info">
              <div class="song-name">Link Validation Notice</div>
              <div class="song-meta">${escapeHtml(info.error || "Unsupported URL")}</div>
            </div>
          </div>
        `;
        return;
      }
      state.analyzedLink = info;
      const thumb = info.thumbnail || makeSvgUri(info.sourceType === "youtube" ? "YT" : "DL", "#8B5CF6", "#22D3EE");
      box.innerHTML = `
        <div class="hero-card" style="margin-top:12px;">
          <div style="display:flex;gap:12px;align-items:center;">
            <img src="${thumb}" class="song-thumb" style="width:68px;height:68px;" alt="" />
            <div class="song-info">
              <span class="badge ${info.directDownloadPermitted ? 'green' : 'cyan'}">${info.sourceType === "youtube" ? "OFFICIAL YOUTUBE INTEGRATION" : "DIRECT DOWNLOADABLE MEDIA"}</span>
              <div class="song-name" style="font-size:16px;margin-top:4px;">${escapeHtml(info.title)}</div>
              <div class="song-meta">${escapeHtml(info.artist)} • ${escapeHtml(info.sourceWebsite)} ${info.fileSize > 0 ? "• " + formatBytes(info.fileSize) : ""}</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);background:rgba(11,13,18,0.55);padding:10px;border-radius:10px;border:1px solid var(--border-color);">
            🛡️ ${escapeHtml(info.policyNotice || "")}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${info.directDownloadPermitted ? `<button class="pill-btn accent" onclick="XeceayApp.downloadAnalyzedDirectLink()">⬇ Download to Offline Library</button>` : ""}
            ${info.directDownloadPermitted ? `<button class="pill-btn cyan" onclick="XeceayApp.previewAnalyzedLink()">🎧 Stream Preview</button>` : ""}
            <button class="pill-btn" onclick="XeceayApp.openAnalyzedSource()">↗️ Open Official Source</button>
            <button class="pill-btn" onclick="XeceayApp.importLocalFile()">📂 Import Local Authorized File</button>
          </div>
        </div>
      `;
    },

    downloadAnalyzedDirectLink() {
      const info = state.analyzedLink;
      if (!info || !info.directDownloadPermitted) {
        showToast("Direct download is only available for permitted direct media files.");
        return;
      }
      if (isNative) {
        const res = JSON.parse(
          window.XeceayNative.enqueueDownload(
            info.title || "Imported Audio",
            info.artist || "Authorized Source",
            "Link Imports",
            "Electronic",
            info.thumbnail || "",
            info.url,
            info.format || "MP3",
            "320kbps",
            info.mediaType || "audio"
          )
        );
        if (res.ok) {
          showToast("Download started in Download Manager!");
          this.switchTab("downloads");
        } else {
          showToast(res.error || "Could not queue download");
        }
      }
    },

    previewAnalyzedLink() {
      const info = state.analyzedLink;
      if (!info) {
        this.analyzeLinkInput();
        return;
      }
      if (info.sourceType === "youtube") {
        this.openAnalyzedSource();
      } else {
        this.playExternalPreview(info.title, info.artist, info.thumbnail || "", info.url);
        showToast("Streaming preview: " + info.title);
      }
    },

    openAnalyzedSource() {
      const url = (state.analyzedLink && state.analyzedLink.url) || document.getElementById("link-importer-input").value;
      if (!url) return;
      if (isNative) {
        window.XeceayNative.openExternalUrl(url.trim());
      } else {
        window.open(url.trim(), "_blank");
      }
    },

    // Screen 9: GitHub Release Auto-Updater & In-App APK Installer
    openGitHubUpdateQuick() {
      this.switchTab("settings");
      this.checkGitHubReleaseNow();
    },

    checkGitHubReleaseNow() {
      const repo = (document.getElementById("github-repo-input").value || "xeceay/xeceay-music").trim();
      const box = document.getElementById("github-update-status-box");
      if (box) {
        box.innerHTML = `⏳ Checking GitHub Releases API for <strong>${escapeHtml(repo)}</strong>...`;
      }
      if (isNative) {
        window.XeceayNative.checkGitHubUpdate(repo);
      } else {
        fetch(`https://api.github.com/repos/${repo}/releases/latest`)
          .then(r => r.ok ? r.json() : Promise.reject("No release published yet"))
          .then(data => {
            box.innerHTML = `✅ Latest release found: <strong>${escapeHtml(data.tag_name)}</strong>`;
          })
          .catch(() => {
            box.innerHTML = `ℹ️ No GitHub Release published yet in <code>${escapeHtml(repo)}</code>. Push to GitHub or tag <code>v1.0.1</code> to trigger the included GitHub Actions APK auto-release workflow!`;
          });
      }
    },

    downloadDirectApkInput() {
      const url = (document.getElementById("direct-apk-url-input").value || "").trim();
      if (!url) {
        showToast("Enter a direct HTTPS .apk URL or click 'Check GitHub Release'");
        return;
      }
      if (isNative) {
        window.XeceayNative.downloadAndInstallGitHubApk(url, true);
      } else {
        window.open(url, "_blank");
      }
    },

    downloadReleaseApk(url) {
      if (isNative) {
        window.XeceayNative.downloadAndInstallGitHubApk(url, true);
      } else {
        window.open(url, "_blank");
      }
    },

    installStagedApk() {
      if (isNative) {
        window.XeceayNative.installDownloadedApkNow();
      }
    },

    testInAppApkInstaller() {
      if (isNative) {
        showToast("Staging APK and launching Android Package Installer...");
        window.XeceayNative.testSelfApkInstaller();
      } else {
        showToast("Run on Android device to launch the native APK Package Installer");
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
      this.savePreferences();
    },

    refreshStorageCard() {
      if (isNative) {
        try {
          state.storage = JSON.parse(window.XeceayNative.getStorageInfo());
        } catch (_e) {}
      }
      renderStorageCard();
    },

    savePreferences() {
      const name = (document.getElementById("sync-user-name") || {}).value || "XECEAY Audiophile";
      const email = (document.getElementById("sync-user-email") || {}).value || "listener@xeceay.app";
      const qual = (document.getElementById("setting-quality-select") || {}).value || "High Quality (320kbps)";
      const repo = (document.getElementById("github-repo-input") || {}).value || "xeceay/xeceay-music";
      state.user.displayName = name;
      state.user.email = email;
      state.user.preferences.audioQuality = qual;
      state.user.preferences.githubRepo = repo;
      if (isNative) {
        window.XeceayNative.saveUserProfile(name, email, JSON.stringify(state.user.preferences));
      }
      updateGreeting();
      showToast("Settings & Sync preferences saved");
    },

    exportSyncBundle() {
      if (isNative) {
        const json = window.XeceayNative.exportCloudSync();
        prompt("Copy your XECEAY Cross-Platform Cloud Sync JSON Bundle:", json);
      } else {
        prompt("XECEAY Sync Bundle:", JSON.stringify({ playlists: state.playlists }));
      }
    },

    importSyncBundlePrompt() {
      const raw = prompt("Paste your XECEAY Cloud Sync JSON Bundle here:");
      if (raw && raw.trim() && isNative) {
        const count = window.XeceayNative.importCloudSync(raw.trim());
        refreshFromNative();
        showToast(`Imported ${count} synchronized playlists!`);
      }
    },

    // Native Event Receiver from MainActivity.kt
    onNativeEvent(evt) {
      if (!evt || !evt.eventType) return;
      const p = evt.payload || {};

      if (evt.eventType === "player_state") {
        Object.assign(state.player, p);
        updatePlayerUiOnly();
        if (p.event === "ended") {
          handleTrackEnded();
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
            showToast(`Download completed: ${p.title}`);
          }
        }
        renderDownloadsScreen();
      } else if (evt.eventType === "link_analysis") {
        this.renderLinkAnalysisCard(p);
      } else if (evt.eventType === "github_update") {
        this.handleGitHubUpdateEvent(p);
      } else if (evt.eventType === "file_imported" || evt.eventType === "media_scanned") {
        refreshFromNative();
        if (p.title) showToast("Imported: " + p.title);
      } else if (evt.eventType === "shared_link") {
        if (p.sharedText) {
          this.switchTab("link");
          const inp = document.getElementById("link-importer-input");
          if (inp) inp.value = p.sharedText;
          this.analyzeLinkInput();
        }
      }
    },

    handleGitHubUpdateEvent(p) {
      const box = document.getElementById("github-update-status-box");
      if (!box) return;

      if (p.type === "checking") {
        box.innerHTML = `⏳ Querying GitHub Releases for <strong>${escapeHtml(p.repo)}</strong>...`;
      } else if (p.type === "release_info") {
        const hasApk = Boolean(p.apkUrl);
        box.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <div>
              <span class="badge ${p.isNewer ? 'green' : 'cyan'}">${p.isNewer ? "NEW UPDATE AVAILABLE" : "UP TO DATE / REINSTALLABLE"}</span>
              <strong style="margin-left:6px;">${escapeHtml(p.releaseTitle || p.tagName)}</strong>
            </div>
            <span style="color:var(--text-secondary);">Installed: v${escapeHtml(p.installedVersion)} → Remote: ${escapeHtml(p.tagName)}</span>
          </div>
          <div style="margin:6px 0;color:var(--text-secondary);white-space:pre-line;">${escapeHtml(p.changelog || "")}</div>
          ${hasApk
            ? `<div style="display:flex;gap:8px;align-items:center;margin-top:8px;">
                 <button class="pill-btn accent" onclick="XeceayApp.downloadReleaseApk('${escapeAttr(p.apkUrl)}')">⬇️ Download & Auto-Install ${escapeHtml(p.apkName)} (${formatBytes(p.apkSize)})</button>
               </div>`
            : `<div style="color:var(--warning);margin-top:6px;">Release found, but no <code>.apk</code> asset is attached to tag ${escapeHtml(p.tagName)} yet.</div>`
          }
        `;
      } else if (p.type === "no_release_found") {
        box.innerHTML = `
          <div style="color:var(--text-secondary);line-height:1.45;">
            ℹ️ ${escapeHtml(p.message)}<br/>
            <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
              <button class="pill-btn cyan" onclick="XeceayApp.testInAppApkInstaller()">⚡ Test In-App APK Installer Now</button>
            </div>
          </div>
        `;
      } else if (p.type === "download_progress") {
        box.innerHTML = `
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <strong>⬇️ Downloading XECEAY Update APK (${p.progress || 0}%)</strong>
            <span>${formatBytes(p.downloadedBytes)} / ${p.totalBytes > 0 ? formatBytes(p.totalBytes) : "APK"} • ⚡ ${formatBytes(p.speedBps)}/s</span>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${p.progress || 0}%;"></div></div>
        `;
      } else if (p.type === "download_complete") {
        box.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <span class="badge green">APK READY TO INSTALL</span>
              <span style="margin-left:6px;">Saved (${formatBytes(p.apkSize)})</span>
            </div>
            <button class="pill-btn accent" onclick="XeceayApp.installStagedApk()">📲 Install APK Now</button>
          </div>
        `;
      } else if (p.type === "permission_required") {
        box.innerHTML = `
          <div style="color:var(--warning);">
            🔒 ${escapeHtml(p.message)}
            <div style="margin-top:8px;">
              <button class="pill-btn accent" onclick="XeceayApp.installStagedApk()">📲 Install APK Now</button>
            </div>
          </div>
        `;
      } else if (p.type === "installer_launched") {
        box.innerHTML = `✅ Android System Package Installer launched! Confirm installation in the system prompt.`;
      } else if (p.type === "check_error" || p.type === "download_error" || p.type === "install_error") {
        box.innerHTML = `<span style="color:var(--error);">⚠️ ${escapeHtml(p.error || "Update error")}</span>`;
      }
    }
  };

  window.addEventListener("DOMContentLoaded", () => {
    refreshFromNative();
    fetchLiveItunesCatalog("electronic synthwave");
    setTimeout(() => {
      const splash = document.getElementById("splash-screen");
      if (splash) splash.classList.add("hidden");
    }, 1100);
  });
})();
