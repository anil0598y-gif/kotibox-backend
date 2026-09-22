const express = require("express");

const upload = require("../middleware/upload");

const {
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} = require("../controllers/albumController");

const router = express.Router();

/* =========================================
   GET ALL ALBUMS
========================================= */

router.get("/", getAlbums);

/* =========================================
   GET ALBUM BY ID
========================================= */

router.get("/:id", getAlbumById);

/* =========================================
   CREATE ALBUM
   Image field: image
========================================= */

router.post(
  "/",
  upload.single("image"),
  createAlbum
);

/* =========================================
   UPDATE ALBUM
   Image field: image
   Remove image: removeImage
========================================= */

router.put(
  "/:id",
  upload.single("image"),
  updateAlbum
);

/* =========================================
   DELETE ALBUM
========================================= */

router.delete(
  "/:id",
  deleteAlbum
);

module.exports = router;