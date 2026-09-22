const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    genre: {
      type: String,
      default: "Bollywood",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    coverImage: {
      type: String,
      default: "",
    },

    /* =========================================
       ✅ UPDATED — Flexible createdBy
       - Admin panel: String ("Admin")
       - User app: ObjectId (User reference)
    ========================================= */

    createdBy: {
      type: mongoose.Schema.Types.Mixed,
      default: "Admin",
    },

    /* ✅ NEW — User reference (agar user ने बनाई) */
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ✅ NEW — Public/Private playlist */
    isPublic: {
      type: Boolean,
      default: true,
    },

    /* ✅ NEW — User-created flag */
    userPlaylist: {
      type: Boolean,
      default: false,
    },

    songs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Playlist",
  playlistSchema
);