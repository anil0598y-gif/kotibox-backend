const express = require("express");

const {
  getSongs,
  getSongById,
  addSong,
  updateSong,
  deleteSong,
} = require("../controllers/songController");

const upload = require("../middleware/upload");
const checkPlan = require("../middleware/checkPlan");
const Download = require("../models/Download");
const Song = require("../models/Song");
const User = require("../models/User");
const { verifyUserToken } = require("./userAuthRoutes");

const router = express.Router();

/* ==========================================================================
   SONG UPLOAD FIELDS
========================================================================== */

const songUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
  { name: "audio", maxCount: 1 },
  { name: "audioFile", maxCount: 1 },
  { name: "musicVideo", maxCount: 1 },
  { name: "lyricVideo", maxCount: 1 },
  { name: "lyricsFile", maxCount: 1 },
]);

/* ==========================================================================
   ✅ DOWNLOAD SONG — Basic+ only
   ⚠️ Ye route /:id se PEHLE hona chahiye
========================================================================== */

router.get(
  "/download/:songId",
  verifyUserToken,
  checkPlan("download"),
  async (req, res) => {
    try {
      const song = await Song.findById(req.params.songId);
      if (!song) {
        return res.status(404).json({
          success: false,
          message: "Song not found",
        });
      }

      const user = await User.findById(req.user._id);

      // ✅ Basic plan — 10/month limit
      if (user.plan === "Basic") {
        const monthStart = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        );

        const thisMonthDownloads = await Download.countDocuments({
          userId: user._id,
          downloadedAt: { $gte: monthStart },
        });

        if (thisMonthDownloads >= 10) {
          return res.status(403).json({
            success: false,
            message:
              "Monthly download limit khatam. Upgrade karo!",
            upgradeRequired: true,
          });
        }
      }

      // ✅ Download log karo
      await Download.create({
        userId: user._id,
        songId: song._id,
      });

      res.status(200).json({
        success: true,
        audioUrl: song.audioUrl,
        title: song.title,
        artist: song.artist,
      });
    } catch (err) {
      console.error("DOWNLOAD ERROR:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Download failed",
      });
    }
  }
);

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