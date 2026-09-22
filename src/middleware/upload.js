const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================================================
   STORAGE
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = path.join(
      __dirname,
      "../../public/uploads"
    );

    /* =====================================================
       SONGS
    ===================================================== */

    if (req.baseUrl.includes("/songs")) {
      folder = path.join(
        __dirname,
        "../../public/uploads/songs"
      );
    }

    /* =====================================================
       ARTISTS
    ===================================================== */

    else if (req.baseUrl.includes("/artists")) {
      folder = path.join(
        __dirname,
        "../../public/uploads/artists"
      );
    }

    /* =====================================================
       ALBUMS
    ===================================================== */

    else if (req.baseUrl.includes("/albums")) {
      folder = path.join(
        __dirname,
        "../../public/uploads/albums"
      );
    }

    /* =====================================================
       PLAYLISTS
    ===================================================== */

    else if (req.baseUrl.includes("/playlists")) {
      folder = path.join(
        __dirname,
        "../../public/uploads/playlists"
      );
    }

    /* =====================================================
       MEDIA LIBRARY
    ===================================================== */

    else if (req.baseUrl.includes("/media")) {
      folder = path.join(
        __dirname,
        "../../public/uploads/media"
      );
    }

    /* =====================================================
       USERS
       ✅ FIXED: /user aur /users dono check karo
    ===================================================== */

    else if (
      req.baseUrl.includes("/users") ||
      req.baseUrl.includes("/user")
    ) {
      folder = path.join(
        __dirname,
        "../../public/uploads/users"
      );
    }

    /* =====================================================
       ADS
    ===================================================== */

    else if (req.baseUrl.includes("/ads")) {
      if (
        file.mimetype &&
        file.mimetype.startsWith("image/")
      ) {
        folder = path.join(
          __dirname,
          "../../public/uploads/ads/images"
        );
      } else if (
        file.mimetype &&
        file.mimetype.startsWith("video/")
      ) {
        folder = path.join(
          __dirname,
          "../../public/uploads/ads/videos"
        );
      } else {
        folder = path.join(
          __dirname,
          "../../public/uploads/ads"
        );
      }
    }

    /* =====================================================
       CREATE DIRECTORY
    ===================================================== */

    fs.mkdirSync(folder, {
      recursive: true,
    });

    cb(null, folder);
  },

  /* =======================================================
     FILE NAME
  ======================================================= */

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9);

    const extension = path.extname(
      file.originalname
    );

    cb(null, uniqueName + extension);
  },
});

/* =========================================================
   FILE FILTER
========================================================= */

const fileFilter = (req, file, cb) => {
  const fieldName = file.fieldname;

  /* =======================================================
     MEDIA LIBRARY
     upload.single("file") — image, audio, video, doc
  ======================================================= */

  if (fieldName === "file") {
    if (
      file.mimetype &&
      (file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("audio/") ||
        file.mimetype.startsWith("video/") ||
        file.mimetype === "text/plain" ||
        file.mimetype === "application/pdf")
    ) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Unsupported Media Library file type"
      )
    );
  }

  /* =======================================================
     ✅ ADS — mediaFile (image or video)
  ======================================================= */

  if (
    fieldName === "mediaFile" ||
    fieldName === "media"
  ) {
    if (
      file.mimetype &&
      (file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/"))
    ) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Ad media must be an image or video file"
      )
    );
  }

  /* =======================================================
     ✅ ADS — thumbnailFile (image only)
  ======================================================= */

  if (fieldName === "thumbnailFile") {
    if (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    ) {
      return cb(null, true);
    }

    return cb(
      new Error("Ad thumbnail must be an image")
    );
  }

  /* =======================================================
     IMAGE
  ======================================================= */

  if (
    fieldName === "image" ||
    fieldName === "coverImage" ||
    fieldName === "imageFile" ||
    fieldName === "profileImage" ||
    fieldName === "avatar"
  ) {
    if (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    ) {
      return cb(null, true);
    }

    return cb(
      new Error("Only image files are allowed")
    );
  }

  /* =======================================================
     AUDIO
  ======================================================= */

  if (
    fieldName === "audio" ||
    fieldName === "audioFile"
  ) {
    if (
      file.mimetype &&
      file.mimetype.startsWith("audio/")
    ) {
      return cb(null, true);
    }

    return cb(
      new Error("Only audio files are allowed")
    );
  }

  /* =======================================================
     VIDEO
  ======================================================= */

  if (
    fieldName === "musicVideo" ||
    fieldName === "lyricVideo"
  ) {
    if (
      file.mimetype &&
      file.mimetype.startsWith("video/")
    ) {
      return cb(null, true);
    }

    return cb(
      new Error("Only video files are allowed")
    );
  }

  /* =======================================================
     LYRICS FILE
  ======================================================= */

  if (fieldName === "lyricsFile") {
    const allowedExtensions = [
      ".txt",
      ".lrc",
      ".srt",
      ".vtt",
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (allowedExtensions.includes(extension)) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Lyrics file must be TXT, LRC, SRT or VTT"
      )
    );
  }

  /* =======================================================
     UNSUPPORTED FIELD
  ======================================================= */

  return cb(
    new Error(
      `Unsupported upload field: ${fieldName}`
    )
  );
};

/* =========================================================
   MULTER
========================================================= */

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 500 * 1024 * 1024, /* 500 MB */
  },
});

module.exports = upload;