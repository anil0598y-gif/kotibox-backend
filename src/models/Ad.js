const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["video", "image", "custom"],
      default: "video",
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    advertiser: {
      type: String,
      default: "",
    },

    targetUrl: {
      type: String,
      default: "",
    },

    contentType: {
      type: String,
      default: "All Content",
    },

    targetTitles: {
      type: [String],
      default: [],
    },

    placements: {
      type: [String],
      default: ["video-player"],
    },

    placement: {
      type: String,
      default: "",
    },

    customScript: {
      type: String,
      default: "",
    },

    duration: {
      type: Number,
      default: 0,
    },

    skipAfter: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: String,
      default: "",
    },

    endDate: {
      type: String,
      default: "",
    },

    priority: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },

    /* Media URLs (from media library) */
    mediaUrl: {
      type: String,
      default: "",
    },

    mediaFileName: {
      type: String,
      default: "",
    },

    thumbnailUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ad", adSchema);
