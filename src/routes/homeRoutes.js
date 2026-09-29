const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController");

/* =========================================================
   HOME PAGE ROUTES
========================================================= */

router.get("/trending", homeController.getTrending);
router.get("/new-releases", homeController.getNewReleases);
router.get("/top-artists", homeController.getTopArtists);
router.get("/jump-back-in", homeController.getJumpBackIn);
router.get("/made-for-you", homeController.getMadeForYou);
router.get("/recommended", homeController.getRecommended);
router.get("/editors-picks", homeController.getEditorsPicks);
router.get("/top-mixes", homeController.getTopMixes);

// Single request me sab kuch (fast loading)
router.get("/all", homeController.getAllHomeData);

module.exports = router;