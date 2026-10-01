const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

/*
  ⚠️ IMPORTANT:
  Ye file ADMIN side ki hai — ismein Admin middleware use hoga.
  Agar aapko User ka logout chahiye toh userAuthRoutes.js use karo.
*/

const { verifyAdminToken } = require("../middleware/authMiddleware");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-change-this";

/* =========================================
   HELPER: TOKEN GENERATE
========================================= */
const generateUserToken = (userId, email) => {
  return jwt.sign({ id: String(userId), email }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

/* =========================================
   ✅ GET ALL USERS  👈 NAYA — Admin panel ke liye
========================================= */
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -otp -phoneOtp -otpExpiry -phoneOtpExpiry")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
      data: users,
    });
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users",
    });
  }
});

/* =========================================
   ✅ GET USER BY ID  👈 NAYA
========================================= */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -otp -phoneOtp -otpExpiry -phoneOtpExpiry"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
      data: user,
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user",
    });
  }
});

/* =========================================
   ✅ UPDATE USER  👈 NAYA
========================================= */
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };

    // ✅ Password ko hash karo agar bheja gaya ho
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }

    // ✅ Sensitive fields remove kar do
    delete updates._id;
    delete updates.__v;
    delete updates.otp;
    delete updates.otpExpiry;
    delete updates.phoneOtp;
    delete updates.phoneOtpExpiry;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select("-password -otp -phoneOtp -otpExpiry -phoneOtpExpiry");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updated,
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update user",
    });
  }
});

/* =========================================
   ✅ DELETE USER  👈 NAYA
========================================= */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user",
    });
  }
});

/* =========================================
   REGISTER USER (ADMIN SIDE)
========================================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateUserToken(user._id, user.email);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================================
   LOGIN USER (ADMIN SIDE)
========================================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateUserToken(user._id, user.email);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================================
   GET MY PROFILE (ADMIN SIDE)
========================================= */
router.get("/profile/me", verifyAdminToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
      data: user,
    });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================================
   UPDATE PROFILE (ADMIN SIDE)
========================================= */
router.put("/profile/me", verifyAdminToken, async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, avatar },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
      data: user,
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================================
   CHANGE PASSWORD (ADMIN SIDE)
========================================= */
router.put("/change-password", verifyAdminToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new password are required",
      });
    }

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

/* =========================================
   LOGOUT USER (ADMIN SIDE)
========================================= */
router.post("/logout", verifyAdminToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("LOGOUT ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;