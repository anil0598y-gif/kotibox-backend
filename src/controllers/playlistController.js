const Playlist = require("../models/Playlist");
const fs = require("fs");
const path = require("path");

/* =========================================
   GET ALL PLAYLISTS
========================================= */

const getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find()
      .populate("songs")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      playlists,
      data: playlists,
    });
  } catch (error) {
    console.error("Get playlists error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch playlists",
      error: error.message,
    });
  }
};

/* =========================================
   GET SINGLE PLAYLIST
========================================= */

const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(
      req.params.id
    ).populate("songs");

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    res.status(200).json({
      success: true,
      data: playlist,
      playlist,
    });
  } catch (error) {
    console.error("Get playlist error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch playlist",
      error: error.message,
    });
  }
};

/* =========================================
   CREATE PLAYLIST
========================================= */

const createPlaylist = async (req, res) => {
  try {
    const {
      name,
      description,
      genre,
      status,
      createdBy,
      songs,
      imageUrl,
      coverImage: coverImageFromBody,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Playlist name is required",
      });
    }

    /* ✅ COVER IMAGE — 3 sources */
    let coverImage = "";

    if (req.file) {
      coverImage = `/uploads/playlists/${req.file.filename}`;
    } else if (
      imageUrl &&
      String(imageUrl).trim()
    ) {
      coverImage = String(imageUrl).trim();
    } else if (
      coverImageFromBody &&
      String(coverImageFromBody).trim()
    ) {
      coverImage = String(
        coverImageFromBody
      ).trim();
    }

    let songIds = [];

    if (songs) {
      try {
        songIds =
          typeof songs === "string"
            ? JSON.parse(songs)
            : songs;
      } catch {
        songIds = [];
      }
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description || "",
      genre: genre || "Bollywood",
      status: status || "Active",
      createdBy: createdBy || "Admin",
      coverImage,
      songs: Array.isArray(songIds)
        ? songIds
        : [],
    });

    res.status(201).json({
      success: true,
      message: "Playlist created successfully",
      data: playlist,
      playlist,
    });
  } catch (error) {
    console.error(
      "Create playlist error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create playlist",
      error: error.message,
    });
  }
};

/* =========================================
   UPDATE PLAYLIST — ✅ FIXED
   File upload + URL (link) दोनों support
========================================= */

const updatePlaylist = async (req, res) => {
  try {
    console.log("");
    console.log("=================================");
    console.log("✏️ UPDATE PLAYLIST REQUEST");
    console.log("=================================");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const playlist = await Playlist.findById(
      req.params.id
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const {
      name,
      description,
      genre,
      status,
      createdBy,
      songs,
      imageRemoved,
      imageUrl,
      coverImage: coverImageFromBody,
      image: imageFromBody,
    } = req.body;

    /* =====================================
       DELETE OLD IMAGE HELPER
       (External URLs skip करता है)
    ===================================== */

    const deleteOldImage = () => {
      if (!playlist.coverImage) return;

      /* External URL को skip करें */
      if (
        playlist.coverImage.startsWith(
          "http://"
        ) ||
        playlist.coverImage.startsWith(
          "https://"
        )
      ) {
        console.log(
          "ℹ️ External URL, not deleting:",
          playlist.coverImage
        );
        return;
      }

      const cleanPath = String(
        playlist.coverImage
      )
        .replace(/^\/+/, "")
        .replace(/^\\+/, "");

      const oldImagePath = path.join(
        __dirname,
        "../../public",
        cleanPath
      );

      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
          console.log(
            "🗑️ Old image deleted:",
            oldImagePath
          );
        } catch (err) {
          console.error(
            "❌ Delete error:",
            err.message
          );
        }
      }
    };

    /* =====================================
       UPDATE BASIC DATA
    ===================================== */

    if (name !== undefined) {
      playlist.name = name.trim();
    }

    if (description !== undefined) {
      playlist.description = description;
    }

    if (genre !== undefined) {
      playlist.genre = genre;
    }

    if (status !== undefined) {
      playlist.status = status;
    }

    if (createdBy !== undefined) {
      playlist.createdBy = createdBy;
    }

    /* =====================================
       UPDATE SONGS
    ===================================== */

    if (songs !== undefined) {
      try {
        const parsedSongs =
          typeof songs === "string"
            ? JSON.parse(songs)
            : songs;

        playlist.songs = Array.isArray(
          parsedSongs
        )
          ? parsedSongs
          : [];
      } catch {
        playlist.songs = [];
      }
    }

    /* =====================================
       REMOVE IMAGE
    ===================================== */

    if (
      imageRemoved === "true" ||
      imageRemoved === true
    ) {
      deleteOldImage();
      playlist.coverImage = "";
      console.log("✅ Image removed");
    }

    /* =====================================
       ✅ NEW IMAGE — 3 Sources
       1. Uploaded file (priority)
       2. imageUrl field (link)
       3. coverImage / image field (link)
    ===================================== */

    if (req.file) {
      /* 1. Uploaded file */
      console.log(
        "📁 New file upload:",
        req.file.filename
      );

      deleteOldImage();
      playlist.coverImage = `/uploads/playlists/${req.file.filename}`;
    } else if (
      imageUrl !== undefined &&
      String(imageUrl).trim()
    ) {
      /* 2. imageUrl field */
      const url = String(imageUrl).trim();
      console.log(
        "🔗 imageUrl from frontend:",
        url
      );

      deleteOldImage();
      playlist.coverImage = url;
    } else if (
      coverImageFromBody !== undefined &&
      String(coverImageFromBody).trim()
    ) {
      /* 3. coverImage field */
      const url = String(
        coverImageFromBody
      ).trim();
      console.log(
        "🔗 coverImage from body:",
        url
      );

      deleteOldImage();
      playlist.coverImage = url;
    } else if (
      imageFromBody !== undefined &&
      String(imageFromBody).trim()
    ) {
      /* 4. image field */
      const url = String(imageFromBody).trim();
      console.log(
        "🔗 image from body:",
        url
      );

      deleteOldImage();
      playlist.coverImage = url;
    }

    await playlist.save();

    console.log("=================================");
    console.log("✅ PLAYLIST UPDATED");
    console.log("ID:", playlist._id);
    console.log("NAME:", playlist.name);
    console.log(
      "COVER IMAGE:",
      playlist.coverImage
    );
    console.log("=================================");

    const updatedPlaylist =
      await Playlist.findById(
        playlist._id
      ).populate("songs");

    res.status(200).json({
      success: true,
      message: "Playlist updated successfully",
      data: updatedPlaylist,
      playlist: updatedPlaylist,
    });
  } catch (error) {
    console.error(
      "Update playlist error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update playlist",
      error: error.message,
    });
  }
};

/* =========================================
   DELETE PLAYLIST
========================================= */

const deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(
      req.params.id
    );

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    /* Delete cover image — सिर्फ internal files */
    if (playlist.coverImage) {
      if (
        !playlist.coverImage.startsWith(
          "http://"
        ) &&
        !playlist.coverImage.startsWith(
          "https://"
        )
      ) {
        const cleanPath = String(
          playlist.coverImage
        )
          .replace(/^\/+/, "")
          .replace(/^\\+/, "");

        const imagePath = path.join(
          __dirname,
          "../../public",
          cleanPath
        );

        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
          } catch (err) {
            console.error(
              "Delete image error:",
              err.message
            );
          }
        }
      }
    }

    await Playlist.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete playlist error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete playlist",
      error: error.message,
    });
  }
};

module.exports = {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
};