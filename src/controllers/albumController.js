const Album = require("../models/Album");
const fs = require("fs");
const path = require("path");

/* =========================================
   DELETE IMAGE FILE
========================================= */

const deleteImageFile = (imagePath) => {
  if (!imagePath) {
    return;
  }

  const value = String(imagePath).trim();

  if (!value) return;

  /* External URLs skip karo
     (http://, https://, data:, blob:) */
  if (/^(https?:|data:|blob:)/i.test(value)) {
    return;
  }

  try {
    const cleanPath = value
      .replace(/^\/+/, "")
      .replace(/\//g, path.sep);

    const fullPath = path.join(
      __dirname,
      "../../public",
      cleanPath
    );

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);

      console.log(
        "🗑️ Album image deleted:",
        fullPath
      );
    }
  } catch (error) {
    console.error(
      "❌ Album image delete error:",
      error.message
    );
  }
};

/* =========================================
   GET ALL ALBUMS
   ✅ FIXED — populate("songs") added
========================================= */

const getAlbums = async (req, res) => {
  try {
    const albums = await Album.find()
      .populate("songs")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: albums.length,
      data: albums,
    });
  } catch (error) {
    console.error("GET ALBUMS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch albums",
      error: error.message,
    });
  }
};

/* =========================================
   GET ALBUM BY ID
   ✅ FIXED — populate("songs") added
========================================= */

const getAlbumById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("");
    console.log("=================================");
    console.log("📥 GET ALBUM BY ID:", id);
    console.log("=================================");

    const album = await Album.findById(id)
      .populate("songs");   /* ✅ यही missing था! */

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    console.log(
      "✅ Album found:",
      album.name || album.title
    );
    console.log(
      "📀 Songs in album:",
      album.songs?.length || 0
    );

    /* ✅ Songs की details log करें */
    if (Array.isArray(album.songs)) {
      album.songs.forEach((song, i) => {
        if (song && typeof song === "object") {
          console.log(
            `   Song ${i + 1}: ${song.title} by ${song.artist} | audioUrl: ${song.audioUrl || "❌ EMPTY"}`
          );
        }
      });
    }

    console.log("=================================");

    res.status(200).json({
      success: true,
      data: album,
    });
  } catch (error) {
    console.error("GET ALBUM ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch album",
      error: error.message,
    });
  }
};

/* =========================================
   CREATE ALBUM
========================================= */

const createAlbum = async (req, res) => {
  try {
    const {
      name,
      artist,
      genre,
      language,
      country,
      releaseDate,
      description,
      status,
      songs,
      image: bodyImage,
    } = req.body;

    /* -------------------------------
       VALIDATION
    ------------------------------- */

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Album name is required",
      });
    }

    /* -------------------------------
       IMAGE
    ------------------------------- */

    let image = "";

    if (req.file) {
      image = `/uploads/albums/${req.file.filename}`;
    } else if (
      bodyImage &&
      String(bodyImage).trim()
    ) {
      image = String(bodyImage).trim();
    }

    console.log("📸 Album image being saved:", image);

    /* -------------------------------
       SONGS
    ------------------------------- */

    let parsedSongs = [];

    if (songs) {
      try {
        parsedSongs =
          typeof songs === "string"
            ? JSON.parse(songs)
            : songs;
      } catch (error) {
        parsedSongs = [];
      }
    }

    /* ✅ सिर्फ valid IDs रखें */
    parsedSongs = Array.isArray(parsedSongs)
      ? parsedSongs.filter(Boolean)
      : [];

    /* -------------------------------
       CREATE
    ------------------------------- */

    const album = await Album.create({
      name: name.trim(),
      image,
      artist: artist?.trim() || "",
      genre: genre?.trim() || "Bollywood",
      language: language?.trim() || "Hindi",
      country: country?.trim() || "India",
      releaseDate: releaseDate?.trim() || "",
      description: description?.trim() || "",
      status: status || "Active",
      songs: parsedSongs,
    });

    /* ✅ अब album को songs के साथ populate करके return करें */
    const populatedAlbum = await Album.findById(
      album._id
    ).populate("songs");

    res.status(201).json({
      success: true,
      message: "Album created successfully",
      data: populatedAlbum,
    });
  } catch (error) {
    console.error("CREATE ALBUM ERROR:", error);

    /* Delete uploaded image if DB save fails */

    if (req.file) {
      deleteImageFile(
        `/uploads/albums/${req.file.filename}`
      );
    }

    res.status(500).json({
      success: false,
      message: "Failed to create album",
      error: error.message,
    });
  }
};

/* =========================================
   UPDATE ALBUM
========================================= */

const updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    const {
      name,
      artist,
      genre,
      language,
      country,
      releaseDate,
      description,
      status,
      songs,
      removeImage,
      image: bodyImage,
    } = req.body;

    /* -------------------------------
       BASIC FIELDS
    ------------------------------- */

    if (
      name !== undefined &&
      !String(name).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Album name is required",
      });
    }

    if (name !== undefined) {
      album.name = String(name).trim();
    }

    if (artist !== undefined) {
      album.artist = String(artist).trim();
    }

    if (genre !== undefined) {
      album.genre = String(genre).trim();
    }

    if (language !== undefined) {
      album.language = String(language).trim();
    }

    if (country !== undefined) {
      album.country = String(country).trim();
    }

    if (releaseDate !== undefined) {
      album.releaseDate = String(releaseDate).trim();
    }

    if (description !== undefined) {
      album.description = String(description).trim();
    }

    if (status !== undefined) {
      album.status = status;
    }

    /* -------------------------------
       SONGS
    ------------------------------- */

    if (songs !== undefined) {
      try {
        const parsedSongs =
          typeof songs === "string"
            ? JSON.parse(songs)
            : songs;

        /* ✅ सिर्फ valid IDs रखें */
        album.songs = Array.isArray(parsedSongs)
          ? parsedSongs.filter(Boolean)
          : [];
      } catch (error) {
        album.songs = [];
      }
    }

    /* -------------------------------
       REMOVE IMAGE
    ------------------------------- */

    if (
      String(removeImage).toLowerCase() === "true"
    ) {
      if (album.image) {
        deleteImageFile(album.image);
      }

      album.image = "";
    }

    /* -------------------------------
       NEW IMAGE
    ------------------------------- */

    if (req.file) {
      if (album.image) {
        deleteImageFile(album.image);
      }

      album.image = `/uploads/albums/${req.file.filename}`;
    } else if (
      bodyImage !== undefined &&
      String(bodyImage).trim()
    ) {
      album.image = String(bodyImage).trim();
    }

    console.log("📸 Album image after update:", album.image);

    /* -------------------------------
       SAVE
    ------------------------------- */

    await album.save();

    /* ✅ अब album को songs के साथ populate करके return करें */
    const populatedAlbum = await Album.findById(
      album._id
    ).populate("songs");

    res.status(200).json({
      success: true,
      message: "Album updated successfully",
      data: populatedAlbum,
    });
  } catch (error) {
    console.error("UPDATE ALBUM ERROR:", error);

    if (req.file) {
      deleteImageFile(
        `/uploads/albums/${req.file.filename}`
      );
    }

    res.status(500).json({
      success: false,
      message: "Failed to update album",
      error: error.message,
    });
  }
};

/* =========================================
   DELETE ALBUM
========================================= */

const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    const album = await Album.findById(id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found",
      });
    }

    if (album.image) {
      deleteImageFile(album.image);
    }

    await Album.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Album deleted successfully",
      data: {
        _id: album._id,
      },
    });
  } catch (error) {
    console.error("DELETE ALBUM ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete album",
      error: error.message,
    });
  }
};

/* =========================================
   EXPORT
========================================= */

module.exports = {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
};