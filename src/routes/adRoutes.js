const express = require("express");

const router = express.Router();

const {
  getAds,
  getAdById,
  createAd,
  updateAd,
  deleteAd,
} = require("../controllers/adController");

router.get("/", getAds);
router.get("/:id", getAdById);
router.post("/", createAd);
router.put("/:id", updateAd);
router.delete("/:id", deleteAd);

module.exports = router;
