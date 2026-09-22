const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },

    fileName: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      default: "Audio",
      trim: true,
    },

    format: {
      type: String,
      default: "",
      trim: true,
    },

    size: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: String,
      default: "",
      trim: true,
    },

    artist: {
      type: String,
      default: "",
      trim: true,
    },

    album: {
      type: String,
      default: "",
      trim: true,
    },

    genre: {
      type: String,
      default: "",
      trim: true,
    },

    language: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      Media kis module/page ke liye use ho raha hai.
      Examples:
      Song Library
      Playlist
      Artist
      Album
      User
      Ads
      Other
    */
    usedFor: {
      type: String,
      default: "Other",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Inactive",
        "Archived",
      ],
      default: "Active",
    },

    /*
      Public URL
      Example:
      /uploads/media/12345-song.mp3
    */
    url: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      Actual server file path.
      Isse delete/update ke time physical
      file ko public/uploads/media se delete
      kar sakenge.
    */
    filePath: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      File ka MIME type.
      Example:
      audio/mpeg
      image/jpeg
      video/mp4
    */
    fileType: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      Original uploaded file ka naam.
    */
    originalFileName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Media",
    mediaSchema
  );