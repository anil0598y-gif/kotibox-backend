const Song = require("../models/Song");
const Artist = require("../models/Artist");   // ✅ NAYA IMPORT
const fs = require("fs");
const path = require("path");

/* --------------------------------------------------------------------------
   HELPER: PUBLIC SONG FILTER
-------------------------------------------------------------------------- */

const PUBLIC_FILTER = {
  status: "Published",
  visibility: "Public",
};

/* --------------------------------------------------------------------------
   DELETE FILE
-------------------------------------------------------------------------- */

const deleteFile = (fileUrl) => {
  try {
    if (!fileUrl) return;

    if (typeof fileUrl === "string" && /^https?:\/\//i.test(fileUrl)) {
      console.log("☁️ Skipping remote URL (not deleting):", fileUrl);
      return;
    }

    const cleanPath = String(fileUrl)
      .replace(/^\/+/, "")
      .replace(/^\\+/, "");

    const filePath = path.join(__dirname, "../../public", cleanPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ File deleted:", filePath);
    }
  } catch (error) {
    console.error("❌ File delete error:", error.message);
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
          if (/^https?:\/\//i.test(file.path)) return;

          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log("🗑️ Uploaded file cleaned:", file.path);
          }
        } catch (cleanupError) {
          console.error("❌ Cleanup error:", cleanupError.message);
        }
      });
  } catch (error) {
    console.error("❌ Uploaded files cleanup error:", error.message);
  }
};

/* --------------------------------------------------------------------------
   FILE URL
-------------------------------------------------------------------------- */

const getFileUrl = (file) => {
  if (!file) return "";

  if (file.path && /^https?:\/\//i.test(file.path)) {
    return file.path;
  }

  if (file.secure_url) {
    return file.secure_url;
  }

  if (file.url && /^https?:\/\//i.test(file.url)) {
    return file.url;
  }

  if (file.filename) {
    if (file.filename.includes("/")) {
      const cloudName =
        process.env.CLOUDINARY_CLOUD_NAME || "fhpolyec";

      let resourceType = "image";
      if (file.mimetype) {
        if (
          file.mimetype.startsWith("video/") ||
          file.mimetype.startsWith("audio/")
        ) {
          resourceType = "video";
        } else if (file.mimetype.startsWith("image/")) {
          resourceType = "image";
        }
      }

      const constructedUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${file.filename}`;

      console.log("🔧 Constructed Cloudinary URL:", constructedUrl);

      return constructedUrl;
    }

    return `/uploads/songs/${file.filename}`;
  }

  return "";
};

/* ==========================================================================
   ✅ AUTO-SYNC ARTISTS FROM SONG
   Song add/update/delete hone pe Artist collection automatically update hota hai
========================================================================== */

const parseArtistNames = (artistString) => {
  if (!artistString) return [];
  return String(artistString)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
};

/**
 * Song add/update ke baad call karo.
 * - Naye artists create karega
 * - Existing artists me song._id add karega
 * - Purane artists se song._id hata dega (agar artist change hua)
 */
const syncArtistsFromSong = async (song, oldArtistString = null) => {
  if (!song) return;

  try {
    const newNames = parseArtistNames(song.artist);
    const oldNames = parseArtistNames(oldArtistString);

    /* 1. Purane artists se song remove karo (agar artist change hua) */
    if (oldArtistString) {
      const removedNames = oldNames.filter((n) => !newNames.includes(n));

      for (const name of removedNames) {
        await Artist.updateOne(
          { name: { $regex: `^${name}$`, $options: "i" } },
          { $pull: { songs: song._id } }
        );
        console.log(`🔄 Removed song from artist: ${name}`);
      }
    }

    /* 2. Naye artists me song add karo, ya create karo */
    for (const name of newNames) {
      let artist = await Artist.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
      });

      if (!artist) {
        /* Naya artist create karo */
        artist = await Artist.create({
          name,
          image: song.imageUrl || "",
          songs: [song._id],
          type: "Singer",
          status: "Active",
        });
        console.log(`✅ Auto-created artist: ${name}`);
      } else {
        /* Existing artist me song add karo (duplicate check) */
        const songIdStr = String(song._id);
        const alreadyHas = (artist.songs || []).some(
          (id) => String(id) === songIdStr
        );

        if (!alreadyHas) {
          artist.songs = [...(artist.songs || []), song._id];
          await artist.save();
          console.log(`✅ Added song to artist: ${name}`);
        }

        /* Agar artist ki image blank hai to song ki image use karo */
        if (!artist.image && song.imageUrl) {
          artist.image = song.imageUrl;
          await artist.save();
        }
      }
    }
  } catch (error) {
    console.error("❌ syncArtistsFromSong error:", error.message);
  }
};

/**
 * Song delete hone pe call karo.
 * Har associated artist se song._id hata dega.
 */
const unsyncArtistFromSong = async (song) => {
  if (!song) return;

  try {
    const names = parseArtistNames(song.artist);

    for (const name of names) {
      await Artist.updateOne(
        { name: { $regex: `^${name}$`, $options: "i" } },
        { $pull: { songs: song._id } }
      );
    }

    console.log(`🔄 Song removed from ${names.length} artist(s)`);
  } catch (error) {
    console.error("❌ unsyncArtistFromSong error:", error.message);
  }
};

/* ==========================================================================
   🌐 PUBLIC APIs — User App
========================================================================== */

const getPublicSongs = async (req, res) => {
  try {
    const { search, genre, language, trending } = req.query;

    const filter = { ...PUBLIC_FILTER };

    if (genre) filter.genre = genre;
    if (language) filter.language = language;
    if (trending === "true") filter.isTrending = true;
    if (search) filter.$text = { $search: search };

    const songs = await Song.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: songs.length,
      data: songs,
    });
  } catch (error) {
    console.error("❌ GET PUBLIC SONGS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch songs",
      error: error.message,
    });
  }
};

const getPublicSongById = async (req, res) => {
  try {
    const song = await Song.findOne({
      _id: req.params.id,
      ...PUBLIC_FILTER,
    });

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
    console.error("❌ GET PUBLIC SONG ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch song",
      error: error.message,
    });
  }
};

/* ==========================================================================
   🔒 ADMIN APIs
========================================================================== */

const getSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });

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

const getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

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
    console.error("❌ GET SONG ERROR:", error);
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

    const title = String(req.body.title || "").trim();

    if (!title) {
      cleanupUploadedFiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Song title is required",
      });
    }

    const imageFile = req.files?.image?.[0];
    const coverImageFile = req.files?.coverImage?.[0];
    const finalImageFile = imageFile || coverImageFile;

    const audioFile = req.files?.audio?.[0];
    const audioFileAlt = req.files?.audioFile?.[0];

    const musicVideoFile = req.files?.musicVideo?.[0];
    const lyricVideoFile = req.files?.lyricVideo?.[0];
    const lyricsFile = req.files?.lyricsFile?.[0];

    const imageUrl =
      req.body.imageUrl && String(req.body.imageUrl).trim()
        ? String(req.body.imageUrl).trim()
        : getFileUrl(finalImageFile);

    const audioUrl =
      req.body.audioUrl && String(req.body.audioUrl).trim()
        ? String(req.body.audioUrl).trim()
        : getFileUrl(audioFile || audioFileAlt);

    const musicVideoUrl = getFileUrl(musicVideoFile);
    const lyricVideoUrl = getFileUrl(lyricVideoFile);
    const lyricsFileUrl = getFileUrl(lyricsFile);

    let plays = 0;
    if (req.body.plays !== undefined && req.body.plays !== "") {
      plays = Number(req.body.plays);
      if (Number.isNaN(plays)) plays = 0;
    }

    const song = await Song.create({
      title,
      artist: req.body.artist?.trim() || "",
      album: req.body.album?.trim() || "",
      genre: req.body.genre?.trim() || "",
      language: req.body.language?.trim() || "",
      releaseDate: req.body.releaseDate || "",
      duration: req.body.duration || "00:00",
      description: req.body.description || "",
      plays,

      imageUrl,
      audioUrl,
      musicVideoUrl,
      lyricVideoUrl,
      lyricsFileUrl,

      lyrics: req.body.lyrics || "",
      syncedLyrics: req.body.syncedLyrics || "",

      isrc: req.body.isrc || "",
      catalogId: req.body.catalogId || "",
      composer: req.body.composer || "",
      lyricist: req.body.lyricist || "",
      musicDirector: req.body.musicDirector || "",
      producer: req.body.producer || "",
      copyright: req.body.copyright || "",
      publisher: req.body.publisher || "",
      copyrightYear: req.body.copyrightYear || "",

      status: req.body.status || "Draft",
      visibility: req.body.visibility || "Public",
      scheduleDate: req.body.scheduleDate || "",
      scheduleTime: req.body.scheduleTime || "",
    });

    console.log("=================================");
    console.log("✅ SONG SAVED");
    console.log("ID:", song._id);
    console.log("STATUS:", song.status);
    console.log("=================================");

    /* ✅ AUTO-SYNC ARTISTS */
    await syncArtistsFromSong(song);

    /* 🔥 SOCKET.IO */
    const io = req.app.get("io");
    if (io && song.status === "Published" && song.visibility === "Public") {
      io.emit("song:added", song);
      console.log("📡 Socket emitted: song:added");
    }

    res.status(201).json({
      success: true,
      message: "Song added successfully",
      data: song,
    });
  } catch (error) {
    console.error("❌ ADD SONG ERROR:", error);
    cleanupUploadedFiles(req.files);

    res.status(500).json({
      success: false,
      message: "Failed to add song",
      error: error.message,
    });
  }
};

/* --------------------------------------------------------------------------
   UPDATE SONG
-------------------------------------------------------------------------- */

const updateSong = async (req, res) => {
  try {
    console.log("");
    console.log("=================================");
    console.log("✏️ UPDATE SONG REQUEST");
    console.log("=================================");

    const song = await Song.findById(req.params.id);

    if (!song) {
      cleanupUploadedFiles(req.files);
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    /* ✅ Save old artist string for sync */
    const oldArtistString = song.artist;

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

    /* IMAGE */
    const imageFile = req.files?.image?.[0];
    const coverImageFile = req.files?.coverImage?.[0];
    const finalImageFile = imageFile || coverImageFile;

    if (finalImageFile) {
      deleteFile(song.imageUrl);
      song.imageUrl = getFileUrl(finalImageFile);
    } else if (
      req.body.imageUrl !== undefined &&
      String(req.body.imageUrl).trim()
    ) {
      song.imageUrl = String(req.body.imageUrl).trim();
    }

    /* AUDIO */
    const audioFile = req.files?.audio?.[0];
    const audioFileAlt = req.files?.audioFile?.[0];
    const finalAudioFile = audioFile || audioFileAlt;

    if (finalAudioFile) {
      deleteFile(song.audioUrl);
      song.audioUrl = getFileUrl(finalAudioFile);
    } else if (
      req.body.audioUrl !== undefined &&
      String(req.body.audioUrl).trim()
    ) {
      song.audioUrl = String(req.body.audioUrl).trim();
    }

    /* MUSIC VIDEO */
    const musicVideoFile = req.files?.musicVideo?.[0];
    if (musicVideoFile) {
      deleteFile(song.musicVideoUrl);
      song.musicVideoUrl = getFileUrl(musicVideoFile);
    }

    /* LYRIC VIDEO */
    const lyricVideoFile = req.files?.lyricVideo?.[0];
    if (lyricVideoFile) {
      deleteFile(song.lyricVideoUrl);
      song.lyricVideoUrl = getFileUrl(lyricVideoFile);
    }

    /* LYRICS FILE */
    const lyricsFile = req.files?.lyricsFile?.[0];
    if (lyricsFile) {
      deleteFile(song.lyricsFileUrl);
      song.lyricsFileUrl = getFileUrl(lyricsFile);
    }

    /* TEXT FIELDS */
    if (req.body.title !== undefined) song.title = newTitle;
    if (req.body.artist !== undefined) song.artist = String(req.body.artist).trim();
    if (req.body.album !== undefined) song.album = String(req.body.album).trim();
    if (req.body.genre !== undefined) song.genre = String(req.body.genre).trim();
    if (req.body.language !== undefined) song.language = String(req.body.language).trim();
    if (req.body.releaseDate !== undefined) song.releaseDate = req.body.releaseDate;
    if (req.body.duration !== undefined) song.duration = req.body.duration;
    if (req.body.description !== undefined) song.description = req.body.description;
    if (req.body.lyrics !== undefined) song.lyrics = req.body.lyrics;
    if (req.body.syncedLyrics !== undefined) song.syncedLyrics = req.body.syncedLyrics;

    if (req.body.plays !== undefined && req.body.plays !== "") {
      const plays = Number(req.body.plays);
      if (!Number.isNaN(plays)) song.plays = plays;
    }

    if (req.body.isrc !== undefined) song.isrc = req.body.isrc;
    if (req.body.catalogId !== undefined) song.catalogId = req.body.catalogId;
    if (req.body.composer !== undefined) song.composer = req.body.composer;
    if (req.body.lyricist !== undefined) song.lyricist = req.body.lyricist;
    if (req.body.musicDirector !== undefined) song.musicDirector = req.body.musicDirector;
    if (req.body.producer !== undefined) song.producer = req.body.producer;
    if (req.body.copyright !== undefined) song.copyright = req.body.copyright;
    if (req.body.publisher !== undefined) song.publisher = req.body.publisher;
    if (req.body.copyrightYear !== undefined) song.copyrightYear = req.body.copyrightYear;
    if (req.body.status !== undefined) song.status = req.body.status;
    if (req.body.visibility !== undefined) song.visibility = req.body.visibility;
    if (req.body.scheduleDate !== undefined) song.scheduleDate = req.body.scheduleDate;
    if (req.body.scheduleTime !== undefined) song.scheduleTime = req.body.scheduleTime;

    await song.save();

    console.log("✅ SONG UPDATED:", song._id);

    /* ✅ AUTO-SYNC ARTISTS (old vs new artist name) */
    await syncArtistsFromSong(song, oldArtistString);

    /* 🔥 SOCKET.IO */
    const io = req.app.get("io");
    if (io) {
      if (song.status === "Published" && song.visibility === "Public") {
        io.emit("song:updated", song);
        console.log("📡 Socket emitted: song:updated");
      } else {
        io.emit("song:deleted", { _id: song._id });
        console.log("📡 Socket emitted: song:deleted (moved to draft)");
      }
    }

    res.status(200).json({
      success: true,
      message: "Song updated successfully",
      data: song,
    });
  } catch (error) {
    console.error("❌ UPDATE SONG ERROR:", error);
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
    const song = await Song.findById(req.params.id);

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

    /* ✅ AUTO-UNSYNC ARTISTS (song remove karo har artist se) */
    await unsyncArtistFromSong(song);

    /* DELETE DB RECORD */
    await Song.findByIdAndDelete(req.params.id);

    console.log("🗑️ SONG DELETED:", req.params.id);

    const io = req.app.get("io");
    if (io) {
      io.emit("song:deleted", { _id: req.params.id });
    }

    res.status(200).json({
      success: true,
      message: "Song deleted successfully",
    });
  } catch (error) {
    console.error("❌ DELETE SONG ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete song",
      error: error.message,
    });
  }
};

/* --------------------------------------------------------------------------
   TOGGLE STATUS
-------------------------------------------------------------------------- */

const toggleStatus = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({
        success: false,
        message: "Song not found",
      });
    }

    song.status = song.status === "Published" ? "Draft" : "Published";
    await song.save();

    console.log("🔄 STATUS TOGGLED:", song._id, "→", song.status);

    const io = req.app.get("io");
    if (io) {
      if (song.status === "Published" && song.visibility === "Public") {
        io.emit("song:added", song);
      } else {
        io.emit("song:deleted", { _id: song._id });
      }
    }

    res.status(200).json({
      success: true,
      message:
        song.status === "Published"
          ? "Song published successfully"
          : "Song moved to draft",
      data: song,
    });
  } catch (error) {
    console.error("❌ TOGGLE STATUS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle status",
      error: error.message,
    });
  }
};

module.exports = {
  getPublicSongs,
  getPublicSongById,
  getSongs,
  getSongById,
  addSong,
  updateSong,
  deleteSong,
  toggleStatus,
};