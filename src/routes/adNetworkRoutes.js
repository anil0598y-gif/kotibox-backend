const express = require("express");

const router = express.Router();

const {
  getAdNetworks,
  getAdNetworkById,
  createAdNetwork,
  updateAdNetwork,
  deleteAdNetwork,
} = require("../controllers/adNetworkController");

router.get("/", getAdNetworks);
router.get("/:id", getAdNetworkById);
router.post("/", createAdNetwork);
router.put("/:id", updateAdNetwork);
router.delete("/:id", deleteAdNetwork);

module.exports = router;