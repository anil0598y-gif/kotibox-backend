const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: "", trim: true },
    album: { type: String, default: "", trim: true },
    genre: { type: String, default: "", trim: true },
    language: { type: String, default: "", trim: true },
    releaseDate: { type: String, default: "" },
    duration: { type: String, default: "00:00" },
    description: { type: String, default: "" },
    plays: { type: Number, default: 0 },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    musicVideoUrl: { type: String, default: "" },
    lyricVideoUrl: { type: String, default: "" },
    lyricsFileUrl: { type: String, default: "" },
    isrc: { type: String, default: "", trim: true },
    catalogId: { type: String, default: "", trim: true },
    composer: { type: String, default: "", trim: true },
    lyricist: { type: String, default: "", trim: true },
    musicDirector: { type: String, default: "", trim: true },
    producer: { type: String, default: "", trim: true },
    copyright: { type: String, default: "", trim: true },
    publisher: { type: String, default: "", trim: true },
    copyrightYear: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Published", "Draft", "Scheduled", "Archived", "Inactive"],
      default: "Draft",
    },
    visibility: {
      type: String,
      enum: ["Public", "Private", "Unlisted"],
      default: "Public",
    },
    scheduleDate: { type: String, default: "" },
    scheduleTime: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Song", songSchema);
