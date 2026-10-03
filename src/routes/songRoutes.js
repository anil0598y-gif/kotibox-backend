const express = require("express");
const fs = require("fs");
const path = require("path");
const https = require("https");

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
   ✅ DOWNLOAD SONG — Proper File Download (Cloudinary proxy)
   ⚠️ Ye route /:id se PEHLE hona chahiye
========================================================================== */

router.get(
  "/download/:songId",
  verifyUserToken,
  checkPlan("download"),
  async (req, res) => {
    try {
      const song = await Song.findById(req.params.songId);

      if (!song || !song.audioUrl) {
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

      // ✅ File name banao (browser ke liye)
      const fileName = `${song.title} - ${
        song.artist || "Unknown"
      }.mp3`.replace(/[/\\?%*:|"<>]/g, "-");

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}"`
      );
      res.setHeader("Content-Type", "audio/mpeg");

      const audioUrl = song.audioUrl;
      console.log("🔍 Download URL:", audioUrl);

      /* =========================================
         ✅ LOCAL FILE — /uploads/songs/xxx.mp3
      ========================================= */
      if (audioUrl.startsWith("/")) {
        const localPath = path.join(
          __dirname,
          "..",
          "public",
          audioUrl
        );

        console.log("📁 Local path:", localPath);

        if (fs.existsSync(localPath)) {
          return fs.createReadStream(localPath).pipe(res);
        } else {
          console.error("❌ Local file not found:", localPath);
          return res.status(404).json({
            success: false,
            message: "Audio file not found on server",
          });
        }
      }

      /* =========================================
         ✅ REMOTE FILE — Cloudinary / HTTP URL
         Proxy karo taaki browser download kare
      ========================================= */
      if (audioUrl.startsWith("http")) {
        console.log("🌐 Proxying from:", audioUrl);

        return https
          .get(audioUrl, (fileRes) => {
            console.log(
              "✅ Cloudinary response status:",
              fileRes.statusCode
            );

            if (fileRes.statusCode !== 200) {
              return res.status(404).json({
                success: false,
                message: "Failed to fetch audio from Cloudinary",
              });
            }

            // ✅ Cloudinary headers forward karo
            if (fileRes.headers["content-type"]) {
              res.setHeader(
                "Content-Type",
                fileRes.headers["content-type"]
              );
            }

            if (fileRes.headers["content-length"]) {
              res.setHeader(
                "Content-Length",
                fileRes.headers["content-length"]
              );
            }

            fileRes.pipe(res);
          })
          .on("error", (err) => {
            console.error("❌ Proxy error:", err);
            res.status(500).json({
              success: false,
              message: "Download failed — " + err.message,
            });
          });
      }

      return res.status(404).json({
        success: false,
        message: "Invalid audio URL",
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