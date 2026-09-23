const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phone: { type: String, default: "" },
    role: { type: String, default: "Administrator" },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    avatar: { type: String, default: "" },
    profileImage: { type: String, default: "" },

    /* ✅ NAYA: Token version (password change, logout-all पर बढ़ता है) */
    tokenVersion: {
      type: Number,
      default: 0,
    },

    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

/* HASH PASSWORD BEFORE SAVE */
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* COMPARE PASSWORD */
adminSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
