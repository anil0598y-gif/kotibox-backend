const Song = require("../models/Song");

/* =========================================================
   GET PUBLIC SONG BY ID — No auth required
   GET /api/public/songs/:id
========================================================= */

exports.getPublicSong = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Song ID is required",
      });
    }

    const song = await Song.findOne({
      _id: id,
      status: "Published",
      visibility: "Public",
    })
      .select(
        "title artist album genre language releaseDate duration imageUrl audioUrl plays createdAt"
      )
      .lean();

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found or not public",
      });
    }

    // ✅ Only send limited data (no full audio URL for preview)
    res.json({
      success: true,
      song: {
        _id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        genre: song.genre,
        language: song.language,
        releaseDate: song.releaseDate,
        duration: song.duration,
        imageUrl: song.imageUrl,
        audioUrl: song.audioUrl,
        plays: song.plays,
        createdAt: song.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Public song error:", error.message);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid song ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch song",
    });
  }
};

/* =========================================================
   GET MORE SONGS BY ARTIST — No auth required
   GET /api/public/artist/:artistName
========================================================= */

exports.getPublicArtistSongs = async (req, res) => {
  try {
    const { artistName } = req.params;

    if (!artistName) {
      return res.status(400).json({
        success: false,
        message: "Artist name is required",
      });
    }

    const songs = await Song.find({
      artist: artistName,
      status: "Published",
      visibility: "Public",
    })
      .sort({ plays: -1, createdAt: -1 })
      .limit(10)
      .select(
        "title artist album imageUrl audioUrl plays duration"
      )
      .lean();

    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("❌ Public artist songs error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch artist songs",
    });
  }
};

/* =========================================================
   GET TRENDING PUBLIC SONGS — No auth required
   GET /api/public/trending?limit=10
========================================================= */

exports.getPublicTrending = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const songs = await Song.find({
      status: "Published",
      visibility: "Public",
    })
      .sort({ plays: -1, createdAt: -1 })
      .limit(limit)
      .select(
        "title artist album imageUrl audioUrl plays duration"
      )
      .lean();

    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("❌ Public trending error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending songs",
    });
  }
};