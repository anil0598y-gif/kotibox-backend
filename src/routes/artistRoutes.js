const express = require("express");

const upload = require("../middleware/upload");

const {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
} = require("../controllers/artistController");

const router = express.Router();


/* =========================================
   GET ALL ARTISTS
   GET /api/artists
========================================= */

router.get(
  "/",
  getArtists
);


/* =========================================
   GET SINGLE ARTIST
   GET /api/artists/:id
========================================= */

router.get(
  "/:id",
  getArtistById
);


/* =========================================
   CREATE ARTIST
   POST /api/artists

   FormData:
   image
   name
   type
   genre
   language
   country
   bio
   instagram
   youtube
   spotify
   followers
   status
========================================= */

router.post(
  "/",
  upload.single("image"),
  createArtist
);


/* =========================================
   UPDATE ARTIST
   PUT /api/artists/:id
========================================= */

router.put(
  "/:id",
  upload.single("image"),
  updateArtist
);


/* =========================================
   DELETE ARTIST
   DELETE /api/artists/:id
========================================= */

router.delete(
  "/:id",
  deleteArtist
);


module.exports = router;
