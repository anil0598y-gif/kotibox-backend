const express = require("express");

const upload = require("../middleware/upload");

const {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
} = require("../controllers/playlistController");

const router = express.Router();

/* =========================================
   GET ALL PLAYLISTS
   GET /api/playlists
========================================= */

router.get("/", getPlaylists);

/* =========================================
   GET SINGLE PLAYLIST
   GET /api/playlists/:id
========================================= */

router.get("/:id", getPlaylistById);

/* =========================================
   CREATE PLAYLIST
   POST /api/playlists
========================================= */

router.post(
  "/",
  upload.single("coverImage"),
  createPlaylist
);

/* =========================================
   UPDATE PLAYLIST
   PUT /api/playlists/:id
========================================= */

router.put(
  "/:id",
  upload.single("coverImage"),
  updatePlaylist
);

/* =========================================
   DELETE PLAYLIST
   DELETE /api/playlists/:id
========================================= */

router.delete(
  "/:id",
  deletePlaylist
);

module.exports = router;
