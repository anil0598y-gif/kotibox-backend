const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const upload = require("../middleware/upload");

const router = express.Router();

/* =========================================
   JWT SECRET
========================================= */
const JWT_SECRET =
  process.env.JWT_SECRET || "music-app-secret-key-2026";

/* =========================================
   GENERATE TOKEN
========================================= */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId, type: "user" },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
};

/* =========================================
   GENERATE 6-DIGIT OTP
========================================= */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* =========================================
   SEND OTP — EMAIL
========================================= */
const sendOTPEmail = async (email, otp) => {
  try {
    await sendEmail(
      email,
      "Your Login OTP - MelodyX",
      `Your OTP is: ${otp}. Valid for 10 minutes.`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">🎵 MelodyX Login</h2>
          <p>Your OTP for login is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #a855f7; font-size: 36px; letter-spacing: 8px; margin: 0;">
              ${otp}
            </h1>
          </div>
          <p style="color: #666;">This OTP is valid for 10 minutes.</p>
        </div>
      `
    );
    console.log("✅ OTP email sent to:", email);
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error.message);
  }
};

/* =========================================
   SEND OTP — PHONE (Console abhi)
========================================= */
const sendOTPPhone = async (phone, otp) => {
  console.log("=================================");
  console.log(`📱 OTP for +91${phone}: ${otp}`);
  console.log("=================================");
};

/* =========================================
   VERIFY TOKEN MIDDLEWARE
========================================= */
const verifyUserToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== "user") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/* =========================================
   ✅ 1. SEND PHONE OTP
========================================= */
router.post("/send-phone-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ phone: cleanPhone });

    if (user) {
      user.phoneOtp = otp;
      user.phoneOtpExpiry = otpExpiry;
      await user.save();
    } else {
      user = await User.create({
        name: "",
        email: "",
        phone: cleanPhone,
        password: "",
        phoneOtp: otp,
        phoneOtpExpiry: otpExpiry,
        role: "User",
        status: "Active",
      });
    }

    await sendOTPPhone(cleanPhone, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to your phone",
      phone: cleanPhone,
      isNewUser: !user.name,
      otp,
    });
  } catch (error) {
    console.error("SEND PHONE OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
});

/* =========================================
   ✅ 2. VERIFY PHONE OTP
========================================= */
router.post("/verify-phone-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.phoneOtp || user.phoneOtp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (!user.phoneOtpExpiry || user.phoneOtpExpiry < new Date()) {
      return res.status(401).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    user.phoneOtp = null;
    user.phoneOtpExpiry = null;
    user.lastLogin = new Date().toISOString();
    await user.save();

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.phoneOtp;
    delete userResponse.phoneOtpExpiry;

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: userResponse,
      isNewUser: !user.name,
    });
  } catch (error) {
    console.error("VERIFY PHONE OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
});

/* =========================================
   ✅ 3. COMPLETE REGISTRATION
========================================= */
router.post("/complete-registration", async (req, res) => {
  try {
    const { phone, name, username, email, password } = req.body;

    if (!phone || !name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const emailExists = await User.findOne({
      email: cleanEmail,
      _id: { $ne: user._id },
    });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    user.name = name.trim();
    user.username = username.trim();
    user.email = cleanEmail;
    user.password = password;
    user.joined = new Date().toISOString().split("T")[0];

    await user.save();

    const token = generateToken(user._id);

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Registration completed",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("COMPLETE REGISTRATION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to complete registration",
    });
  }
});

/* =========================================
   ✅ 4. RESEND PHONE OTP
========================================= */
router.post("/resend-phone-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.phoneOtp = otp;
    user.phoneOtpExpiry = otpExpiry;
    await user.save();

    await sendOTPPhone(cleanPhone, otp);

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      otp,
    });
  } catch (error) {
    console.error("RESEND PHONE OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to resend OTP",
    });
  }
});

/* =========================================
   ✅ EMAIL + PASSWORD ROUTES
========================================= */

router.post("/register", async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const user = await User.create({
      name: name.trim(),
      username: username?.trim() || cleanEmail.split("@")[0],
      email: cleanEmail,
      phone: phone?.trim() || "",
      password,
      role: "User",
      plan: "Free",
      status: "Active",
      joined: new Date().toISOString().split("T")[0],
    });

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to register",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    user.lastLogin = new Date().toISOString();
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(401).json({
        success: false,
        message: "OTP expired",
      });
    }

    user.otp = null;
    user.otpExpiry = null;
    user.lastLogin = new Date().toISOString();
    await user.save();

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
});

/* =========================================
   ✅ FORGOT PASSWORD — SEND OTP
========================================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not registered",
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(cleanEmail, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      email: cleanEmail,
      otp,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP",
    });
  }
});

/* =========================================
   ✅ VERIFY RESET OTP
========================================= */
router.post("/verify-reset-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(401).json({
        success: false,
        message: "OTP expired",
      });
    }

    const resetToken = jwt.sign(
      { id: user._id, type: "reset" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified",
      resetToken,
    });
  } catch (error) {
    console.error("VERIFY RESET OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify OTP",
    });
  }
});

/* =========================================
   ✅ RESET PASSWORD
========================================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const decoded = jwt.verify(resetToken, JWT_SECRET);

    if (decoded.type !== "reset") {
      return res.status(401).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Reset link expired. Please try again.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
});

/* =========================================
   GET PROFILE
========================================= */
router.get("/me", verifyUserToken, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* =========================================
   ✅ UPDATE PROFILE — WITH AVATAR UPLOAD
========================================= */
router.put(
  "/me",
  verifyUserToken,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { name, username, phone } = req.body;

      if (name !== undefined) req.user.name = name.trim();
      if (username !== undefined) req.user.username = username.trim();
      if (phone !== undefined) req.user.phone = phone.trim();

      // ✅ NEW AVATAR FILE UPLOADED
      if (req.file) {
        const imageUrl = `/uploads/users/${req.file.filename}`;

        console.log("📁 Avatar uploaded:", imageUrl);

        req.user.avatar = imageUrl;
        req.user.profileImage = imageUrl;
      }

      await req.user.save();

      res.status(200).json({
        success: true,
        message: "Profile updated",
        user: req.user,
      });
    } catch (error) {
      console.error("❌ Update profile error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

/* =========================================
   ✅ CHANGE PASSWORD
========================================= */
router.put("/change-password", verifyUserToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "No password set. Please set password first.",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
});

/* =========================================
   LOGOUT
========================================= */
router.post("/logout", verifyUserToken, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* =========================================
   EXPORT
========================================= */
module.exports = router;
module.exports.verifyUserToken = verifyUserToken;