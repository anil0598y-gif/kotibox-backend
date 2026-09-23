const mongoose = require("mongoose");

const adNetworkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    provider: {
      type: String,
      default: "",
    },

    publisherId: {
      type: String,
      default: "",
    },

    apiKey: {
      type: String,
      default: "",
    },

    scriptCode: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    revenueShare: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AdNetwork",
  adNetworkSchema
);
