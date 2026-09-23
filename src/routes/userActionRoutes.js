const express = require("express");
const router = express.Router();

const {
  likeSong,
  unlikeSong,
  getLikedSongs,
  addToHistory,
  getHistory,
  clearHistory,
  followArtist,
  unfollowArtist,
  getFollowing,
  createUserPlaylist,
  getUserPlaylists,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  searchSongs,
  getSongsByGenre,
  getSongsByArtist,
  streamSong,
  incrementPlayCount,
  getAllSongs,
  getAllAlbums,
  getAllArtists,
} = require("../controllers/userActionController");

const { verifyUserToken } = require("./userAuthRoutes");

/* =========================================
   ✅ LIKE / UNLIKE
========================================= */
router.post("/like/:songId", verifyUserToken, likeSong);
router.delete("/like/:songId", verifyUserToken, unlikeSong);
router.get("/liked-songs", verifyUserToken, getLikedSongs);

/* =========================================
   ✅ HISTORY
========================================= */
router.post("/history/:songId", verifyUserToken, addToHistory);
router.get("/history", verifyUserToken, getHistory);
router.delete("/history", verifyUserToken, clearHistory);

/* =========================================
   ✅ FOLLOW / UNFOLLOW
========================================= */
router.post("/follow/:artistId", verifyUserToken, followArtist);
router.delete("/follow/:artistId", verifyUserToken, unfollowArtist);
router.get("/following", verifyUserToken, getFollowing);

/* =========================================
   ✅ USER PLAYLISTS
========================================= */
router.post("/playlists", verifyUserToken, createUserPlaylist);
router.get("/playlists", verifyUserToken, getUserPlaylists);
router.put("/playlists/:id", verifyUserToken, updatePlaylist);
router.delete("/playlists/:id", verifyUserToken, deletePlaylist);
router.post("/playlists/:id/add-song", verifyUserToken, addSongToPlaylist);
router.delete(
  "/playlists/:id/remove-song/:songId",
  verifyUserToken,
  removeSongFromPlaylist
);

/* =========================================
   ✅ SONGS
========================================= */
router.get("/songs", getAllSongs);
router.get("/songs/search", searchSongs);
router.get("/songs/genre/:genre", getSongsByGenre);
router.get("/songs/artist/:artistId", getSongsByArtist);
router.get("/songs/:id/stream", streamSong);
router.post("/songs/:id/play", incrementPlayCount);

/* =========================================
   ✅ ALBUMS
========================================= */
router.get("/albums", getAllAlbums);

/* =========================================
   ✅ ARTISTS
========================================= */
router.get("/artists", getAllArtists);

module.exports = router;
