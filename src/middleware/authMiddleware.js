const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-key-change-this";

/* =========================================================
   VERIFY TOKEN
========================================================= */

exports.verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    /* ✅ Admin check करो + tokenVersion verify */
    const admin = await Admin.findById(decoded.id).select(
      "tokenVersion status"
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.status === "Inactive") {
      return res.status(401).json({
        success: false,
        message: "Account deactivated",
      });
    }

    if (
      admin.tokenVersion !== undefined &&
      decoded.tokenVersion !== undefined &&
      admin.tokenVersion !== decoded.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired. Please login again.",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    console.error(
      "Token verification failed:",
      error.message
    );

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid token. Please login again.",
    });
  }
};

/* =========================================================
   GENERATE TOKEN
========================================================= */

exports.generateToken = (
  adminId,
  email,
  tokenVersion = 0
) => {
  return jwt.sign(
    {
      id: String(adminId),
      email: email,
      tokenVersion: tokenVersion,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

exports.JWT_SECRET = JWT_SECRET;
