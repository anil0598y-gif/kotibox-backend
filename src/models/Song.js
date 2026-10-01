const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    /* =========================================
       BASIC INFO
    ========================================= */
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: "", trim: true },
    album: { type: String, default: "", trim: true },
    albumArtist: { type: String, default: "", trim: true },

    /* =========================================
       SPOTIFY-LIKE FIELDS
    ========================================= */
    trackNumber: { type: Number, default: 0 },
    discNumber: { type: Number, default: 1 },
    totalTracks: { type: Number, default: 0 },
    explicit: { type: Boolean, default: false },
    popularity: { type: Number, default: 0, min: 0, max: 100 },
    isrc: { type: String, default: "", trim: true },
    upc: { type: String, default: "", trim: true },
    catalogId: { type: String, default: "", trim: true },
    spotifyId: { type: String, default: "", trim: true },
    youtubeId: { type: String, default: "", trim: true },

    /* =========================================
       AUDIO DETAILS
    ========================================= */
    durationSeconds: { type: Number, default: 0 },
    duration: { type: String, default: "00:00" },
    audioQuality: {
      type: String,
      enum: ["128kbps", "192kbps", "256kbps", "320kbps", "Lossless", "Hi-Res"],
      default: "320kbps",
    },
    tempo: { type: Number, default: 0 },
    musicalKey: { type: String, default: "", trim: true },
    energy: { type: Number, default: 0, min: 0, max: 1 },
    danceability: { type: Number, default: 0, min: 0, max: 1 },
    valence: { type: Number, default: 0, min: 0, max: 1 },
    acousticness: { type: Number, default: 0, min: 0, max: 1 },
    instrumentalness: { type: Number, default: 0, min: 0, max: 1 },
    liveness: { type: Number, default: 0, min: 0, max: 1 },
    speechiness: { type: Number, default: 0, min: 0, max: 1 },

    /* =========================================
       GENRE / MOOD / TAGS
    ========================================= */
    genre: { type: String, default: "", trim: true },
    subGenre: { type: String, default: "", trim: true },
    genres: [{ type: String, trim: true }],
    moods: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    language: { type: String, default: "", trim: true },

    /* =========================================
       RELEASE INFO
    ========================================= */
    releaseDate: { type: String, default: "" },
    releaseYear: { type: Number, default: 0 },
    releaseType: {
      type: String,
      enum: ["Single", "Album", "EP", "Compilation", "Live", "Remix", "Cover"],
      default: "Single",
    },
    label: { type: String, default: "", trim: true },
    copyright: { type: String, default: "", trim: true },
    copyrightYear: { type: String, default: "" },
    publisher: { type: String, default: "", trim: true },

    /* =========================================
       CREDITS
    ========================================= */
    composer: { type: String, default: "", trim: true },
    lyricist: { type: String, default: "", trim: true },
    musicDirector: { type: String, default: "", trim: true },
    producer: { type: String, default: "", trim: true },
    mixingEngineer: { type: String, default: "", trim: true },
    masteringEngineer: { type: String, default: "", trim: true },
    featuredArtists: [{ type: String, trim: true }],

    /* =========================================
       MEDIA URLs
    ========================================= */
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    previewUrl: { type: String, default: "" },
    musicVideoUrl: { type: String, default: "" },
    lyricVideoUrl: { type: String, default: "" },
    lyrics: { type: String, default: "" },
    syncedLyrics: { type: String, default: "" },
    lyricsFileUrl: { type: String, default: "" },

    /* =========================================
       STATS
    ========================================= */
    plays: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    skipRate: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },

    /* =========================================
       STATUS / VISIBILITY
    ========================================= */
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
    isPremium: { type: Boolean, default: false },
    downloadable: { type: Boolean, default: false },
    scheduleDate: { type: String, default: "" },
    scheduleTime: { type: String, default: "" },

    /* =========================================
       TRENDING / CHARTS
    ========================================= */
    isTrending: { type: Boolean, default: false },
    trendScore: { type: Number, default: 0 },
    chartPosition: { type: Number, default: 0 },

    /* =========================================
       DESCRIPTION
    ========================================= */
    description: { type: String, default: "" },
    about: { type: String, default: "" },
  },
  { timestamps: true }
);

/* =========================================
   INDEXES FOR FAST SEARCH
========================================= */
songSchema.index({ title: "text", artist: "text", album: "text" });
songSchema.index({ genre: 1 });
songSchema.index({ language: 1 });
songSchema.index({ releaseYear: -1 });
songSchema.index({ plays: -1 });
songSchema.index({ popularity: -1 });
songSchema.index({ isTrending: 1, trendScore: -1 });
songSchema.index({ status: 1, visibility: 1 });
songSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Song", songSchema);