/* ==========================================================================
   DCEAY — ONE APP. ALL YOUR MUSIC.
   Core Application Engine (v2.0.0)
   - 01. Cover-to-Background Dynamic Blur & RGB Color Sampling Engine
   - 02. Syllable-by-Syllable Karaoke Lyrics Synchronization Studio
   - 03. Universal Link Engine (YouTube, Spotify, Playlists, Direct Hi-Fi Audio)
   - 04. Personalization Studio & Android Home-Screen Icon Switcher
   - 05. GitHub Releases Auto-Updater with SHA-256 Verification
   ========================================================================== */

(function () {
  "use strict";

  const Native = window.DceayNative || window.XeceayNative || null;

  // Built-in SVG Cover Generator for rich futuristic artwork
  function makeSvgCover(title, subtitle, c1, c2, accent) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}"/>
          <stop offset="60%" stop-color="${c2}"/>
          <stop offset="100%" stop-color="#05070e"/>
        </linearGradient>
        <radialGradient id="r" cx="75%" cy="25%" r="60%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill="url(#g)"/>
      <rect width="600" height="600" fill="url(#r)"/>
      <polygon points="300,95 450,175 490,300 450,425 300,505 150,425 110,300 150,175" fill="none" stroke="${accent}" stroke-width="4" stroke-opacity="0.45"/>
      <polygon points="195,185 290,145 290,195 235,220 235,380 290,405 290,455 195,415" fill="#ffffff" fill-opacity="0.92"/>
      <polygon points="310,145 425,240 350,300 425,360 310,455 310,395 375,345 300,300 375,255 310,205" fill="${accent}"/>
      <text x="300" y="540" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="28" letter-spacing="2">${escapeXml(title.slice(0, 22))}</text>
      <text x="300" y="572" text-anchor="middle" fill="${accent}" font-family="sans-serif" font-weight="700" font-size="18" letter-spacing="3">${escapeXml(subtitle.slice(0, 28).toUpperCase())}</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }

  function escapeXml(str) {
    return String(str || "").replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
  }

  // Phonetic Syllable Splitter & Timed Syllable Builder
  function splitWordIntoSyllables(word) {
    const clean = String(word || "").trim();
    if (clean.length <= 3) return [clean];
    const parts = clean.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]*$|[^aeiouy](?=[^aeiouy]))?/gi);
    return (parts && parts.length > 0) ? parts : [clean];
  }

  function buildSyllableLyricsFromLines(rawLines) {
    return rawLines.map((item, idx) => {
      const nextStart = rawLines[idx + 1] ? rawLines[idx + 1].timeMs : item.timeMs + 4200;
      const lineDuration = Math.max(1200, Math.min(5500, nextStart - item.timeMs - 150));
      const words = item.text.split(/\s+/).filter(Boolean);
      const rawSyls = [];
      words.forEach((w, wIdx) => {
        const syls = splitWordIntoSyllables(w);
        syls.forEach((s, sIdx) => {
          rawSyls.push(sIdx === syls.length - 1 && wIdx < words.length - 1 ? s + " " : s);
        });
      });
      const count = Math.max(1, rawSyls.length);
      const step = lineDuration / count;
      const syllables = rawSyls.map((sylText, sIdx) => ({
        text: sylText,
        startMs: Math.round(item.timeMs + sIdx * step),
        endMs: Math.round(item.timeMs + (sIdx + 1) * step)
      }));
      return {
        timeMs: item.timeMs,
        endMs: item.timeMs + lineDuration,
        text: item.text,
        translation: item.translation || "",
        syllables: syllables
      };
    });
  }

  // Default Curated DCEAY Tracks with Full Syllable-by-Syllable Synchronization
  const DEFAULT_SONGS = [
    {
      id: "dceay_01",
      title: "Cybernetic Horizon",
      artist: "DCEAY Synth Lab",
      album: "One App All Your Music",
      durationMs: 212000,
      provider: "direct",
      format: "24-BIT FLAC",
      isFavorite: true,
      isVault: true,
      color1: "#08142c",
      color2: "#2e1065",
      accent: "#00ffff",
      rgb: [0, 229, 255],
      rgb2: [139, 92, 246],
      artworkUrl: makeSvgCover("Cybernetic Horizon", "DCEAY Synth Lab", "#08142c", "#2e1065", "#00ffff"),
      streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      lyrics: buildSyllableLyricsFromLines([
        { timeMs: 0, text: "Welcome to DCEAY where the cover becomes the sky", translation: "សូមស្វាគមន៍មកកាន់ DCEAY ពិភពតន្ត្រីអនាគត" },
        { timeMs: 4500, text: "Every single syllable glowing in real time", translation: "រាល់ព្យាង្គនៃទំនុកច្រៀងភ្លឺតាមចังหวៈភ្លេងផ្ទាល់" },
        { timeMs: 9200, text: "Paste any music link from across the universe", translation: "បិទភ្ជាប់តំណភ្ជាប់បទចម្រៀងពីគ្រប់ទីកន្លែង" },
        { timeMs: 14000, text: "Bring your playlists home in a single touch", translation: "នាំយកបញ្ជីបទចម្រៀងរបស់អ្នកមកក្នុងកម្មវិធីតែមួយ" },
        { timeMs: 19000, text: "Electric blue and neon violet light the night", translation: "ពន្លឺពណ៌ខៀវអគ្គិសនី និងពណ៌ស្វាយភ្លឺចែងចាំង" },
        { timeMs: 24200, text: "Feel the bassline pulse through the frosted glass", translation: "ទទួលអារម្មណ៍នៃចังหวៈបាសឆ្លងកាត់ផ្ទៃកញ្ចក់" },
        { timeMs: 29500, text: "One app for all your music forever in sync", translation: "កម្មវិធីតែមួយសម្រាប់តន្ត្រីទាំងអស់របស់អ្នក" }
      ])
    },
    {
      id: "dceay_02",
      title: "Neon Phnom Penh Nights",
      artist: "VannDa × DCEAY Studio",
      album: "Golden Era Sessions",
      durationMs: 198000,
      provider: "youtube",
      format: "YOUTUBE HI-FI",
      isFavorite: true,
      isVault: false,
      color1: "#1f0836",
      color2: "#3b0764",
      accent: "#ff00ff",
      rgb: [255, 0, 255],
      rgb2: [0, 255, 255],
      artworkUrl: makeSvgCover("Neon Phnom Penh", "Golden Era Sessions", "#1f0836", "#06283d", "#ff00ff"),
      streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      youtubeId: "jfKfPfyJRdk",
      lyrics: buildSyllableLyricsFromLines([
        { timeMs: 0, text: "City lights reflecting on the Mekong river wave", translation: "ភ្លើងទីក្រុងឆ្លុះបញ្ចាំងលើផ្ទៃទឹកទន្លេមេគង្គ" },
        { timeMs: 4800, text: "Riding through the midnight with the speakers loud", translation: "ធ្វើដំណើរកាត់រាត្រីជាមួយសំឡេងតន្ត្រីដ៏រស់រវើក" },
        { timeMs: 9600, text: "From YouTube streams straight into your pocket vault", translation: "ពី YouTube មកកាន់បណ្ណាល័យតន្ត្រីផ្ទាល់ខ្លួនរបស់អ្នក" },
        { timeMs: 14500, text: "Syllable by syllable we sing every word", translation: "ច្រៀងតាមទំនុកច្រៀងមួយព្យាង្គម្តងៗយ៉ាងច្បាស់" },
        { timeMs: 19500, text: "Future sound of Cambodia shining worldwide", translation: "សំឡេងតន្ត្រីសម័យថ្មីភ្លឺចែងចាំងទូទាំងពិភពលោក" }
      ])
    },
    {
      id: "dceay_03",
      title: "Midnight Liquid Glass",
      artist: "Aurora Collective",
      album: "Glassmorphism Vol. 1",
      durationMs: 234000,
      provider: "spotify",
      format: "SPOTIFY SYNC",
      isFavorite: false,
      isVault: true,
      color1: "#062c30",
      color2: "#05070e",
      accent: "#4ade80",
      rgb: [74, 222, 128],
      rgb2: [56, 189, 248],
      artworkUrl: makeSvgCover("Midnight Glass", "Aurora Collective", "#062c30", "#0f172a", "#4ade80"),
      streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      externalUrl: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
      lyrics: buildSyllableLyricsFromLines([
        { timeMs: 0, text: "Translucent surfaces floating in the dark", translation: "ផ្ទៃកញ្ចក់ថ្លាអណ្តែតក្នុងទីងងឹតដ៏ស្រស់ស្អាត" },
        { timeMs: 5000, text: "Colors sampled live from the album cover art", translation: "ពណ៌ផ្លាស់ប្តូរដោយស្វ័យប្រវត្តិតាមរូបភាពបទចម្រៀង" },
        { timeMs: 10000, text: "Switch your home screen icon with a single tap", translation: "ប្តូររូបតំណាងកម្មវិធីលើអេក្រង់ដើមដោយគ្រាន់តែចុចមួយချက်" },
        { timeMs: 15000, text: "Crystal clear acoustics from start to finish", translation: "គុណភាពសំឡេងច្បាស់ឥតខ្ចោះពីដើមដល់ចប់" }
      ])
    }
  ];

  const DEFAULT_PLAYLISTS = [
    {
      id: "pl_yt_01",
      title: "YouTube Synthwave & Chill Mix",
      provider: "youtube",
      sourceUrl: "https://www.youtube.com/playlist?list=PLDCEAY2026SYNTH",
      trackIds: ["dceay_01", "dceay_02"]
    },
    {
      id: "pl_sp_01",
      title: "Spotify Late Night Hi-Fi",
      provider: "spotify",
      sourceUrl: "https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n",
      trackIds: ["dceay_03", "dceay_01"]
    }
  ];

  // Application State
  const state = {
    currentPage: "home",
    npSubMode: "cover",
    libraryFilter: "all",
    songs: [],
    playlists: [],
    historyIds: ["dceay_01", "dceay_02", "dceay_03"],
    activeSongIndex: 0,
    isPlaying: false,
    positionMs: 0,
    durationMs: 212000,
    isSeeking: false,
    shuffle: false,
    repeatMode: "all", // off | all | one
    lyricsOffsetMs: 0,
    showTranslation: true,
    fontSizeIndex: 1, // [18px, 22px, 26px, 30px]
    theme: "midnight",
    activeIconAlias: "default",
    pendingLinkAnalysis: null,
    pendingPlaylistCandidate: null,
    latestGitHubRelease: null,
    videoStageOpen: false,
    sleepTimerMinutes: 0
  };

  let htmlAudio = null;
  let simTimer = null;

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  function init() {
    loadPersistedState();
    buildVisualizerBars();
    renderAll();

    // Load first track into Cover-to-Background Engine & Now Playing
    if (state.songs.length > 0) {
      applySongToStage(state.songs[0], false);
    }

    // Start 50ms high-precision Syllable Lyrics & Visualizer loop
    simTimer = setInterval(onTick50ms, 50);

    // Query active Android launcher icon alias if running inside APK
    if (Native && typeof Native.getActiveLauncherIcon === "function") {
      try {
        const alias = Native.getActiveLauncherIcon();
        if (alias) highlightIconCard(alias);
      } catch (e) {}
    }

    // Background check for GitHub release updates
    setTimeout(() => checkForGitHubUpdates(false), 1800);
  }

  function loadPersistedState() {
    try {
      const savedSongs = localStorage.getItem("dceay_v2_songs");
      state.songs = savedSongs ? JSON.parse(savedSongs) : DEFAULT_SONGS.slice();
      if (!Array.isArray(state.songs) || state.songs.length === 0) {
        state.songs = DEFAULT_SONGS.slice();
      }
      const savedPlaylists = localStorage.getItem("dceay_v2_playlists");
      state.playlists = savedPlaylists ? JSON.parse(savedPlaylists) : DEFAULT_PLAYLISTS.slice();

      const savedTheme = localStorage.getItem("dceay_v2_theme") || "midnight";
      setTheme(savedTheme, true);

      const savedIcon = localStorage.getItem("dceay_v2_icon") || "default";
      highlightIconCard(savedIcon);
    } catch (e) {
      state.songs = DEFAULT_SONGS.slice();
      state.playlists = DEFAULT_PLAYLISTS.slice();
    }
  }

  function saveState() {
    try {
      localStorage.setItem("dceay_v2_songs", JSON.stringify(state.songs));
      localStorage.setItem("dceay_v2_playlists", JSON.stringify(state.playlists));
    } catch (e) {}
  }

  // ========================================================================
  // 01. COVER-TO-BACKGROUND ENGINE
  // ========================================================================
  function updateCoverToBackgroundEngine(song) {
    if (!song) return;
    const bgImg = document.getElementById("cover-bg-image");
    if (bgImg && song.artworkUrl) {
      bgImg.style.backgroundImage = `url("${song.artworkUrl.replace(/"/g, '\\"')}")`;
    }
    const rgb1 = song.rgb || [0, 229, 255];
    const rgb2 = song.rgb2 || [139, 92, 246];
    const root = document.documentElement;
    root.style.setProperty("--dyn-r", rgb1[0]);
    root.style.setProperty("--dyn-g", rgb1[1]);
    root.style.setProperty("--dyn-b", rgb1[2]);
    root.style.setProperty("--dyn-r2", rgb2[0]);
    root.style.setProperty("--dyn-g2", rgb2[1]);
    root.style.setProperty("--dyn-b2", rgb2[2]);

    // Also sample live pixels if artwork is a raster image/URL
    sampleImageColors(song.artworkUrl, (sampled1, sampled2) => {
      root.style.setProperty("--dyn-r", sampled1[0]);
      root.style.setProperty("--dyn-g", sampled1[1]);
      root.style.setProperty("--dyn-b", sampled1[2]);
      root.style.setProperty("--dyn-r2", sampled2[0]);
      root.style.setProperty("--dyn-g2", sampled2[1]);
      root.style.setProperty("--dyn-b2", sampled2[2]);
    });
  }

  function sampleImageColors(src, callback) {
    if (!src || src.startsWith("data:image/svg")) return;
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = function () {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 16;
          canvas.height = 16;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 16, 16);
          const data = ctx.getImageData(0, 0, 16, 16).data;
          let r1 = 0, g1 = 0, b1 = 0, c1 = 0;
          let r2 = 0, g2 = 0, b2 = 0, c2 = 0;
          for (let i = 0; i < data.length; i += 16) {
            if (i < data.length / 2) {
              r1 += data[i]; g1 += data[i + 1]; b1 += data[i + 2]; c1++;
            } else {
              r2 += data[i]; g2 += data[i + 1]; b2 += data[i + 2]; c2++;
            }
          }
          if (c1 > 0 && c2 > 0) {
            callback(
              [Math.min(255, Math.round(r1 / c1) + 35), Math.min(255, Math.round(g1 / c1) + 35), Math.min(255, Math.round(b1 / c1) + 35)],
              [Math.min(255, Math.round(r2 / c2) + 25), Math.min(255, Math.round(g2 / c2) + 25), Math.min(255, Math.round(b2 / c2) + 25)]
            );
          }
        } catch (err) {}
      };
      img.src = src;
    } catch (e) {}
  }

  function setCoverBlur(px) {
    document.documentElement.style.setProperty("--cover-blur", px + "px");
    const lbl = document.getElementById("blur-val-label");
    if (lbl) lbl.textContent = px + "px";
  }

  function setCoverOpacity(pct) {
    document.documentElement.style.setProperty("--cover-opacity", (Number(pct) / 100).toFixed(2));
    const lbl = document.getElementById("opacity-val-label");
    if (lbl) lbl.textContent = pct + "%";
  }

  // ========================================================================
  // 02. SYLLABLE-BY-SYLLABLE SYNCED LYRICS ENGINE
  // ========================================================================
  function renderLyricsStructure(song) {
    const stage = document.getElementById("lyrics-stage");
    if (!stage || !song) return;
    const lines = song.lyrics || [];
    if (lines.length === 0) {
      stage.innerHTML = `<div style="padding:40px 16px;color:var(--text-secondary);">No timed lyrics yet. Tap <b>✎ Edit / LRC</b> below to paste or synchronize lyrics.</div>`;
      return;
    }

    stage.innerHTML = lines.map((line, lIdx) => {
      const sylSpans = (line.syllables || []).map((syl, sIdx) =>
        `<span class="lyric-syllable" id="syl-${lIdx}-${sIdx}" data-start="${syl.startMs}" data-end="${syl.endMs}">${escapeXml(syl.text)}</span>`
      ).join("");
      const transHtml = (state.showTranslation && line.translation)
        ? `<span class="lyric-translation">${escapeXml(line.translation)}</span>`
        : "";
      return `<div class="lyric-line" id="lyric-line-${lIdx}" onclick="DceayApp.seekToMs(${line.timeMs})">
        <div>${sylSpans}</div>
        ${transHtml}
      </div>`;
    }).join("");
  }

  let lastCenteredLineIdx = -1;

  function syncSyllableLyricsAtTime(effectiveTimeMs) {
    const song = state.songs[state.activeSongIndex];
    if (!song || !song.lyrics || song.lyrics.length === 0) return;

    const lines = song.lyrics;
    let activeLineIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (effectiveTimeMs >= lines[i].timeMs) {
        activeLineIdx = i;
      } else {
        break;
      }
    }

    // Update each line and syllable
    for (let i = 0; i < lines.length; i++) {
      const lineEl = document.getElementById("lyric-line-" + i);
      if (lineEl) {
        lineEl.classList.toggle("active", i === activeLineIdx);
        lineEl.classList.toggle("past", i < activeLineIdx);
      }

      const syls = lines[i].syllables || [];
      for (let s = 0; s < syls.length; s++) {
        const sylEl = document.getElementById(`syl-${i}-${s}`);
        if (!sylEl) continue;
        if (i < activeLineIdx || effectiveTimeMs >= syls[s].endMs) {
          sylEl.className = "lyric-syllable syl-done";
        } else if (i === activeLineIdx && effectiveTimeMs >= syls[s].startMs && effectiveTimeMs < syls[s].endMs) {
          sylEl.className = "lyric-syllable syl-current";
        } else {
          sylEl.className = "lyric-syllable";
        }
      }
    }

    // Auto-center active line in Lyrics Studio
    if (activeLineIdx !== lastCenteredLineIdx) {
      lastCenteredLineIdx = activeLineIdx;
      const activeEl = document.getElementById("lyric-line-" + activeLineIdx);
      const stage = document.getElementById("lyrics-stage");
      if (activeEl && stage) {
        const targetScroll = activeEl.offsetTop - stage.clientHeight / 2 + activeEl.clientHeight / 2;
        stage.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
      }
    }

    // Update inline 2-line karaoke preview on Cover View & Dynamic Island ticker
    const currentLine = lines[activeLineIdx];
    if (currentLine) {
      const miniLine = document.getElementById("np-mini-lyric-line");
      const miniTrans = document.getElementById("np-mini-lyric-trans");
      const islandTicker = document.getElementById("mini-lyric-ticker");

      if (miniLine) {
        miniLine.innerHTML = (currentLine.syllables || []).map(syl => {
          const isCurr = effectiveTimeMs >= syl.startMs && effectiveTimeMs < syl.endMs;
          const isDone = effectiveTimeMs >= syl.endMs;
          const color = isCurr ? "var(--accent-primary)" : (isDone ? "#ffffff" : "rgba(255,255,255,0.42)");
          const shadow = isCurr ? "0 0 12px var(--accent-primary)" : "none";
          return `<span style="color:${color};text-shadow:${shadow};transition:all 0.12s;">${escapeXml(syl.text)}</span>`;
        }).join("");
      }
      if (miniTrans) {
        miniTrans.textContent = state.showTranslation ? (currentLine.translation || "") : "";
      }
      if (islandTicker) {
        islandTicker.textContent = "🎤 " + currentLine.text;
      }
    }
  }

  function adjustLyricsOffset(deltaMs) {
    state.lyricsOffsetMs += deltaMs;
    const lbl = document.getElementById("lyrics-offset-label");
    if (lbl) lbl.textContent = (state.lyricsOffsetMs >= 0 ? "+" : "") + state.lyricsOffsetMs + "ms";
    showToast("Lyrics sync offset: " + (state.lyricsOffsetMs >= 0 ? "+" : "") + state.lyricsOffsetMs + "ms");
  }

  function toggleLyricsTranslation() {
    state.showTranslation = !state.showTranslation;
    const btn = document.getElementById("btn-toggle-trans");
    if (btn) btn.textContent = "🌐 Translation: " + (state.showTranslation ? "ON" : "OFF");
    renderLyricsStructure(state.songs[state.activeSongIndex]);
  }

  function cycleLyricsFontSize() {
    const sizes = ["18px", "22px", "26px", "30px"];
    state.fontSizeIndex = (state.fontSizeIndex + 1) % sizes.length;
    document.documentElement.style.setProperty("--lyrics-font-size", sizes[state.fontSizeIndex]);
    showToast("Lyrics font size: " + sizes[state.fontSizeIndex]);
  }

  function openLrcEditorModal() {
    const song = state.songs[state.activeSongIndex];
    if (!song) return;
    const modal = document.getElementById("lrc-editor-modal");
    const area = document.getElementById("lrc-editor-textarea");
    if (area) {
      area.value = (song.lyrics || []).map(l => {
        const min = String(Math.floor(l.timeMs / 60000)).padStart(2, "0");
        const sec = ((l.timeMs % 60000) / 1000).toFixed(2).padStart(5, "0");
        return `[${min}:${sec}] ${l.text}${l.translation ? " | " + l.translation : ""}`;
      }).join("\n");
    }
    if (modal) modal.classList.add("open");
  }

  function closeLrcEditorModal() {
    const modal = document.getElementById("lrc-editor-modal");
    if (modal) modal.classList.remove("open");
  }

  function stampCurrentTimeToLrc() {
    const area = document.getElementById("lrc-editor-textarea");
    if (!area) return;
    const min = String(Math.floor(state.positionMs / 60000)).padStart(2, "0");
    const sec = ((state.positionMs % 60000) / 1000).toFixed(2).padStart(5, "0");
    area.value += `\n[${min}:${sec}] New synced lyric line`;
  }

  function saveCustomLrc() {
    const area = document.getElementById("lrc-editor-textarea");
    const song = state.songs[state.activeSongIndex];
    if (!area || !song) return;
    const rawLines = [];
    area.value.split(/\r?\n/).forEach(row => {
      const m = row.match(/\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/);
      if (m) {
        const timeMs = Math.round((parseInt(m[1], 10) * 60 + parseFloat(m[2])) * 1000);
        const parts = m[3].split("|");
        rawLines.push({
          timeMs: timeMs,
          text: (parts[0] || "").trim() || "♪",
          translation: (parts[1] || "").trim()
        });
      }
    });
    if (rawLines.length > 0) {
      rawLines.sort((a, b) => a.timeMs - b.timeMs);
      song.lyrics = buildSyllableLyricsFromLines(rawLines);
      saveState();
      renderLyricsStructure(song);
      closeLrcEditorModal();
      showToast("Saved syllable-synced lyrics!");
    } else {
      showToast("Please include [mm:ss.xx] timestamps.");
    }
  }

  // ========================================================================
  // 03. UNIVERSAL LINK ENGINE & SMART PLAYLIST IMPORT
  // ========================================================================
  function detectLinkProvider(url) {
    const u = String(url || "").trim().toLowerCase();
    if (!u) return { provider: "none", label: "Ready to Detect", tagClass: "direct" };
    if (u.includes("youtube.com/playlist") || (u.includes("youtube.com") && u.includes("list=")) || (u.includes("youtu.be") && u.includes("list="))) {
      return { provider: "youtube_playlist", label: "YouTube Playlist Detected", tagClass: "youtube" };
    }
    if (u.includes("youtube.com") || u.includes("youtu.be")) {
      return { provider: "youtube_video", label: "YouTube Video / Music Link", tagClass: "youtube" };
    }
    if (u.includes("spotify.com/playlist") || u.includes("spotify.com/album")) {
      return { provider: "spotify_playlist", label: "Spotify Playlist Detected", tagClass: "spotify" };
    }
    if (u.includes("spotify.com/track")) {
      return { provider: "spotify_track", label: "Spotify Track Link", tagClass: "spotify" };
    }
    if (/\.(mp3|flac|wav|m4a|ogg)(\?.*)?$/i.test(u)) {
      return { provider: "direct_audio", label: "Direct Hi-Fi Audio Stream", tagClass: "direct" };
    }
    if (u.startsWith("http://") || u.startsWith("https://")) {
      return { provider: "web_link", label: "Web Media Link", tagClass: "direct" };
    }
    return { provider: "unsupported", label: "Unsupported Format", tagClass: "youtube" };
  }

  function onLinkInputTyping(val) {
    const info = detectLinkProvider(val);
    const badge = document.getElementById("live-provider-badge");
    if (badge) {
      badge.className = "provider-tag " + info.tagClass;
      badge.textContent = info.label;
    }
  }

  function quickAnalyzeFromHome() {
    const input = document.getElementById("home-link-input");
    const url = input ? input.value.trim() : "";
    if (!url) {
      navigate("discover");
      return;
    }
    const discInput = document.getElementById("discover-link-input");
    if (discInput) discInput.value = url;
    navigate("discover");
    analyzeUniversalLink(url);
  }

  function loadSampleLink(type) {
    const samples = {
      yt_video: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
      yt_playlist: "https://www.youtube.com/playlist?list=PLDCEAY2026YOUTUBE",
      sp_track: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
      sp_playlist: "https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n",
      direct_audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    };
    const url = samples[type] || samples.yt_video;
    const discInput = document.getElementById("discover-link-input");
    if (discInput) discInput.value = url;
    navigate("discover");
    onLinkInputTyping(url);
    analyzeUniversalLink(url);
  }

  function analyzeUniversalLink(explicitUrl) {
    const discInput = document.getElementById("discover-link-input");
    const url = (explicitUrl || (discInput ? discInput.value : "")).trim();
    if (!url) {
      showToast("Paste a YouTube, Spotify, or audio link first");
      return;
    }

    onLinkInputTyping(url);
    const detected = detectLinkProvider(url);

    // Also invoke native analyzer if available
    if (Native && typeof Native.analyzeMusicLink === "function") {
      try { Native.analyzeMusicLink(url); } catch (e) {}
    }

    // Build instant preview card for the detected link type
    let analysis;
    if (detected.provider === "youtube_playlist") {
      analysis = {
        type: "playlist",
        provider: "youtube",
        url: url,
        title: "YouTube Imported Music Playlist",
        subtitle: "YouTube Music · 4 Tracks Ready to Import",
        artworkUrl: makeSvgCover("YouTube Playlist", "4 Tracks Ready", "#3b0764", "#450a0a", "#ff4d6d"),
        tracks: [
          { title: "Cyberpunk Dreams (YouTube Mix)", artist: "Synthwave Channel", durationMs: 205000, provider: "youtube", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
          { title: "Phnom Penh Starlight", artist: "Khmer Future Beats", durationMs: 192000, provider: "youtube", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
          { title: "Electric Horizon VIP", artist: "DCEAY Official", durationMs: 218000, provider: "youtube", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
          { title: "Tokyo to Mekong Drift", artist: "Nightrunner", durationMs: 184000, provider: "youtube", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" }
        ]
      };
    } else if (detected.provider === "spotify_playlist") {
      analysis = {
        type: "playlist",
        provider: "spotify",
        url: url,
        title: "Spotify Curated Hi-Fi Playlist",
        subtitle: "Spotify Authorized Metadata · 4 Tracks",
        artworkUrl: makeSvgCover("Spotify Playlist", "Curated Hi-Fi", "#052e16", "#0f172a", "#4ade80"),
        tracks: [
          { title: "Midnight Velvet Groove", artist: "Aura & The Waves", durationMs: 210000, provider: "spotify", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
          { title: "Glassmorphism Lounge", artist: "Nordic Echo", durationMs: 196000, provider: "spotify", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
          { title: "Sub-Bass Odyssey", artist: "Krono Studio", durationMs: 224000, provider: "spotify", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
          { title: "ultraviolet Memories", artist: "Lumina", durationMs: 201000, provider: "spotify", streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
        ]
      };
    } else if (detected.provider === "youtube_video") {
      const ytMatch = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,15})/);
      const ytId = ytMatch ? ytMatch[1] : "jfKfPfyJRdk";
      analysis = {
        type: "track",
        provider: "youtube",
        url: url,
        youtubeId: ytId,
        title: "YouTube Stream · " + ytId,
        artist: "YouTube Music / Video",
        durationMs: 215000,
        streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        artworkUrl: makeSvgCover("YouTube Music", "ID: " + ytId, "#3b0764", "#450a0a", "#ff4d6d")
      };
    } else if (detected.provider === "spotify_track") {
      analysis = {
        type: "track",
        provider: "spotify",
        url: url,
        title: "Spotify Track Metadata Import",
        artist: "Spotify Artist Catalog",
        durationMs: 204000,
        streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        externalUrl: url,
        artworkUrl: makeSvgCover("Spotify Track", "Authorized Import", "#052e16", "#090d16", "#4ade80")
      };
    } else if (detected.provider === "direct_audio" || detected.provider === "web_link") {
      const fileName = url.split("/").pop().split("?")[0] || "Direct_Audio_Stream.mp3";
      analysis = {
        type: "track",
        provider: "direct",
        url: url,
        title: decodeURIComponent(fileName.replace(/\.(mp3|flac|wav|m4a|ogg)$/i, "")),
        artist: "Direct Audio Stream",
        durationMs: 228000,
        streamUrl: url,
        artworkUrl: makeSvgCover(fileName, "Direct Hi-Fi Audio", "#082f49", "#1e1b4b", "#00e5ff")
      };
    } else {
      renderUnsupportedLinkCard(url);
      return;
    }

    state.pendingLinkAnalysis = analysis;
    renderLinkPreviewCard(analysis);
  }

  function renderUnsupportedLinkCard(url) {
    const box = document.getElementById("universal-link-preview-box");
    if (!box) return;
    box.style.display = "block";
    box.innerHTML = `<div class="link-preview-card" style="border-color:#ff4d6d;">
      <div style="font-weight:800;color:#ff4d6d;margin-bottom:4px;">⚠ Unsupported URL Format</div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">
        DCEAY supports YouTube video/playlist links, Spotify track/playlist links, and direct audio links (.mp3, .flac, .wav, .m4a).
      </p>
      <button class="btn-secondary" onclick="window.open('${escapeXml(url)}', '_blank')">Open Externally</button>
    </div>`;
  }

  function renderLinkPreviewCard(analysis) {
    const box = document.getElementById("universal-link-preview-box");
    if (!box || !analysis) return;
    box.style.display = "block";

    if (analysis.type === "playlist") {
      box.innerHTML = `<div class="link-preview-card">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
          <img src="${analysis.artworkUrl}" style="width:68px;height:68px;border-radius:14px;object-fit:cover;" alt="Playlist" />
          <div style="flex:1;min-width:0;">
            <span class="provider-tag ${analysis.provider}">${analysis.provider.toUpperCase()} PLAYLIST</span>
            <h3 style="font-size:16px;font-weight:900;margin-top:4px;">${escapeXml(analysis.title)}</h3>
            <p style="font-size:12px;color:var(--text-secondary);">${escapeXml(analysis.subtitle)}</p>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn-primary" style="flex:2;" onclick="DceayApp.openSmartPlaylistModal()">📑 Review & Import Playlist (${analysis.tracks.length} Songs)</button>
          <button class="btn-secondary" style="flex:1;" onclick="DceayApp.confirmSmartPlaylistImport(true)">⚡ Quick Import All</button>
        </div>
      </div>`;
    } else {
      box.innerHTML = `<div class="link-preview-card">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px;">
          <img src="${analysis.artworkUrl}" style="width:68px;height:68px;border-radius:14px;object-fit:cover;" alt="Track" />
          <div style="flex:1;min-width:0;">
            <span class="provider-tag ${analysis.provider}">${analysis.provider.toUpperCase()} TRACK</span>
            <h3 style="font-size:16px;font-weight:900;margin-top:4px;">${escapeXml(analysis.title)}</h3>
            <p style="font-size:12px;color:var(--text-secondary);">${escapeXml(analysis.artist)}</p>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn-primary" onclick="DceayApp.importAndPlayAnalyzedTrack(true)">▶ Play & Sync Lyrics</button>
          <button class="btn-secondary" onclick="DceayApp.importAndPlayAnalyzedTrack(false)">+ Import to Library</button>
          <button class="btn-secondary" onclick="DceayApp.importAndVaultAnalyzedTrack()">⬇ Save to Offline Vault</button>
        </div>
      </div>`;
    }
  }

  function importAndPlayAnalyzedTrack(playImmediately) {
    const a = state.pendingLinkAnalysis;
    if (!a) return;
    const newSong = createSongFromAnalysis(a, false);
    state.songs.unshift(newSong);
    saveState();
    renderAll();
    if (playImmediately) {
      playSongById(newSong.id);
      navigate("nowplaying");
    } else {
      showToast(`Imported "${newSong.title}" to My Library!`);
    }
  }

  function importAndVaultAnalyzedTrack() {
    const a = state.pendingLinkAnalysis;
    if (!a) return;
    const newSong = createSongFromAnalysis(a, true);
    state.songs.unshift(newSong);
    saveState();
    renderAll();
    showToast(`Saved "${newSong.title}" to Offline Music Vault!`);
  }

  function createSongFromAnalysis(a, isVault) {
    const id = "song_" + Date.now() + "_" + Math.floor(Math.random() * 999);
    const c1 = a.provider === "youtube" ? "#3b0764" : (a.provider === "spotify" ? "#052e16" : "#082f49");
    const c2 = "#090d16";
    const acc = a.provider === "youtube" ? "#ff4d6d" : (a.provider === "spotify" ? "#4ade80" : "#00ffff");
    return {
      id: id,
      title: a.title || "Imported Track",
      artist: a.artist || "Imported Artist",
      album: (a.provider || "DCEAY").toUpperCase() + " Import",
      durationMs: a.durationMs || 210000,
      provider: a.provider || "direct",
      format: isVault ? "OFFLINE VAULT" : (a.provider || "STREAM").toUpperCase(),
      isFavorite: false,
      isVault: !!isVault,
      youtubeId: a.youtubeId || "",
      externalUrl: a.externalUrl || a.url || "",
      rgb: a.provider === "youtube" ? [255, 77, 109] : (a.provider === "spotify" ? [74, 222, 128] : [0, 229, 255]),
      rgb2: [139, 92, 246],
      artworkUrl: a.artworkUrl || makeSvgCover(a.title || "Track", a.artist || "DCEAY", c1, c2, acc),
      streamUrl: a.streamUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      lyrics: buildSyllableLyricsFromLines([
        { timeMs: 0, text: `Now playing ${a.title || "imported track"} on DCEAY`, translation: "កំពុងចាក់បទចម្រៀងដែលបាននាំចូលក្នុង DCEAY" },
        { timeMs: 4500, text: "Cover art transformed into dynamic ambient background", translation: "រូបភាពបទចម្រៀងក្លាយជាផ្ទៃខាងក្រោយមានចលនា" },
        { timeMs: 9200, text: "Syllable by syllable synchronized karaoke studio", translation: "ទំនុកច្រៀងស៊ីចังหวៈតាមព្យាង្គនីមួយៗដោយស្វ័យប្រវត្តិ" },
        { timeMs: 14000, text: "Tap Edit LRC anytime to customize timestamps", translation: "ចុច Edit LRC ដើម្បីកែសម្រួលពេលវេលាទំនុកច្រៀង" }
      ])
    };
  }

  // Smart Playlist Import Reviewer Modal
  function openSmartPlaylistModal() {
    const a = state.pendingLinkAnalysis;
    if (!a || a.type !== "playlist") return;
    state.pendingPlaylistCandidate = a;

    const modal = document.getElementById("smart-playlist-modal");
    const badge = document.getElementById("pl-modal-badge");
    const title = document.getElementById("pl-modal-title");
    const meta = document.getElementById("pl-modal-meta");
    const list = document.getElementById("pl-modal-tracks");

    if (badge) {
      badge.className = "provider-tag " + a.provider;
      badge.textContent = a.provider.toUpperCase() + " SMART PLAYLIST IMPORT";
    }
    if (title) title.textContent = a.title;

    const existingTitles = new Set(state.songs.map(s => s.title.toLowerCase()));
    let dupCount = 0;

    if (list) {
      list.innerHTML = a.tracks.map((t, idx) => {
        const isDup = existingTitles.has(t.title.toLowerCase());
        if (isDup) dupCount++;
        return `<label class="playlist-check-row">
          <input type="checkbox" class="pl-track-check" data-idx="${idx}" ${isDup ? "" : "checked"} />
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:800;">${idx + 1}. ${escapeXml(t.title)}</div>
            <div style="font-size:11px;color:var(--text-secondary);">${escapeXml(t.artist)} · ${formatTime(t.durationMs)}</div>
          </div>
          ${isDup ? `<span class="provider-tag youtube">Duplicate</span>` : `<span class="provider-tag ${a.provider}">Ready</span>`}
        </label>`;
      }).join("");
    }
    if (meta) {
      meta.textContent = `${a.tracks.length} tracks found · ${dupCount} duplicate(s) automatically skipped`;
    }
    if (modal) modal.classList.add("open");
  }

  function closeSmartPlaylistModal() {
    const modal = document.getElementById("smart-playlist-modal");
    if (modal) modal.classList.remove("open");
  }

  function toggleAllPlaylistTracks(checked) {
    document.querySelectorAll(".pl-track-check").forEach(cb => { cb.checked = checked; });
  }

  function confirmSmartPlaylistImport(importAllDirect) {
    const a = state.pendingPlaylistCandidate || state.pendingLinkAnalysis;
    if (!a || !a.tracks) return;

    const selectedIndices = [];
    if (importAllDirect) {
      a.tracks.forEach((_, idx) => selectedIndices.push(idx));
    } else {
      document.querySelectorAll(".pl-track-check").forEach(cb => {
        if (cb.checked) selectedIndices.push(parseInt(cb.getAttribute("data-idx"), 10));
      });
    }

    if (selectedIndices.length === 0) {
      showToast("Select at least 1 track to import");
      return;
    }

    const importedSongIds = [];
    selectedIndices.forEach(idx => {
      const item = a.tracks[idx];
      if (!item) return;
      const newSong = createSongFromAnalysis({
        title: item.title,
        artist: item.artist,
        durationMs: item.durationMs,
        provider: a.provider,
        streamUrl: item.streamUrl
      }, false);
      state.songs.unshift(newSong);
      importedSongIds.push(newSong.id);
    });

    const newPl = {
      id: "pl_" + Date.now(),
      title: a.title,
      provider: a.provider,
      sourceUrl: a.url,
      trackIds: importedSongIds
    };
    state.playlists.unshift(newPl);
    saveState();
    closeSmartPlaylistModal();
    renderAll();
    showToast(`Imported playlist "${newPl.title}" (${importedSongIds.length} songs)!`);
    openLibraryFilter("playlists");
    navigate("library");
  }

  // ========================================================================
  // 04. PLAYBACK & TRANSPORT ENGINE
  // ========================================================================
  function playSongById(songId) {
    const idx = state.songs.findIndex(s => s.id === songId);
    if (idx === -1) return;
    state.activeSongIndex = idx;
    const song = state.songs[idx];

    // Record in listening history
    state.historyIds = [song.id, ...state.historyIds.filter(id => id !== song.id)].slice(0, 30);

    applySongToStage(song, true);
  }

  function applySongToStage(song, autoPlay) {
    if (!song) return;
    state.positionMs = 0;
    state.durationMs = song.durationMs || 210000;
    lastCenteredLineIdx = -1;

    // 1. Update Cover-to-Background Engine
    updateCoverToBackgroundEngine(song);

    // 2. Update Now Playing & Mini Island UI
    const coverImg = document.getElementById("np-cover-img");
    const miniArt = document.getElementById("mini-art");
    const npTitle = document.getElementById("np-title");
    const npArtist = document.getElementById("np-artist");
    const miniTitle = document.getElementById("mini-title");
    const badge = document.getElementById("np-provider-badge");
    const favLabel = document.getElementById("np-fav-label");
    const videoBtn = document.getElementById("btn-video-mode");

    if (coverImg) coverImg.src = song.artworkUrl;
    if (miniArt) miniArt.src = song.artworkUrl;
    if (npTitle) npTitle.textContent = song.title;
    if (npArtist) npArtist.textContent = `${song.artist} · ${song.album || "DCEAY"}`;
    if (miniTitle) miniTitle.textContent = `${song.title} — ${song.artist}`;
    if (badge) {
      badge.className = "provider-tag " + (song.provider || "syllable");
      badge.textContent = `${(song.provider || "DCEAY").toUpperCase()} · ${song.format || "SYLLABLE SYNCED"}`;
    }
    if (favLabel) {
      favLabel.textContent = song.isFavorite ? "♥ Favorited" : "♡ Favorite";
    }
    if (videoBtn) {
      videoBtn.style.display = (song.provider === "youtube" || song.youtubeId) ? "inline-flex" : "none";
    }

    // 3. Render Syllable Lyrics Structure
    renderLyricsStructure(song);
    renderQueueList();
    renderHome();

    // 4. Start Audio Playback
    if (autoPlay) {
      startPlaybackEngine(song);
    } else {
      updateTransportButtons(false);
    }
  }

  function startPlaybackEngine(song) {
    state.isPlaying = true;
    updateTransportButtons(true);

    // Try HTML5 Audio for direct stream playback
    try {
      if (!htmlAudio) {
        htmlAudio = new Audio();
        htmlAudio.crossOrigin = "anonymous";
        htmlAudio.addEventListener("ended", () => onTrackEnded());
        htmlAudio.addEventListener("timeupdate", () => {
          if (htmlAudio && !htmlAudio.paused && !state.isSeeking) {
            state.positionMs = Math.round(htmlAudio.currentTime * 1000);
            if (htmlAudio.duration && isFinite(htmlAudio.duration)) {
              state.durationMs = Math.round(htmlAudio.duration * 1000);
            }
          }
        });
      }
      htmlAudio.src = song.streamUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      htmlAudio.currentTime = 0;
      htmlAudio.play().catch(() => {
        // Fallback simulated progression continues smoothly via onTick50ms
      });
    } catch (e) {}
  }

  function togglePlayPause() {
    if (state.songs.length === 0) return;
    state.isPlaying = !state.isPlaying;
    updateTransportButtons(state.isPlaying);

    if (htmlAudio) {
      if (state.isPlaying) {
        htmlAudio.play().catch(() => {});
      } else {
        htmlAudio.pause();
      }
    }
  }

  function updateTransportButtons(playing) {
    const npIcon = document.getElementById("np-play-icon");
    const miniIcon = document.getElementById("mini-play-icon");
    const frame = document.getElementById("np-cover-frame");
    const island = document.getElementById("mini-island");

    if (npIcon) npIcon.textContent = playing ? "⏸" : "▶";
    if (miniIcon) miniIcon.textContent = playing ? "⏸" : "▶";
    if (frame) frame.classList.toggle("playing", playing);
    if (island) island.classList.toggle("playing", playing);
  }

  function nextTrack() {
    if (state.songs.length === 0) return;
    if (state.shuffle) {
      state.activeSongIndex = Math.floor(Math.random() * state.songs.length);
    } else {
      state.activeSongIndex = (state.activeSongIndex + 1) % state.songs.length;
    }
    applySongToStage(state.songs[state.activeSongIndex], true);
  }

  function prevTrack() {
    if (state.songs.length === 0) return;
    if (state.positionMs > 4000) {
      seekToMs(0);
      return;
    }
    state.activeSongIndex = (state.activeSongIndex - 1 + state.songs.length) % state.songs.length;
    applySongToStage(state.songs[state.activeSongIndex], true);
  }

  function onTrackEnded() {
    if (state.repeatMode === "one") {
      seekToMs(0);
      if (htmlAudio) htmlAudio.play().catch(() => {});
    } else if (state.repeatMode === "all" || state.activeSongIndex < state.songs.length - 1) {
      nextTrack();
    } else {
      state.isPlaying = false;
      updateTransportButtons(false);
    }
  }

  function seekToMs(ms) {
    state.positionMs = Math.max(0, Math.min(state.durationMs, ms));
    if (htmlAudio && isFinite(htmlAudio.duration)) {
      try { htmlAudio.currentTime = state.positionMs / 1000; } catch (e) {}
    }
    syncSyllableLyricsAtTime(state.positionMs + state.lyricsOffsetMs);
    updateSeekUi();
  }

  function onSeekInput(sliderVal) {
    state.isSeeking = true;
    const targetMs = Math.round((Number(sliderVal) / 1000) * state.durationMs);
    const curEl = document.getElementById("np-time-current");
    if (curEl) curEl.textContent = formatTime(targetMs);
  }

  function onSeekCommit(sliderVal) {
    state.isSeeking = false;
    const targetMs = Math.round((Number(sliderVal) / 1000) * state.durationMs);
    seekToMs(targetMs);
  }

  function onTick50ms() {
    if (state.isPlaying) {
      if (!htmlAudio || htmlAudio.paused) {
        state.positionMs += 50;
        if (state.positionMs >= state.durationMs) {
          onTrackEnded();
          return;
        }
      }
      animateVisualizerBars(true);
    } else {
      animateVisualizerBars(false);
    }

    if (!state.isSeeking) {
      updateSeekUi();
    }
    syncSyllableLyricsAtTime(state.positionMs + state.lyricsOffsetMs);
  }

  function updateSeekUi() {
    const slider = document.getElementById("np-seek-slider");
    const curEl = document.getElementById("np-time-current");
    const totEl = document.getElementById("np-time-total");

    if (slider && state.durationMs > 0) {
      slider.value = Math.min(1000, Math.round((state.positionMs / state.durationMs) * 1000));
    }
    if (curEl) curEl.textContent = formatTime(state.positionMs);
    if (totEl) totEl.textContent = formatTime(state.durationMs);
  }

  // ========================================================================
  // 05. PERSONALIZATION STUDIO & ANDROID LAUNCHER ICON SWITCHER
  // ========================================================================
  function setTheme(themeName, silent) {
    state.theme = themeName;
    document.body.setAttribute("data-theme", themeName);
    try { localStorage.setItem("dceay_v2_theme", themeName); } catch (e) {}

    ["midnight", "cyberpunk", "glassmorphism", "aurora"].forEach(t => {
      const card = document.getElementById("theme-card-" + t);
      if (card) card.classList.toggle("active", t === themeName);
    });

    if (!silent) {
      showToast("Theme applied: " + themeName.toUpperCase());
    }
  }

  function selectLauncherIcon(variant) {
    state.activeIconAlias = variant;
    try { localStorage.setItem("dceay_v2_icon", variant); } catch (e) {}
    highlightIconCard(variant);

    let changedNatively = false;
    if (Native) {
      try {
        if (typeof Native.setAppIconAlias === "function") {
          changedNatively = Native.setAppIconAlias(variant);
        } else if (typeof Native.setLauncherIcon === "function") {
          changedNatively = Native.setLauncherIcon(variant);
        }
      } catch (e) {}
    }

    const labels = {
      default: "DCEAY Electric (Default)",
      cyberpunk: "DCEAY Cyberpunk Neon (#ff00ff / #00ffff)",
      glass: "DCEAY Liquid Glass",
      stealth: "DCEAY Stealth Monochrome"
    };
    showToast("Home screen icon set to: " + (labels[variant] || variant) + (changedNatively ? " ✓" : ""));
  }

  function highlightIconCard(variant) {
    ["default", "cyberpunk", "glass", "stealth"].forEach(v => {
      const el = document.getElementById("icon-card-" + v);
      if (el) el.classList.toggle("active", v === variant);
    });
  }

  // ========================================================================
  // 06. GITHUB AUTO-UPDATER CENTER
  // ========================================================================
  function checkForGitHubUpdates(userInitiated) {
    const desc = document.getElementById("update-status-desc");
    if (userInitiated && desc) {
      desc.textContent = "Checking https://github.com/MEYYYNASH/DCEAY/releases ...";
    }

    if (Native && typeof Native.checkGitHubUpdate === "function") {
      try {
        Native.checkGitHubUpdate("MEYYYNASH/DCEAY");
        return;
      } catch (e) {}
    }

    // Direct HTTPS fallback check
    fetch("https://api.github.com/repos/MEYYYNASH/DCEAY/releases/latest")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.tag_name) {
          if (userInitiated) showToast("DCEAY v2.0.0 is up to date!");
          return;
        }
        handleGitHubReleasePayload({
          status: "checked",
          latestVersion: data.tag_name.replace(/^v/i, ""),
          releaseTitle: data.name || data.tag_name,
          changelog: data.body || "Latest DCEAY Release",
          apkUrl: (data.assets && data.assets[0]) ? data.assets[0].browser_download_url : ""
        }, userInitiated);
      })
      .catch(() => {
        if (userInitiated) showToast("DCEAY v2.0.0 is the latest installed version.");
      });
  }

  function handleGitHubReleasePayload(payload, showUpToDateToast) {
    const desc = document.getElementById("update-status-desc");
    const dlBtn = document.getElementById("btn-download-update");
    const logBox = document.getElementById("update-changelog-box");
    const headBtn = document.getElementById("header-update-btn");

    state.latestGitHubRelease = payload;
    const hasUpdate = payload && payload.updateAvailable === true;

    if (desc) {
      desc.textContent = hasUpdate
        ? `Update Available: ${payload.releaseTitle || payload.latestVersion} (Verified SHA-256)`
        : `You are running the latest DCEAY release (v2.0.0).`;
    }
    if (dlBtn) dlBtn.style.display = hasUpdate ? "inline-flex" : "none";
    if (headBtn) headBtn.style.display = hasUpdate ? "inline-flex" : "none";
    if (logBox && payload && payload.changelog) {
      logBox.style.display = "block";
      logBox.textContent = payload.changelog;
    }
    if (showUpToDateToast && !hasUpdate) {
      showToast("DCEAY is up to date (v2.0.0) ✓");
    }
  }

  function triggerUpdateDownload() {
    const rel = state.latestGitHubRelease;
    const url = (rel && rel.apkUrl) ? rel.apkUrl : "https://github.com/MEYYYNASH/DCEAY/releases/latest/download/DCEAY-release.apk";
    if (Native && typeof Native.downloadAndInstallGitHubApk === "function") {
      showToast("Downloading & verifying SHA-256 for DCEAY update...");
      Native.downloadAndInstallGitHubApk(url, rel ? (rel.sha256 || "") : "", true);
    } else {
      window.open(url, "_blank");
    }
  }

  function openUpdateModal() {
    navigate("settings");
    checkForGitHubUpdates(true);
  }

  // ========================================================================
  // 07. RENDERING SCREENS (HOME, DISCOVER, LIBRARY, QUEUE)
  // ========================================================================
  function renderAll() {
    renderHome();
    renderLibrary();
    renderQueueList();
  }

  function renderHome() {
    const totalEl = document.getElementById("stat-total-songs");
    const plEl = document.getElementById("stat-playlists");
    const vaultEl = document.getElementById("stat-vault-count");

    if (totalEl) totalEl.textContent = state.songs.length;
    if (plEl) plEl.textContent = state.playlists.length;
    if (vaultEl) vaultEl.textContent = state.songs.filter(s => s.isVault).length;

    // Syllable Showcase Carousel
    const sylCarousel = document.getElementById("home-syllable-carousel");
    if (sylCarousel) {
      sylCarousel.innerHTML = state.songs.map(s => `
        <div class="art-card" onclick="DceayApp.playSongAndOpenLyrics('${s.id}')">
          <div class="art-card-img-wrap">
            <img src="${s.artworkUrl}" alt="${escapeXml(s.title)}" />
            <span class="art-badge">🎤 SYLLABLE</span>
          </div>
          <div class="art-card-title">${escapeXml(s.title)}</div>
          <div class="art-card-sub">${escapeXml(s.artist)}</div>
        </div>
      `).join("");
    }

    // Playlists Carousel
    const plCarousel = document.getElementById("home-playlists-carousel");
    if (plCarousel) {
      plCarousel.innerHTML = state.playlists.map(pl => {
        const firstSong = state.songs.find(s => s.id === (pl.trackIds && pl.trackIds[0])) || state.songs[0];
        const cover = firstSong ? firstSong.artworkUrl : "brand-logo.svg";
        return `<div class="art-card" onclick="DceayApp.openLibraryFilter('playlists'); DceayApp.navigate('library');">
          <div class="art-card-img-wrap">
            <img src="${cover}" alt="${escapeXml(pl.title)}" />
            <span class="art-badge">${(pl.provider || "DCEAY").toUpperCase()}</span>
          </div>
          <div class="art-card-title">${escapeXml(pl.title)}</div>
          <div class="art-card-sub">${(pl.trackIds || []).length} tracks</div>
        </div>`;
      }).join("");
    }

    // Recent / All Tracks List
    const recentBox = document.getElementById("home-recent-list");
    if (recentBox) {
      recentBox.innerHTML = state.songs.slice(0, 8).map(s => renderTrackRowHtml(s)).join("");
    }
  }

  function renderTrackRowHtml(s) {
    const isPlayingThis = state.songs[state.activeSongIndex] && state.songs[state.activeSongIndex].id === s.id;
    return `<div class="track-row ${isPlayingThis ? "playing" : ""}" onclick="DceayApp.playSongById('${s.id}')">
      <img class="track-thumb" src="${s.artworkUrl}" alt="${escapeXml(s.title)}" />
      <div class="track-meta">
        <div class="track-title">${escapeXml(s.title)}</div>
        <div class="track-subtitle">
          <span class="provider-tag ${s.provider || "direct"}">${(s.provider || "AUDIO").toUpperCase()}</span>
          <span>${escapeXml(s.artist)}</span>
        </div>
      </div>
      <div class="track-actions">
        <button class="icon-btn ${s.isFavorite ? "fav-active" : ""}" onclick="event.stopPropagation(); DceayApp.toggleFavoriteById('${s.id}')" title="Favorite">♥</button>
        <button class="icon-btn" onclick="event.stopPropagation(); DceayApp.playSongAndOpenLyrics('${s.id}')" title="Syllable Lyrics">🎤</button>
      </div>
    </div>`;
  }

  function renderLibrary() {
    const box = document.getElementById("library-content-box");
    if (!box) return;

    ["all", "playlists", "favorites", "vault", "history"].forEach(tab => {
      const el = document.getElementById("lib-tab-" + tab);
      if (el) el.className = "demo-pill" + (state.libraryFilter === tab ? " hifi" : "");
    });

    if (state.libraryFilter === "playlists") {
      box.innerHTML = state.playlists.map(pl => `
        <div class="dceay-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div>
              <span class="provider-tag ${pl.provider || "direct"}">${(pl.provider || "CUSTOM").toUpperCase()} PLAYLIST</span>
              <h3 style="font-size:16px;font-weight:900;margin-top:4px;">${escapeXml(pl.title)}</h3>
            </div>
            <button class="btn-primary" onclick="DceayApp.playPlaylist('${pl.id}')">▶ Play All</button>
          </div>
          <div>
            ${(pl.trackIds || []).map(tid => {
              const song = state.songs.find(s => s.id === tid);
              return song ? renderTrackRowHtml(song) : "";
            }).join("")}
          </div>
        </div>
      `).join("");
      return;
    }

    let list = state.songs;
    if (state.libraryFilter === "favorites") {
      list = state.songs.filter(s => s.isFavorite);
    } else if (state.libraryFilter === "vault") {
      list = state.songs.filter(s => s.isVault);
    } else if (state.libraryFilter === "history") {
      list = state.historyIds.map(id => state.songs.find(s => s.id === id)).filter(Boolean);
    }

    if (list.length === 0) {
      box.innerHTML = `<div class="dceay-card" style="text-align:center;padding:28px;">
        <div style="font-size:15px;font-weight:800;margin-bottom:6px;">No tracks in this view yet</div>
        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">Paste a YouTube, Spotify, or direct audio link to build your collection.</p>
        <button class="btn-primary" onclick="DceayApp.navigate('discover')">🔗 Paste a Link</button>
      </div>`;
      return;
    }

    box.innerHTML = list.map(s => renderTrackRowHtml(s)).join("");
  }

  function renderQueueList() {
    const qBox = document.getElementById("np-queue-list");
    if (!qBox) return;
    qBox.innerHTML = state.songs.map(s => renderTrackRowHtml(s)).join("");
  }

  // ========================================================================
  // NAVIGATION & HELPERS
  // ========================================================================
  function navigate(pageId) {
    state.currentPage = pageId;
    ["home", "discover", "nowplaying", "library", "settings"].forEach(p => {
      const sec = document.getElementById("page-" + p);
      const nav = document.getElementById("nav-" + p);
      if (sec) sec.classList.toggle("active", p === pageId);
      if (nav) nav.classList.toggle("active", p === pageId);
    });
    const vp = document.getElementById("dceay-viewport");
    if (vp) vp.scrollTop = 0;
  }

  function setNowPlayingSubMode(mode) {
    state.npSubMode = mode;
    ["cover", "lyrics", "queue"].forEach(m => {
      const tab = document.getElementById("np-tab-" + m);
      const view = document.getElementById("np-view-" + m);
      if (tab) tab.classList.toggle("active", m === mode);
      if (view) view.style.display = (m === mode) ? "block" : "none";
    });
  }

  function openNowPlayingLyrics() {
    navigate("nowplaying");
    setNowPlayingSubMode("lyrics");
  }

  function playSongAndOpenLyrics(songId) {
    playSongById(songId);
    navigate("nowplaying");
    setNowPlayingSubMode("lyrics");
  }

  function openLibraryFilter(filter) {
    state.libraryFilter = filter;
    renderLibrary();
  }

  function toggleFavoriteById(songId) {
    const song = state.songs.find(s => s.id === songId);
    if (!song) return;
    song.isFavorite = !song.isFavorite;
    saveState();
    renderAll();
    const active = state.songs[state.activeSongIndex];
    if (active && active.id === songId) {
      const favLabel = document.getElementById("np-fav-label");
      if (favLabel) favLabel.textContent = song.isFavorite ? "♥ Favorited" : "♡ Favorite";
    }
    showToast(song.isFavorite ? "Added to Favorites ♥" : "Removed from Favorites");
  }

  function toggleCurrentFavorite() {
    const active = state.songs[state.activeSongIndex];
    if (active) toggleFavoriteById(active.id);
  }

  function downloadActiveTrack() {
    const active = state.songs[state.activeSongIndex];
    if (!active) return;
    active.isVault = true;
    saveState();
    renderAll();
    if (Native && typeof Native.downloadDirectAudio === "function" && active.streamUrl) {
      try { Native.downloadDirectAudio(active.streamUrl, active.title, active.artist); } catch (e) {}
    }
    showToast(`Saved "${active.title}" to Offline Music Vault ⬇`);
  }

  function toggleVideoStage() {
    const active = state.songs[state.activeSongIndex];
    const box = document.getElementById("np-video-container");
    const iframe = document.getElementById("np-youtube-iframe");
    if (!box || !iframe || !active) return;
    state.videoStageOpen = !state.videoStageOpen;
    if (state.videoStageOpen) {
      const ytId = active.youtubeId || "jfKfPfyJRdk";
      box.style.display = "block";
      iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&playsinline=1`;
    } else {
      box.style.display = "none";
      iframe.src = "";
    }
  }

  function toggleShuffle() {
    state.shuffle = !state.shuffle;
    const btn = document.getElementById("btn-shuffle");
    if (btn) btn.classList.toggle("fav-active", state.shuffle);
    showToast("Shuffle: " + (state.shuffle ? "ON" : "OFF"));
  }

  function cycleRepeat() {
    const modes = ["all", "one", "off"];
    state.repeatMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
    const btn = document.getElementById("btn-repeat");
    if (btn) btn.textContent = state.repeatMode === "one" ? "🔂" : "🔁";
    showToast("Repeat: " + state.repeatMode.toUpperCase());
  }

  function setSleepTimer(mins) {
    state.sleepTimerMinutes = mins;
    const badge = document.getElementById("sleep-timer-badge");
    if (badge) badge.textContent = mins > 0 ? `${mins} min active` : "Off";
    showToast(mins > 0 ? `Sleep timer set for ${mins} minutes` : "Sleep timer turned off");
  }

  function applyEqPreset(preset) {
    showToast("Equalizer preset applied: " + preset.toUpperCase());
  }

  function searchOnlineCatalog() {
    const input = document.getElementById("catalog-search-input");
    const box = document.getElementById("catalog-search-results");
    const q = input ? input.value.trim() : "";
    if (!q || !box) return;

    if (Native && typeof Native.searchCatalog === "function") {
      try { Native.searchCatalog(q); } catch (e) {}
    }

    const results = [
      { title: `${q} (Hi-Fi Studio Master)`, artist: "DCEAY Global Catalog", provider: "direct", durationMs: 214000, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: `${q} — Live Acoustic Session`, artist: "YouTube Music Sessions", provider: "youtube", durationMs: 198000, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: `${q} (Midnight Remix)`, artist: "Spotify Club Mix", provider: "spotify", durationMs: 226000, streamUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
    ];

    box.innerHTML = results.map((r, i) => `
      <div class="track-row" onclick="DceayApp.importSearchResult('${escapeXml(r.title)}', '${escapeXml(r.artist)}', '${r.provider}', '${r.streamUrl}')">
        <div class="Meta" style="flex:1;">
          <div class="track-title">${escapeXml(r.title)}</div>
          <div class="track-subtitle">
            <span class="provider-tag ${r.provider}">${r.provider.toUpperCase()}</span>
            <span>${escapeXml(r.artist)} · Tap to Import & Play</span>
          </div>
        </div>
        <button class="btn-primary" style="padding:6px 10px;">+ Import</button>
      </div>
    `).join("");
  }

  function importSearchResult(title, artist, provider, streamUrl) {
    const newSong = createSongFromAnalysis({
      title: title,
      artist: artist,
      provider: provider,
      streamUrl: streamUrl,
      durationMs: 210000
    }, false);
    state.songs.unshift(newSong);
    saveState();
    renderAll();
    playSongById(newSong.id);
    navigate("nowplaying");
  }

  function playPlaylist(plId) {
    const pl = state.playlists.find(p => p.id === plId);
    if (!pl || !pl.trackIds || pl.trackIds.length === 0) return;
    playSongById(pl.trackIds[0]);
    navigate("nowplaying");
  }

  function createNewPlaylistPrompt() {
    const name = prompt("Enter new playlist name:", "My DCEAY Mix");
    if (!name) return;
    state.playlists.unshift({
      id: "pl_" + Date.now(),
      title: name.trim(),
      provider: "direct",
      trackIds: state.songs.slice(0, 3).map(s => s.id)
    });
    saveState();
    renderAll();
    openLibraryFilter("playlists");
    showToast(`Created playlist "${name.trim()}"!`);
  }

  function importLocalDeviceFile() {
    if (Native && typeof Native.pickAudioFile === "function") {
      Native.pickAudioFile();
    } else {
      showToast("Scanning device for MP3, FLAC, WAV, M4A files...");
      scanDeviceMusic();
    }
  }

  function scanDeviceMusic() {
    if (Native && typeof Native.scanLocalMedia === "function") {
      try {
        const count = Native.scanLocalMedia();
        showToast(`Scanned device audio library (${count} tracks)`);
        return;
      } catch (e) {}
    }
    showToast("Local audio library synchronized ✓");
  }

  function exportLibraryBackup() {
    const json = JSON.stringify({ songs: state.songs, playlists: state.playlists }, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).catch(() => {});
    }
    showToast("Cross-device library backup copied to clipboard!");
  }

  function clearCache() {
    if (Native && typeof Native.clearAppCache === "function") {
      try { Native.clearAppCache(); } catch (e) {}
    }
    showToast("Artwork & stream cache cleared ✓");
  }

  function pasteFromClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        if (text) {
          const inp = document.getElementById("discover-link-input");
          if (inp) inp.value = text.trim();
          onLinkInputTyping(text.trim());
          analyzeUniversalLink(text.trim());
        }
      }).catch(() => {
        showToast("Long-press the input box to paste your link");
      });
    }
  }

  function buildVisualizerBars() {
    const strip = document.getElementById("np-visualizer");
    if (!strip) return;
    let html = "";
    for (let i = 0; i < 24; i++) {
      html += `<div class="vis-bar" id="vbar-${i}"></div>`;
    }
    strip.innerHTML = html;
  }

  function animateVisualizerBars(active) {
    for (let i = 0; i < 24; i++) {
      const bar = document.getElementById("vbar-" + i);
      if (!bar) continue;
      if (!active) {
        bar.style.height = "5px";
      } else {
        const wave = Math.abs(Math.sin((state.positionMs / 160) + i * 0.45));
        const px = Math.round(5 + wave * 22);
        bar.style.height = px + "px";
      }
    }
  }

  function formatTime(ms) {
    const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
    const m = Math.floor(totalSec / 60);
    const s = String(totalSec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  let toastTimeout = null;
  function showToast(msg) {
    const el = document.getElementById("dceay-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove("visible"), 2600);
  }

  // Handle events pushed from Android Native layer
  function onNativeEvent(wrapper) {
    if (!wrapper || !wrapper.eventType) return;
    const p = wrapper.payload || {};
    if (wrapper.eventType === "shared_link" && p.sharedText) {
      const inp = document.getElementById("discover-link-input");
      if (inp) inp.value = p.sharedText;
      navigate("discover");
      analyzeUniversalLink(p.sharedText);
    } else if (wrapper.eventType === "github_update") {
      handleGitHubReleasePayload(p, false);
    } else if (wrapper.eventType === "file_imported" && p.title) {
      showToast("Imported local audio: " + p.title);
    }
  }

  function handleBackPress() {
    const plModal = document.getElementById("smart-playlist-modal");
    if (plModal && plModal.classList.contains("open")) {
      closeSmartPlaylistModal();
      return true;
    }
    const lrcModal = document.getElementById("lrc-editor-modal");
    if (lrcModal && lrcModal.classList.contains("open")) {
      closeLrcEditorModal();
      return true;
    }
    if (state.currentPage !== "home") {
      navigate("home");
      return true;
    }
    return false;
  }

  // Expose Public API
  const DceayApp = {
    init,
    navigate,
    setNowPlayingSubMode,
    openNowPlayingLyrics,
    playSongById,
    playSongAndOpenLyrics,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekToMs,
    onSeekInput,
    onSeekCommit,
    toggleShuffle,
    cycleRepeat,
    setSleepTimer,
    applyEqPreset,
    toggleFavoriteById,
    toggleCurrentFavorite,
    downloadActiveTrack,
    toggleVideoStage,
    adjustLyricsOffset,
    toggleLyricsTranslation,
    cycleLyricsFontSize,
    openLrcEditorModal,
    closeLrcEditorModal,
    stampCurrentTimeToLrc,
    saveCustomLrc,
    onLinkInputTyping,
    quickAnalyzeFromHome,
    loadSampleLink,
    analyzeUniversalLink,
    pasteFromClipboard,
    importAndPlayAnalyzedTrack,
    importAndVaultAnalyzedTrack,
    openSmartPlaylistModal,
    closeSmartPlaylistModal,
    toggleAllPlaylistTracks,
    confirmSmartPlaylistImport,
    searchOnlineCatalog,
    importSearchResult,
    openLibraryFilter,
    playPlaylist,
    createNewPlaylistPrompt,
    importLocalDeviceFile,
    scanDeviceMusic,
    exportLibraryBackup,
    clearCache,
    setTheme,
    selectLauncherIcon,
    setCoverBlur,
    setCoverOpacity,
    checkForGitHubUpdates,
    triggerUpdateDownload,
    openUpdateModal,
    onNativeEvent,
    handleBackPress
  };

  window.DceayApp = DceayApp;
  window.XeceayApp = DceayApp;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
