const express = require("express");
const router = express.Router();
const lyricsController = require("../controllers/lyricsController");

/* =========================================================
   LYRICS ROUTES
========================================================= */

// Get lyrics: /api/lyrics?title=...&artist=...
router.get("/", lyricsController.getLyrics);

// Search lyrics: /api/lyrics/search?q=...
router.get("/search", lyricsController.searchLyrics);

module.exports = router;