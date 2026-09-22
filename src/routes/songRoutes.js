const express = require("express");

const {
  getSongs,
  getSongById,
  addSong,
  updateSong,
  deleteSong,
} = require("../controllers/songController");

const upload = require("../middleware/upload");

const router = express.Router();

/* ==========================================================================
   SONG UPLOAD FIELDS
   --------------------------------------------------------------------------
   Frontend जो field names भेजता है वही यहाँ होने चाहिए:
   
   - image         (AddSong.jsx — पुराना field name)
   - coverImage    (AddSong.jsx / EditSong.jsx — नया field name)
   - audio         (AddSong.jsx — पुराना)
   - audioFile     (EditSong.jsx — नया)
   - musicVideo
   - lyricVideo
   - lyricsFile
========================================================================== */

const songUpload = upload.fields([
  /* Cover image — दोनों नाम support */
  { name: "image", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },

  /* Audio — दोनों नाम support */
  { name: "audio", maxCount: 1 },
  { name: "audioFile", maxCount: 1 },

  /* Additional media */
  { name: "musicVideo", maxCount: 1 },
  { name: "lyricVideo", maxCount: 1 },
  { name: "lyricsFile", maxCount: 1 },
]);

/* ==========================================================================
   GET ALL SONGS
========================================================================== */

router.get("/", getSongs);

/* ==========================================================================
   GET SINGLE SONG
========================================================================== */

router.get("/:id", getSongById);

/* ==========================================================================
   ADD SONG
========================================================================== */

router.post("/", songUpload, addSong);

/* ==========================================================================
   UPDATE SONG
========================================================================== */

router.put("/:id", songUpload, updateSong);

/* ==========================================================================
   DELETE SONG
========================================================================== */

router.delete("/:id", deleteSong);

module.exports = router;