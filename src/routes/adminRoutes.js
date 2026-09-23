const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  getMyProfile,
  updateMyProfile,
  updateMyProfileWithImage,
  createDefaultAdmin,
  changePassword,
  logoutAllDevices,
  deactivateAccount,
  uploadMiddleware,
} = require("../controllers/adminController");

const {
  getMyLoginHistory,
  clearMyLoginHistory,
} = require("../controllers/loginHistoryController");

const {
  verifyAdminToken,
} = require("../middleware/authMiddleware");

/* =========================================================
   PUBLIC ROUTES
========================================================= */

router.post("/setup", createDefaultAdmin);
router.post("/login", loginAdmin);

/* =========================================================
   PROTECTED ROUTES
========================================================= */

router.get("/me", verifyAdminToken, getMyProfile);

router.put(
  "/me",
  verifyAdminToken,
  uploadMiddleware,
  updateMyProfileWithImage
);

router.put(
  "/change-password",
  verifyAdminToken,
  changePassword
);

router.put(
  "/logout-all",
  verifyAdminToken,
  logoutAllDevices
);

router.put(
  "/deactivate",
  verifyAdminToken,
  deactivateAccount
);

/* LOGIN HISTORY */
router.get(
  "/login-history",
  verifyAdminToken,
  getMyLoginHistory
);

router.delete(
  "/login-history",
  verifyAdminToken,
  clearMyLoginHistory
);

module.exports = router;
