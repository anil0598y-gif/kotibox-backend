const Song = require("../models/Song");
const fs = require("fs");
const path = require("path");

/* --------------------------------------------------------------------------
   DELETE FILE
-------------------------------------------------------------------------- */

const deleteFile = (fileUrl) => {
  try {
    if (!fileUrl) return;

    const cleanPath = String(fileUrl)
      .replace(/^\/+/, "")
      .replace(/^\\+/, "");

    const filePath = path.join(
      __dirname,
      "../../public",
      cleanPath
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ File deleted:", filePath);
    }
  } catch (error) {
    console.error(
      "❌ File delete error:",
      error.message
    );
  }
};

/* --------------------------------------------------------------------------
   CLEANUP UPLOADED FILES
-------------------------------------------------------------------------- */

const cleanupUploadedFiles = (files) => {
  if (!files) return;

  try {
    Object.values(files)
      .flat()
      .forEach((file) => {
        if (!file?.path) return;

        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(
              "🗑️ Uploaded file cleaned:",
              file.path
            );
          }
        } catch (cleanupError) {
          console.error(
            "❌ Cleanup error:",
            cleanupError.message
          );
        }
      });
  } catch (error) {
    console.error(
      "❌ Uploaded files cleanup error:",
      error.message
    );
  }
};

/* --------------------------------------------------------------------------
   FILE URL
   ✅ FIXED — upload.js files ko public/uploads/songs/ me save karta hai,
   isliye URL prefix bhi /uploads/songs/ hona chahiye
-------------------------------------------------------------------------- */

const getFileUrl = (file) => {
  if (!file) return "";
  return `/uploads/songs/${file.filename}`;
};

/* --------------------------------------------------------------------------
   GET ALL SONGS
-------------------------------------------------------------------------- */

const getSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: songs.length,
      data: songs,
    });
  } catch (error) {
    console.error("❌ GET SONGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch songs",
      error: error.message,
    });
  }
};

/* --------------------------------------------------------------------------
   GET SONG BY ID
-------------------------------------------------------------------------- */

const getSongById = async (req, res) => {
  try {
    const song = await Song.findById(
      req.params.id
    );

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    res.status(200).json({
      success: true,
      data: song,
    });
  } catch (error) {
    console.error(
      "❌ GET SONG ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch song",
      error: error.message,
    });
  }
};

/* --------------------------------------------------------------------------
   ADD SONG
-------------------------------------------------------------------------- */

const addSong = async (req, res) => {
  try {
    console.log("");
    console.log("=================================");
    console.log("📥 ADD SONG REQUEST");
    console.log("=================================");

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    /* VALIDATE TITLE */

    const title = String(
      req.body.title || ""
    ).trim();

    if (!title) {
      cleanupUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Song title is required",
      });
    }

    /* FILES */

    const imageFile = req.files?.image?.[0];
    const coverImageFile =
      req.files?.coverImage?.[0];
    const finalImageFile =
      imageFile || coverImageFile;

    const audioFile = req.files?.audio?.[0];
    const audioFileAlt =
      req.files?.audioFile?.[0];

    const musicVideoFile =
      req.files?.musicVideo?.[0];
    const lyricVideoFile =
      req.files?.lyricVideo?.[0];
    const lyricsFile =
      req.files?.lyricsFile?.[0];

    /* FILE URLS */

    const imageUrl =
      req.body.imageUrl &&
      String(req.body.imageUrl).trim()
        ? String(req.body.imageUrl).trim()
        : getFileUrl(finalImageFile);

    const audioUrl =
      req.body.audioUrl &&
      String(req.body.audioUrl).trim()
        ? String(req.body.audioUrl).trim()
        : getFileUrl(
            audioFile || audioFileAlt
          );

    const musicVideoUrl = getFileUrl(
      musicVideoFile
    );
    const lyricVideoUrl = getFileUrl(
      lyricVideoFile
    );
    const lyricsFileUrl = getFileUrl(
      lyricsFile
    );

    /* PLAYS */

    let plays = 0;

    if (
      req.body.plays !== undefined &&
      req.body.plays !== ""
    ) {
      plays = Number(req.body.plays);
      if (Number.isNaN(plays)) plays = 0;
    }

    /* CREATE SONG */

    const song = await Song.create({
      title: req.body.title?.trim() || "",
      artist: req.body.artist?.trim() || "",
      album: req.body.album?.trim() || "",
      genre: req.body.genre?.trim() || "",
      language:
        req.body.language?.trim() || "",
      releaseDate: req.body.releaseDate || "",
      duration: req.body.duration || "00:00",
      description: req.body.description || "",
      plays,

      imageUrl,
      audioUrl,
      musicVideoUrl,
      lyricVideoUrl,
      lyricsFileUrl,

      isrc: req.body.isrc || "",
      catalogId: req.body.catalogId || "",
      composer: req.body.composer || "",
      lyricist: req.body.lyricist || "",
      musicDirector:
        req.body.musicDirector || "",
      producer: req.body.producer || "",
      copyright: req.body.copyright || "",
      publisher: req.body.publisher || "",
      copyrightYear:
        req.body.copyrightYear || "",

      status: req.body.status || "Draft",
      visibility:
        req.body.visibility || "Public",
      scheduleDate: req.body.scheduleDate || "",
      scheduleTime: req.body.scheduleTime || "",
    });

    console.log("=================================");
    console.log("✅ SONG SAVED");
    console.log("ID:", song._id);
    console.log("TITLE:", song.title);
    console.log("IMAGE URL:", song.imageUrl);
    console.log("AUDIO URL:", song.audioUrl);
    console.log("=================================");

    res.status(201).json({
      success: true,
      message: "Song added successfully",
      data: song,
    });
  } catch (error) {
    console.error(
      "❌ ADD SONG ERROR:",
      error
    );

    cleanupUploadedFiles(req.files);

    res.status(500).json({
      success: false,
      message: "Failed to add song",
      error: error.message,
    });
  }
};

/* --------------------------------------------------------------------------
   UPDATE SONG — ✅ FIXED
   Priority: uploaded file > frontend URL > existing value
-------------------------------------------------------------------------- */

const updateSong = async (req, res) => {
  try {
    console.log("");
    console.log("=================================");
    console.log("✏️ UPDATE SONG REQUEST");
    console.log("=================================");

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    /* FIND SONG */

    const song = await Song.findById(
      req.params.id
    );

    if (!song) {
      cleanupUploadedFiles(req.files);

      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    /* VALIDATE TITLE */

    const newTitle =
      req.body.title !== undefined
        ? String(req.body.title).trim()
        : song.title;

    if (!newTitle) {
      cleanupUploadedFiles(req.files);

      return res.status(400).json({
        success: false,
        message: "Song title is required",
      });
    }

    /* =========================================================
       IMAGE — ✅ FIXED
       Priority 1: uploaded coverImage / image file
       Priority 2: frontend imageUrl (media library)
       Priority 3: keep existing song.imageUrl
    ========================================================= */

    const imageFile = req.files?.image?.[0];
    const coverImageFile =
      req.files?.coverImage?.[0];
    const finalImageFile =
      imageFile || coverImageFile;

    console.log("🖼️ Image check:");
    console.log(
      "   imageFile:",
      imageFile?.filename
    );
    console.log(
      "   coverImageFile:",
      coverImageFile?.filename
    );
    console.log(
      "   finalImageFile:",
      finalImageFile?.filename
    );
    console.log(
      "   body.imageUrl:",
      req.body.imageUrl
    );
    console.log(
      "   current song.imageUrl:",
      song.imageUrl
    );

    if (finalImageFile) {
      /* Naya file upload hua hai — purani delete karo, nayi set karo */
      console.log(
        "✅ New image file detected"
      );

      deleteFile(song.imageUrl);
      song.imageUrl = getFileUrl(finalImageFile);

      console.log(
        "   new imageUrl:",
        song.imageUrl
      );
    } else if (
      req.body.imageUrl !== undefined &&
      String(req.body.imageUrl).trim()
    ) {
      /* Frontend ne URL bheja (media library se) */
      console.log(
        "✅ imageUrl from frontend"
      );

      song.imageUrl = String(
        req.body.imageUrl
      ).trim();
    } else {
      console.log(
        "ℹ️ No image change, keeping existing"
      );
    }

    /* =========================================================
       AUDIO
    ========================================================= */

    const audioFile = req.files?.audio?.[0];
    const audioFileAlt =
      req.files?.audioFile?.[0];

    const finalAudioFile =
      audioFile || audioFileAlt;

    if (finalAudioFile) {
      console.log(
        "✅ New audio file detected"
      );

      deleteFile(song.audioUrl);
      song.audioUrl = getFileUrl(
        finalAudioFile
      );
    } else if (
      req.body.audioUrl !== undefined &&
      String(req.body.audioUrl).trim()
    ) {
      console.log(
        "✅ audioUrl from frontend"
      );

      song.audioUrl = String(
        req.body.audioUrl
      ).trim();
    } else {
      console.log("ℹ️ No audio change");
    }

    /* MUSIC VIDEO */

    const musicVideoFile =
      req.files?.musicVideo?.[0];

    if (musicVideoFile) {
      deleteFile(song.musicVideoUrl);
      song.musicVideoUrl = getFileUrl(
        musicVideoFile
      );
      console.log(
        "✅ New music video:",
        song.musicVideoUrl
      );
    }

    /* LYRIC VIDEO */

    const lyricVideoFile =
      req.files?.lyricVideo?.[0];

    if (lyricVideoFile) {
      deleteFile(song.lyricVideoUrl);
      song.lyricVideoUrl = getFileUrl(
        lyricVideoFile
      );
      console.log(
        "✅ New lyric video:",
        song.lyricVideoUrl
      );
    }

    /* LYRICS FILE */

    const lyricsFile =
      req.files?.lyricsFile?.[0];

    if (lyricsFile) {
      deleteFile(song.lyricsFileUrl);
      song.lyricsFileUrl = getFileUrl(
        lyricsFile
      );
      console.log(
        "✅ New lyrics file:",
        song.lyricsFileUrl
      );
    }

    /* TEXT FIELDS */

    if (req.body.title !== undefined)
      song.title = req.body.title.trim();

    if (req.body.artist !== undefined)
      song.artist = req.body.artist.trim();

    if (req.body.album !== undefined)
      song.album = req.body.album.trim();

    if (req.body.genre !== undefined)
      song.genre = req.body.genre.trim();

    if (req.body.language !== undefined)
      song.language = req.body.language.trim();

    if (req.body.releaseDate !== undefined)
      song.releaseDate = req.body.releaseDate;

    if (req.body.duration !== undefined)
      song.duration = req.body.duration;

    if (req.body.description !== undefined)
      song.description = req.body.description;

    if (
      req.body.plays !== undefined &&
      req.body.plays !== ""
    ) {
      const plays = Number(req.body.plays);
      if (!Number.isNaN(plays))
        song.plays = plays;
    }

    if (req.body.isrc !== undefined)
      song.isrc = req.body.isrc;

    if (req.body.catalogId !== undefined)
      song.catalogId = req.body.catalogId;

    if (req.body.composer !== undefined)
      song.composer = req.body.composer;

    if (req.body.lyricist !== undefined)
      song.lyricist = req.body.lyricist;

    if (req.body.musicDirector !== undefined)
      song.musicDirector =
        req.body.musicDirector;

    if (req.body.producer !== undefined)
      song.producer = req.body.producer;

    if (req.body.copyright !== undefined)
      song.copyright = req.body.copyright;

    if (req.body.publisher !== undefined)
      song.publisher = req.body.publisher;

    if (
      req.body.copyrightYear !== undefined
    )
      song.copyrightYear =
        req.body.copyrightYear;

    if (req.body.status !== undefined)
      song.status = req.body.status;

    if (req.body.visibility !== undefined)
      song.visibility = req.body.visibility;

    if (req.body.scheduleDate !== undefined)
      song.scheduleDate = req.body.scheduleDate;

    if (req.body.scheduleTime !== undefined)
      song.scheduleTime = req.body.scheduleTime;

    /* SAVE */

    await song.save();

    console.log("=================================");
    console.log(
      "✅ SONG UPDATED:",
      song._id
    );
    console.log("IMAGE URL:", song.imageUrl);
    console.log("AUDIO URL:", song.audioUrl);
    console.log("=================================");

    res.status(200).json({
      success: true,
      message: "Song updated successfully",
      data: song,
    });
  } catch (error) {
    console.error(
      "❌ UPDATE SONG ERROR:",
      error
    );

    cleanupUploadedFiles(req.files);

    res.status(500).json({
      success: false,
      message: "Failed to update song",
      error: error.message,
    });
  }
};

/* --------------------------------------------------------------------------
   DELETE SONG
-------------------------------------------------------------------------- */

const deleteSong = async (req, res) => {
  try {
    const song = await Song.findById(
      req.params.id
    );

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    /* DELETE FILES */

    deleteFile(song.imageUrl);
    deleteFile(song.audioUrl);
    deleteFile(song.musicVideoUrl);
    deleteFile(song.lyricVideoUrl);
    deleteFile(song.lyricsFileUrl);

    /* DELETE DB RECORD */

    await Song.findByIdAndDelete(
      req.params.id
    );

    console.log(
      "🗑️ SONG DELETED:",
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Song deleted successfully",
    });
  } catch (error) {
    console.error(
      "❌ DELETE SONG ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete song",
      error: error.message,
    });
  }
};

module.exports = {
  getSongs,
  getSongById,
  addSong,
  updateSong,
  deleteSong,
};