const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    device: { type: String, default: "Unknown" },
    browser: { type: String, default: "Unknown" },
    os: { type: String, default: "Unknown" },
    location: { type: String, default: "" },

    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
    },

    loginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "LoginHistory",
  loginHistorySchema
);
