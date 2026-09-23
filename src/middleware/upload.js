const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/* =========================================================
   CLOUDINARY CONFIG
========================================================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "fhpolyec",
  api_key: process.env.CLOUDINARY_API_KEY || "887255579813446",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "uX8HkG0kSZbVIGieMlj6l_23Hno",
});

/* =========================================================
   CLOUDINARY STORAGE
========================================================= */

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,

  params: async (req, file) => {
    /* =====================================================
       FOLDER DECIDE KARO (req.baseUrl se)
    ===================================================== */

    let folder = "kotibox";

    if (req.baseUrl.includes("/songs")) {
      folder = "kotibox/songs";
    } else if (req.baseUrl.includes("/artists")) {
      folder = "kotibox/artists";
    } else if (req.baseUrl.includes("/albums")) {
      folder = "kotibox/albums";
    } else if (req.baseUrl.includes("/playlists")) {
      folder = "kotibox/playlists";
    } else if (req.baseUrl.includes("/media")) {
      folder = "kotibox/media";
    } else if (
      req.baseUrl.includes("/users") ||
      req.baseUrl.includes("/user")
    ) {
      folder = "kotibox/users";
    } else if (req.baseUrl.includes("/ads")) {
      if (file.mimetype && file.mimetype.startsWith("image/")) {
        folder = "kotibox/ads/images";
      } else if (file.mimetype && file.mimetype.startsWith("video/")) {
        folder = "kotibox/ads/videos";
      } else {
        folder = "kotibox/ads";
      }
    }

    /* =====================================================
       RESOURCE TYPE DECIDE KARO
    ===================================================== */

    let resourceType = "image";

    if (file.mimetype && file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype && file.mimetype.startsWith("video/")) {
      resourceType = "video";
    } else if (file.mimetype && file.mimetype.startsWith("audio/")) {
      resourceType = "video"; // Cloudinary audio ko video me rakhta hai
    } else {
      resourceType = "raw"; // Docs, PDFs
    }

    return {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "jfif",
        "mp3",
        "wav",
        "m4a",
        "mp4",
        "mov",
        "avi",
        "pdf",
        "txt",
      ],
    };
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

    return cb(new Error("Unsupported Media Library file type"));
  }

  /* =======================================================
     ADS — mediaFile (image or video)
  ======================================================= */

  if (fieldName === "mediaFile" || fieldName === "media") {
    if (
      file.mimetype &&
      (file.mimetype.startsWith("image/") ||
        file.mimetype.startsWith("video/"))
    ) {
      return cb(null, true);
    }

    return cb(new Error("Ad media must be an image or video file"));
  }

  /* =======================================================
     ADS — thumbnailFile (image only)
  ======================================================= */

  if (fieldName === "thumbnailFile") {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }

    return cb(new Error("Ad thumbnail must be an image"));
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
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }

    return cb(new Error("Only image files are allowed"));
  }

  /* =======================================================
     AUDIO
  ======================================================= */

  if (fieldName === "audio" || fieldName === "audioFile") {
    if (file.mimetype && file.mimetype.startsWith("audio/")) {
      return cb(null, true);
    }

    return cb(new Error("Only audio files are allowed"));
  }

  /* =======================================================
     VIDEO
  ======================================================= */

  if (fieldName === "musicVideo" || fieldName === "lyricVideo") {
    if (file.mimetype && file.mimetype.startsWith("video/")) {
      return cb(null, true);
    }

    return cb(new Error("Only video files are allowed"));
  }

  /* =======================================================
     LYRICS FILE
  ======================================================= */

  if (fieldName === "lyricsFile") {
    const allowedExtensions = [".txt", ".lrc", ".srt", ".vtt"];

    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
      return cb(null, true);
    }

    return cb(new Error("Lyrics file must be TXT, LRC, SRT or VTT"));
  }

  /* =======================================================
     UNSUPPORTED FIELD
  ======================================================= */

  return cb(new Error(`Unsupported upload field: ${fieldName}`));
};

/* =========================================================
   MULTER
========================================================= */

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
});

module.exports = upload;