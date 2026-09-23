const path = require("path");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

const Admin = require("../models/Admin");
const LoginHistory = require("../models/LoginHistory");
const {
  generateToken,
} = require("../middleware/authMiddleware");

/* =========================================================
   CLOUDINARY CONFIG
========================================================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "fhpolyec",
  api_key: process.env.CLOUDINARY_API_KEY || "887255579813446",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "uX8HkG0kSZbVIGieMlj6l_23Hno",
});

/* =========================================================
   CLOUDINARY STORAGE (Admin avatar upload)
========================================================= */

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kotibox/admins",
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "jfif"],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, /* 5MB */
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"), false);
    }
  },
});

exports.uploadMiddleware = upload.single("avatar");

/* =========================================================
   HELPER: PARSE USER AGENT
========================================================= */

const parseUserAgent = (userAgent = "") => {
  let device = "Desktop";
  let browser = "Unknown";
  let os = "Unknown";

  if (/mobile|android|iphone/i.test(userAgent)) {
    device = "Mobile";
  } else if (/tablet|ipad/i.test(userAgent)) {
    device = "Tablet";
  }

  if (/chrome/i.test(userAgent)) browser = "Chrome";
  else if (/firefox/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent)) browser = "Safari";
  else if (/edge|edg/i.test(userAgent)) browser = "Edge";
  else if (/opera|opr/i.test(userAgent)) browser = "Opera";

  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/mac os/i.test(userAgent)) os = "macOS";
  else if (/linux/i.test(userAgent)) os = "Linux";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/iphone|ipad|ios/i.test(userAgent)) os = "iOS";

  return { device, browser, os };
};

/* =========================================================
   HELPER: SAVE LOGIN HISTORY
========================================================= */

const saveLoginHistory = async (
  adminId,
  req,
  status = "success"
) => {
  try {
    const userAgent =
      req.headers["user-agent"] || "";

    const { device, browser, os } =
      parseUserAgent(userAgent);

    await LoginHistory.create({
      admin: adminId,
      ip:
        req.ip ||
        req.connection?.remoteAddress ||
        req.headers["x-forwarded-for"] ||
        "",
      userAgent,
      device,
      browser,
      os,
      status,
    });
  } catch (error) {
    console.warn(
      "Login history save failed:",
      error.message
    );
  }
};

/* =========================================================
   LOGIN ADMIN
========================================================= */

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const admin = await Admin.findOne({
      email: String(email).toLowerCase().trim(),
    }).select("+password");

    if (!admin) {
      await saveLoginHistory(null, req, "failed");

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      await saveLoginHistory(admin._id, req, "failed");

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (admin.status === "Inactive") {
      return res.status(403).json({
        success: false,
        message:
          "Account is deactivated. Contact support.",
      });
    }

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = generateToken(
      admin._id,
      admin.email,
      admin.tokenVersion || 0
    );

    await saveLoginHistory(admin._id, req, "success");

    const adminData = admin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      data: adminData,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

/* =========================================================
   GET MY PROFILE
========================================================= */

exports.getMyProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select(
      "-password"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   UPDATE MY PROFILE — WITH IMAGE (multipart/form-data)
========================================================= */

exports.updateMyProfileWithImage = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      phone,
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (username !== undefined)
      updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    /* ✅ अगर नई image upload हुई है */
    if (req.file) {
      // ✅ Cloudinary full URL
      const imageUrl = req.file.path;

      updateData.avatar = imageUrl;
      updateData.profileImage = imageUrl;
    }

    /* ✅ अगर image remove करनी है */
    if (req.body.removeImage === "true") {
      updateData.avatar = "";
      updateData.profileImage = "";
    }

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: admin,
    });
  } catch (error) {
    console.error(
      "UPDATE PROFILE WITH IMAGE ERROR:",
      error
    );

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   UPDATE MY PROFILE (JSON only — backward compatibility)
========================================================= */

exports.updateMyProfile = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      avatar,
      profileImage,
    } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const img = avatar || profileImage;
    if (img !== undefined) {
      updateData.avatar = img;
      updateData.profileImage = img;
    }

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: admin,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const admin = await Admin.findById(
      req.admin.id
    ).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await admin.comparePassword(
      currentPassword
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.password = newPassword;

    /* ✅ पुराने सारे tokens invalid करो */
    admin.tokenVersion =
      (admin.tokenVersion || 0) + 1;

    await admin.save();

    /* ✅ नया token दो (current session के लिए) */
    const newToken = generateToken(
      admin._id,
      admin.email,
      admin.tokenVersion
    );

    res.status(200).json({
      success: true,
      message:
        "Password updated. All other sessions logged out.",
      token: newToken,
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   LOGOUT FROM ALL DEVICES
========================================================= */

exports.logoutAllDevices = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    admin.tokenVersion =
      (admin.tokenVersion || 0) + 1;

    await admin.save();

    res.status(200).json({
      success: true,
      message:
        "Logged out from all devices. Please login again.",
    });
  } catch (error) {
    console.error("LOGOUT ALL ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   ACCOUNT DEACTIVATION
========================================================= */

exports.deactivateAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password required to deactivate",
      });
    }

    const admin = await Admin.findById(
      req.admin.id
    ).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    admin.status = "Inactive";
    admin.tokenVersion =
      (admin.tokenVersion || 0) + 1;

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Account deactivated",
    });
  } catch (error) {
    console.error("DEACTIVATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================================
   CREATE DEFAULT ADMIN (setup)
========================================================= */

exports.createDefaultAdmin = async (req, res) => {
  try {
    const existing = await Admin.findOne({
      email: "anil0598y@gmail.com",
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Admin already exists",
        data: {
          _id: existing._id,
          email: existing.email,
        },
      });
    }

    const admin = await Admin.create({
      name: "Anil",
      username: "anil",
      email: "anil0598y@gmail.com",
      password: "1234567",
      phone: "+91 98765 43210",
      role: "Administrator",
      status: "Active",
    });

    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: "Default admin created",
      data: adminData,
    });
  } catch (error) {
    console.error("SETUP ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};