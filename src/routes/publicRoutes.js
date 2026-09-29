const express = require("express");
const router = express.Router();
const publicController = require("../controllers/publicController");

/* =========================================================
   PUBLIC ROUTES — No authentication required
========================================================= */

// Get single public song
router.get("/songs/:id", publicController.getPublicSong);

// Get artist songs
router.get("/artist/:artistName", publicController.getPublicArtistSongs);

// Get trending songs
router.get("/trending", publicController.getPublicTrending);

module.exports = router;