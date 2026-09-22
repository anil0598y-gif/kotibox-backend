const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

    username: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    /* =========================================
       ✅ PHONE — unique NAHI, kyunki phone optional hai
       (direct register me phone nahi le rahe)
    ========================================= */
    phone: {
      type: String,
      default: "",
      trim: true,
      // unique: true,   ← HATA diya
      // sparse: true,   ← HATA diya
    },

    password: {
      type: String,
      default: "",
    },

    /* ✅ EMAIL OTP */
    otp: {
      type: String,
      default: null,
    },

    otpExpiry: {
      type: Date,
      default: null,
    },

    /* ✅ PHONE OTP */
    phoneOtp: {
      type: String,
      default: null,
    },

    phoneOtpExpiry: {
      type: Date,
      default: null,
    },

    role: {
      type: String,
      default: "User",
    },

    plan: {
      type: String,
      default: "Free",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    avatar: {
      type: String,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    songsPlayed: {
      type: Number,
      default: 0,
    },

    likedSongs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
    ],

    followedArtists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],

    recentlyPlayed: [
      {
        song: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Song",
        },
        playedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    userPlaylists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist",
      },
    ],

    playlists: {
      type: Number,
      default: 0,
    },

    joined: {
      type: String,
      default: "",
    },

    lastLogin: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

/* =========================================
   HASH PASSWORD BEFORE SAVE
========================================= */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  if (!this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* =========================================
   COMPARE PASSWORD METHOD
========================================= */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);