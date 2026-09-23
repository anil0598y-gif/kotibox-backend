const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    artist: {
      type: String,
      default: "",
      trim: true,
    },

    genre: {
      type: String,
      default: "Bollywood",
      trim: true,
    },

    language: {
      type: String,
      default: "Hindi",
      trim: true,
    },

    country: {
      type: String,
      default: "India",
      trim: true,
    },

    releaseDate: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    /* ✅ FIXED — Song references */
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

module.exports = mongoose.model("Album", albumSchema);
