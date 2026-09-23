const User = require("../models/User");
const fs = require("fs");
const path = require("path");

/* =========================================
   DELETE USER IMAGE
========================================= */

const deleteUserImage = (imagePath) => {
  if (!imagePath) {
    return;
  }

  if (
    !imagePath.startsWith("/uploads/users/")
  ) {
    return;
  }

  const filePath = path.join(
    __dirname,
    "../../public",
    imagePath
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/* =========================================
   GET ALL USERS
========================================= */

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
      data: users,
    });
  } catch (error) {
    console.error(
      "❌ Get users error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

/* =========================================
   GET SINGLE USER
========================================= */

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      user,
    });
  } catch (error) {
    console.error(
      "❌ Get user error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

/* =========================================
   CREATE USER
========================================= */

const createUser = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      role,
      plan,
      status,
      songsPlayed,
      likedSongs,
      playlists,
      joined,
      lastLogin,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    /* =====================================
       CHECK EMAIL
    ===================================== */

    const existingUser =
      await User.findOne({
        email: email.trim(),
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    /* =====================================
       IMAGE
    ===================================== */

    let imageUrl = "";

    if (req.file) {
      imageUrl =
        req.file.path;
    }

    /* =====================================
       CREATE USER
    ===================================== */

    const user = await User.create({
      name: name.trim(),
      username: username || "",
      email: email.trim(),
      phone: phone || "",
      role: role || "User",
      plan: plan || "Free",
      status: status || "Active",

      avatar: imageUrl,
      profileImage: imageUrl,

      songsPlayed:
        Number(songsPlayed) || 0,

      likedSongs:
        Number(likedSongs) || 0,

      playlists:
        Number(playlists) || 0,

      joined:
        joined || new Date().toISOString(),

      lastLogin:
        lastLogin || "",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
      user,
    });
  } catch (error) {
    console.error(
      "❌ Create user error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

/* =========================================
   UPDATE USER
========================================= */

const updateUser = async (req, res) => {
  try {
    const user =
      await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const {
      name,
      username,
      email,
      phone,
      role,
      plan,
      status,
      songsPlayed,
      likedSongs,
      playlists,
      joined,
      lastLogin,
      imageRemoved,
    } = req.body;

    /* =====================================
       EMAIL DUPLICATE CHECK
    ===================================== */

    if (email !== undefined) {
      const emailValue =
        String(email).trim();

      const existingUser =
        await User.findOne({
          email: emailValue,
          _id: {
            $ne: user._id,
          },
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "A user with this email already exists",
        });
      }

      user.email = emailValue;
    }

    /* =====================================
       BASIC DATA
    ===================================== */

    if (name !== undefined) {
      user.name = String(name).trim();
    }

    if (username !== undefined) {
      user.username = username;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (plan !== undefined) {
      user.plan = plan;
    }

    if (status !== undefined) {
      user.status = status;
    }

    if (songsPlayed !== undefined) {
      user.songsPlayed =
        Number(songsPlayed) || 0;
    }

    if (likedSongs !== undefined) {
      user.likedSongs =
        Number(likedSongs) || 0;
    }

    if (playlists !== undefined) {
      user.playlists =
        Number(playlists) || 0;
    }

    if (joined !== undefined) {
      user.joined = joined;
    }

    if (lastLogin !== undefined) {
      user.lastLogin = lastLogin;
    }

    /* =====================================
       REMOVE OLD IMAGE
    ===================================== */

    if (
      imageRemoved === "true" ||
      imageRemoved === true
    ) {
      deleteUserImage(user.avatar);

      user.avatar = "";
      user.profileImage = "";
    }

    /* =====================================
       NEW IMAGE
    ===================================== */

    if (req.file) {

      /* Delete old image first */

      deleteUserImage(user.avatar);

      const newImage =
        req.file.path;

      user.avatar = newImage;
      user.profileImage = newImage;
    }

    /* =====================================
       SAVE
    ===================================== */

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
      user,
    });
  } catch (error) {
    console.error(
      "❌ Update user error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

/* =========================================
   DELETE USER
========================================= */

const deleteUser = async (req, res) => {
  try {
    const user =
      await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* Delete image */

    deleteUserImage(user.avatar);

    /* Delete user */

    await User.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(
      "❌ Delete user error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

/* =========================================
   EXPORTS
========================================= */

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
