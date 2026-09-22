const fs = require("fs");
const path = require("path");

const Artist = require("../models/Artist");


/* =========================================
   DELETE OLD IMAGE
========================================= */

const deleteImageFile = (imageUrl) => {
  try {
    if (!imageUrl) return;

    if (!imageUrl.startsWith("/uploads/artists/")) {
      return;
    }

    const relativePath = imageUrl.replace(/^\/+/, "");

    const filePath = path.join(
      __dirname,
      "../../public",
      relativePath
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "Artist image delete error:",
      error.message
    );
  }
};


/* =========================================
   GET ALL ARTISTS
========================================= */

const getArtists = async (req, res) => {
  try {
    const artists = await Artist.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: artists.length,
      data: artists,
    });
  } catch (error) {
    console.error("Get artists error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch artists",
      error: error.message,
    });
  }
};


/* =========================================
   GET SINGLE ARTIST
========================================= */

const getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(
      req.params.id
    );

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    res.status(200).json({
      success: true,
      data: artist,
    });
  } catch (error) {
    console.error(
      "Get artist error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch artist",
      error: error.message,
    });
  }
};


/* =========================================
   CREATE ARTIST
========================================= */

const createArtist = async (req, res) => {
  try {
    const {
      name,
      type,
      genre,
      language,
      country,
      bio,
      instagram,
      youtube,
      spotify,
      followers,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Artist name is required",
      });
    }

    let image = "";

    if (req.file) {
      image = `/uploads/artists/${req.file.filename}`;
    }

    const artist = await Artist.create({
      name: name.trim(),
      image,

      type:
        type?.trim() ||
        "Singer",

      genre:
        genre?.trim() ||
        "Bollywood",

      language:
        language?.trim() ||
        "Hindi",

      country:
        country?.trim() ||
        "India",

      bio:
        bio?.trim() ||
        "",

      instagram:
        instagram?.trim() ||
        "",

      youtube:
        youtube?.trim() ||
        "",

      spotify:
        spotify?.trim() ||
        "",

      followers:
        Number(followers) || 0,

      status:
        status === "Inactive"
          ? "Inactive"
          : "Active",
    });

    res.status(201).json({
      success: true,
      message: "Artist created successfully",
      data: artist,
    });
  } catch (error) {
    console.error(
      "Create artist error:",
      error
    );

    if (req.file) {
      deleteImageFile(
        `/uploads/artists/${req.file.filename}`
      );
    }

    res.status(500).json({
      success: false,
      message: "Failed to create artist",
      error: error.message,
    });
  }
};


/* =========================================
   UPDATE ARTIST
========================================= */

const updateArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(
      req.params.id
    );

    if (!artist) {
      if (req.file) {
        deleteImageFile(
          `/uploads/artists/${req.file.filename}`
        );
      }

      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    const {
      name,
      type,
      genre,
      language,
      country,
      bio,
      instagram,
      youtube,
      spotify,
      followers,
      status,
      removeImage,
    } = req.body;


    /* =====================================
       BASIC DATA
    ===================================== */

    if (name !== undefined) {
      artist.name =
        name.trim();
    }

    if (type !== undefined) {
      artist.type =
        type.trim();
    }

    if (genre !== undefined) {
      artist.genre =
        genre.trim();
    }

    if (language !== undefined) {
      artist.language =
        language.trim();
    }

    if (country !== undefined) {
      artist.country =
        country.trim();
    }

    if (bio !== undefined) {
      artist.bio =
        bio.trim();
    }

    if (instagram !== undefined) {
      artist.instagram =
        instagram.trim();
    }

    if (youtube !== undefined) {
      artist.youtube =
        youtube.trim();
    }

    if (spotify !== undefined) {
      artist.spotify =
        spotify.trim();
    }

    if (followers !== undefined) {
      artist.followers =
        Number(followers) || 0;
    }

    if (status !== undefined) {
      artist.status =
        status === "Inactive"
          ? "Inactive"
          : "Active";
    }


    /* =====================================
       REMOVE IMAGE
    ===================================== */

    if (
      removeImage === "true" ||
      removeImage === true
    ) {
      if (artist.image) {
        deleteImageFile(
          artist.image
        );
      }

      artist.image = "";
    }


    /* =====================================
       NEW IMAGE
    ===================================== */

    if (req.file) {
      const oldImage =
        artist.image;

      artist.image =
        `/uploads/artists/${req.file.filename}`;

      if (oldImage) {
        deleteImageFile(
          oldImage
        );
      }
    }


    await artist.save();

    res.status(200).json({
      success: true,
      message: "Artist updated successfully",
      data: artist,
    });
  } catch (error) {
    console.error(
      "Update artist error:",
      error
    );

    if (req.file) {
      deleteImageFile(
        `/uploads/artists/${req.file.filename}`
      );
    }

    res.status(500).json({
      success: false,
      message: "Failed to update artist",
      error: error.message,
    });
  }
};


/* =========================================
   DELETE ARTIST
========================================= */

const deleteArtist = async (req, res) => {
  try {
    const artist =
      await Artist.findById(
        req.params.id
      );

    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artist not found",
      });
    }

    if (artist.image) {
      deleteImageFile(
        artist.image
      );
    }

    await Artist.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Artist deleted successfully",
      data: artist,
    });
  } catch (error) {
    console.error(
      "Delete artist error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete artist",
      error: error.message,
    });
  }
};


module.exports = {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
};