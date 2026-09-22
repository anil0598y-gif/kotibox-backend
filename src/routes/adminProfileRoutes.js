const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  getMyProfile,
  updateMyProfile,
  createDefaultAdmin,
} = require("../controllers/adminController");

const {
  verifyAdminToken,
} = require("../middleware/authMiddleware");

/* PUBLIC ROUTES */

router.post("/setup", createDefaultAdmin);
router.post("/login", loginAdmin);

/* PROTECTED ROUTES */

router.get(
  "/me",
  verifyAdminToken,
  getMyProfile
);

router.put(
  "/me",
  verifyAdminToken,
  updateMyProfile
);

module.exports = router;