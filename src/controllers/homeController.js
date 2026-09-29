const Song = require("../models/Song");

/* =========================================================
   TRENDING NOW — Top N most played songs
   Query: ?limit=50 (default 50, max 100)
========================================================= */

exports.getTrending = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const songs = await Song.find({
      status: "Published",
      visibility: "Public",
    })
      .sort({ plays: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: songs.length,
      limit,
      songs,
    });
  } catch (error) {
    console.error("❌ Trending error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending songs",
    });
  }
};

/* =========================================================
   NEW RELEASES — Latest 10 uploaded songs
========================================================= */

exports.getNewReleases = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    const songs = await Song.find({
      status: "Published",
      visibility: "Public",
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("❌ New releases error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch new releases",
    });
  }
};

/* =========================================================
   TOP ARTISTS — Top 10 artists by total plays
========================================================= */

exports.getTopArtists = async (req, res) => {
  try {
    const artists = await Song.aggregate([
      {
        $match: {
          status: "Published",
          visibility: "Public",
          artist: { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$artist",
          name: { $first: "$artist" },
          totalPlays: { $sum: "$plays" },
          songCount: { $sum: 1 },
          imageUrl: { $first: "$imageUrl" },
        },
      },
      { $sort: { totalPlays: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      count: artists.length,
      artists,
    });
  } catch (error) {
    console.error("❌ Top artists error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top artists",
    });
  }
};

/* =========================================================
   JUMP BACK IN — Recently played / recently updated
========================================================= */

exports.getJumpBackIn = async (req, res) => {
  try {
    const songs = await Song.find({
      status: "Published",
      visibility: "Public",
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("❌ Jump back in error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch songs",
    });
  }
};

/* =========================================================
   MADE FOR YOU — Personalized suggestions
========================================================= */

exports.getMadeForYou = async (req, res) => {
  try {
    const songs = await Song.find({
      status: "Published",
      visibility: "Public",
    })
      .sort({ plays: -1 })
      .skip(10)
      .limit(10)
      .lean();

    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("❌ Made for you error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch songs",
    });
  }
};

/* =========================================================
   RECOMMENDED — Based on liked songs
========================================================= */

exports.getRecommended = async (req, res) => {
  try {
    const songs = await Song.find({
      status: "Published",
      visibility: "Public",
    })
      .sort({ createdAt: -1 })
      .skip(10)
      .limit(10)
      .lean();

    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("❌ Recommended error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
    });
  }
};

/* =========================================================
   EDITOR'S PICKS — Featured / Hand-picked songs
========================================================= */

exports.getEditorsPicks = async (req, res) => {
  try {
    const songs = await Song.find({
      status: "Published",
      visibility: "Public",
    })
      .sort({ plays: -1 })
      .skip(20)
      .limit(10)
      .lean();

    res.json({
      success: true,
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("❌ Editors picks error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch editor's picks",
    });
  }
};

/* =========================================================
   TOP MIXES — Genre-based mixes
========================================================= */

exports.getTopMixes = async (req, res) => {
  try {
    const mixes = await Song.aggregate([
      {
        $match: {
          status: "Published",
          visibility: "Public",
          genre: { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$genre",
          name: { $first: "$genre" },
          songCount: { $sum: 1 },
          imageUrl: { $first: "$imageUrl" },
        },
      },
      { $match: { songCount: { $gte: 3 } } },
      { $sort: { songCount: -1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      count: mixes.length,
      mixes,
    });
  } catch (error) {
    console.error("❌ Top mixes error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top mixes",
    });
  }
};

/* =========================================================
   ALL HOME DATA — Single request me sab kuch
========================================================= */

exports.getAllHomeData = async (req, res) => {
  try {
    const [
      trending,
      newReleases,
      topArtists,
      jumpBackIn,
      madeForYou,
      recommended,
      editorsPicks,
      topMixes,
    ] = await Promise.all([
      Song.find({ status: "Published", visibility: "Public" })
        .sort({ plays: -1, createdAt: -1 })
        .limit(10)
        .lean(),

      Song.find({ status: "Published", visibility: "Public" })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      Song.aggregate([
        {
          $match: {
            status: "Published",
            visibility: "Public",
            artist: { $ne: "" },
          },
        },
        {
          $group: {
            _id: "$artist",
            name: { $first: "$artist" },
            totalPlays: { $sum: "$plays" },
            songCount: { $sum: 1 },
            imageUrl: { $first: "$imageUrl" },
          },
        },
        { $sort: { totalPlays: -1 } },
        { $limit: 10 },
      ]),

      Song.find({ status: "Published", visibility: "Public" })
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),

      Song.find({ status: "Published", visibility: "Public" })
        .sort({ plays: -1 })
        .skip(10)
        .limit(10)
        .lean(),

      Song.find({ status: "Published", visibility: "Public" })
        .sort({ createdAt: -1 })
        .skip(10)
        .limit(10)
        .lean(),

      Song.find({ status: "Published", visibility: "Public" })
        .sort({ plays: -1 })
        .skip(20)
        .limit(10)
        .lean(),

      Song.aggregate([
        {
          $match: {
            status: "Published",
            visibility: "Public",
            genre: { $ne: "" },
          },
        },
        {
          $group: {
            _id: "$genre",
            name: { $first: "$genre" },
            songCount: { $sum: 1 },
            imageUrl: { $first: "$imageUrl" },
          },
        },
        { $match: { songCount: { $gte: 3 } } },
        { $sort: { songCount: -1 } },
        { $limit: 6 },
      ]),
    ]);

    res.json({
      success: true,
      trending,
      newReleases,
      topArtists,
      jumpBackIn,
      madeForYou,
      recommended,
      editorsPicks,
      topMixes,
    });
  } catch (error) {
    console.error("❌ All home data error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch home data",
    });
  }
};