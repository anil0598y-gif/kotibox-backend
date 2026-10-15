const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    image: { type: String, default: "" },
    type: { type: String, default: "Singer", trim: true },
    genre: { type: String, default: "Bollywood", trim: true },
    language: { type: String, default: "Hindi", trim: true },
    country: { type: String, default: "India", trim: true },
    bio: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    youtube: { type: String, default: "", trim: true },
    spotify: { type: String, default: "", trim: true },
    followers: { type: Number, default: 0 },

    songs: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
    ],
    albums: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Album" },
    ],

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

/* ✅ Text index hata diya — Hindi language support nahi hai MongoDB me */
artistSchema.index({ status: 1 });

module.exports = mongoose.model("Artist", artistSchema);