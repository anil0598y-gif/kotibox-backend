/* =========================================================
   LYRICS CONTROLLER
   1. Pehle database me check karega (songId se)
   2. Phir lrclib.net se fetch karega
========================================================= */

const https = require("https");
const Song = require("../models/Song");

/* =========================================================
   HELPER — Fetch from URL
========================================================= */

const fetchFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Kotibox/1.0" } }, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (error) {
            resolve({ status: res.statusCode, data: null });
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

/* =========================================================
   GET LYRICS — /api/lyrics?title=...&artist=...&songId=...
========================================================= */

exports.getLyrics = async (req, res) => {
  try {
    const { title, artist, songId } = req.query;

    /* =====================================================
       STEP 1: Database check karo
    ===================================================== */

    if (songId) {
      try {
        const song = await Song.findById(songId).lean();

        if (song && (song.lyrics || song.syncedLyrics)) {
          console.log(`✅ Lyrics found in DB: ${song.title}`);

          return res.json({
            success: true,
            source: "database",
            trackName: song.title,
            artistName: song.artist,
            albumName: song.album || "",
            duration: song.duration || "",
            syncedLyrics: song.syncedLyrics || "",
            plainLyrics: song.lyrics || "",
          });
        }
      } catch (dbError) {
        console.error("⚠️ DB lyrics check error:", dbError.message);
      }
    }

    /* =====================================================
       STEP 2: lrclib.net API
    ===================================================== */

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const cleanTitle = String(title).trim();
    const cleanArtist = String(artist || "").trim();

    let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(
      cleanTitle
    )}`;

    if (cleanArtist) {
      url += `&artist_name=${encodeURIComponent(cleanArtist)}`;
    }

    console.log(`🎤 Fetching lyrics: ${cleanTitle}`);

    const result = await fetchFromUrl(url);

    if (result.status === 200 && result.data) {
      return res.json({
        success: true,
        source: "lrclib",
        id: result.data.id,
        trackName: result.data.trackName,
        artistName: result.data.artistName,
        albumName: result.data.albumName,
        duration: result.data.duration,
        syncedLyrics: result.data.syncedLyrics || "",
        plainLyrics: result.data.plainLyrics || "",
      });
    }

    // Search fallback
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(
      cleanTitle + " " + cleanArtist
    )}`;

    const searchResult = await fetchFromUrl(searchUrl);

    if (
      searchResult.status === 200 &&
      Array.isArray(searchResult.data) &&
      searchResult.data.length > 0
    ) {
      const best = searchResult.data[0];

      return res.json({
        success: true,
        source: "lrclib-search",
        id: best.id,
        trackName: best.trackName,
        artistName: best.artistName,
        albumName: best.albumName,
        duration: best.duration,
        syncedLyrics: best.syncedLyrics || "",
        plainLyrics: best.plainLyrics || "",
      });
    }

    console.log(`❌ Lyrics not found: ${cleanTitle}`);

    return res.status(404).json({
      success: false,
      message: "Lyrics not available for this song",
    });
  } catch (error) {
    console.error("❌ Lyrics fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lyrics",
    });
  }
};

/* =========================================================
   SEARCH LYRICS
========================================================= */

exports.searchLyrics = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(
      String(q).trim()
    )}`;

    const result = await fetchFromUrl(searchUrl);

    if (result.status === 200 && Array.isArray(result.data)) {
      return res.json({
        success: true,
        count: result.data.length,
        results: result.data.slice(0, 20).map((item) => ({
          id: item.id,
          trackName: item.trackName,
          artistName: item.artistName,
          albumName: item.albumName,
          duration: item.duration,
          hasSyncedLyrics: Boolean(item.syncedLyrics),
          hasPlainLyrics: Boolean(item.plainLyrics),
        })),
      });
    }

    return res.json({ success: true, count: 0, results: [] });
  } catch (error) {
    console.error("❌ Lyrics search error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to search lyrics",
    });
  }
};