const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/* =========================================
   CLOUDINARY CONFIG
========================================= */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "fhpolyec",
  api_key: process.env.CLOUDINARY_API_KEY || "887255579813446",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "uX8HkG0kSZbVIGieMlj6l_23Hno",
});

/* =========================================
   MONGOOSE MODELS
========================================= */

const Song = require("./src/models/Song");
const User = require("./src/models/User");
const Artist = require("./src/models/Artist");
const Album = require("./src/models/Album");
const Playlist = require("./src/models/Playlist");
const Media = require("./src/models/Media");
const Ad = require("./src/models/Ad");

/* =========================================
   UPLOAD HELPER
========================================= */

const uploadToCloudinary = async (filePath, folder) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return null;
    }

    const ext = path.extname(filePath).toLowerCase();
    let resourceType = "image";

    if ([".mp3", ".wav", ".m4a", ".aac"].includes(ext)) {
      resourceType = "video";
    } else if ([".mp4", ".mov", ".avi", ".mkv"].includes(ext)) {
      resourceType = "video";
    } else if ([".pdf", ".txt", ".doc"].includes(ext)) {
      resourceType = "raw";
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `kotibox/${folder}`,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    });

    return result.secure_url;
  } catch (error) {
    console.error(`❌ Upload failed for ${filePath}:`, error.message);
    return null;
  }
};

/* =========================================
   EXTRACT LOCAL PATH FROM URL
========================================= */

const getLocalPath = (url) => {
  if (!url) return null;

  if (url.includes("cloudinary.com")) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return null;
  }

  const cleanPath = url.replace(/^\/+/, "").replace(/^\\+/, "");
  const fullPath = path.join(__dirname, "public", cleanPath);

  return fullPath;
};

/* =========================================
   MIGRATE SONGS
========================================= */

const migrateSongs = async () => {
  console.log("\n========================================");
  console.log("🎵 MIGRATING SONGS");
  console.log("========================================");

  const songs = await Song.find();
  let updated = 0;

  for (const song of songs) {
    let changed = false;

    const coverLocalPath = getLocalPath(song.imageUrl || song.coverImage);
    if (coverLocalPath) {
      const newUrl = await uploadToCloudinary(coverLocalPath, "songs");
      if (newUrl) {
        song.imageUrl = newUrl;
        song.coverImage = newUrl;
        changed = true;
        console.log(`✅ Cover: ${song.title}`);
      }
    }

    const audioLocalPath = getLocalPath(song.audioUrl);
    if (audioLocalPath) {
      const newUrl = await uploadToCloudinary(audioLocalPath, "songs");
      if (newUrl) {
        song.audioUrl = newUrl;
        changed = true;
        console.log(`✅ Audio: ${song.title}`);
      }
    }

    if (changed) {
      await song.save();
      updated++;
    }
  }

  console.log(`\n📊 Songs updated: ${updated}/${songs.length}`);
};

/* =========================================
   MIGRATE ARTISTS
========================================= */

const migrateArtists = async () => {
  console.log("\n========================================");
  console.log("🎤 MIGRATING ARTISTS");
  console.log("========================================");

  const artists = await Artist.find();
  let updated = 0;

  for (const artist of artists) {
    const localPath = getLocalPath(artist.image);
    if (localPath) {
      const newUrl = await uploadToCloudinary(localPath, "artists");
      if (newUrl) {
        artist.image = newUrl;
        await artist.save();
        updated++;
        console.log(`✅ Artist: ${artist.name}`);
      }
    }
  }

  console.log(`\n📊 Artists updated: ${updated}/${artists.length}`);
};

/* =========================================
   MIGRATE ALBUMS
========================================= */

const migrateAlbums = async () => {
  console.log("\n========================================");
  console.log("💿 MIGRATING ALBUMS");
  console.log("========================================");

  const albums = await Album.find();
  let updated = 0;

  for (const album of albums) {
    const localPath = getLocalPath(album.image);
    if (localPath) {
      const newUrl = await uploadToCloudinary(localPath, "albums");
      if (newUrl) {
        album.image = newUrl;
        await album.save();
        updated++;
        console.log(`✅ Album: ${album.title}`);
      }
    }
  }

  console.log(`\n📊 Albums updated: ${updated}/${albums.length}`);
};

/* =========================================
   MIGRATE PLAYLISTS
========================================= */

const migratePlaylists = async () => {
  console.log("\n========================================");
  console.log("📋 MIGRATING PLAYLISTS");
  console.log("========================================");

  const playlists = await Playlist.find();
  let updated = 0;

  for (const playlist of playlists) {
    const localPath = getLocalPath(playlist.coverImage);
    if (localPath) {
      const newUrl = await uploadToCloudinary(localPath, "playlists");
      if (newUrl) {
        playlist.coverImage = newUrl;
        await playlist.save();
        updated++;
        console.log(`✅ Playlist: ${playlist.name}`);
      }
    }
  }

  console.log(`\n📊 Playlists updated: ${updated}/${playlists.length}`);
};

/* =========================================
   MIGRATE MEDIA
========================================= */

const migrateMedia = async () => {
  console.log("\n========================================");
  console.log("📁 MIGRATING MEDIA");
  console.log("========================================");

  const media = await Media.find();
  let updated = 0;

  for (const item of media) {
    const localPath = getLocalPath(item.url || item.fileUrl);
    if (localPath) {
      const newUrl = await uploadToCloudinary(localPath, "media");
      if (newUrl) {
        if (item.url) item.url = newUrl;
        if (item.fileUrl) item.fileUrl = newUrl;
        await item.save();
        updated++;
        console.log(`✅ Media: ${item.filename || item._id}`);
      }
    }
  }

  console.log(`\n📊 Media updated: ${updated}/${media.length}`);
};

/* =========================================
   MIGRATE USERS
========================================= */

const migrateUsers = async () => {
  console.log("\n========================================");
  console.log("👤 MIGRATING USERS");
  console.log("========================================");

  const users = await User.find();
  let updated = 0;

  for (const user of users) {
    let changed = false;

    const avatarLocalPath = getLocalPath(user.avatar);
    if (avatarLocalPath) {
      const newUrl = await uploadToCloudinary(avatarLocalPath, "users");
      if (newUrl) {
        user.avatar = newUrl;
        changed = true;
      }
    }

    const profileLocalPath = getLocalPath(user.profileImage);
    if (profileLocalPath) {
      const newUrl = await uploadToCloudinary(profileLocalPath, "users");
      if (newUrl) {
        user.profileImage = newUrl;
        changed = true;
      }
    }

    if (changed) {
      await user.save();
      updated++;
      console.log(`✅ User: ${user.name || user.email}`);
    }
  }

  console.log(`\n📊 Users updated: ${updated}/${users.length}`);
};

/* =========================================
   MAIN
========================================= */

const migrate = async () => {
  try {
    console.log("\n========================================");
    console.log("🚀 CLOUDINARY MIGRATION STARTED");
    console.log("========================================");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    await migrateSongs();
    await migrateArtists();
    await migrateAlbums();
    await migratePlaylists();
    await migrateMedia();
    await migrateUsers();

    console.log("\n========================================");
    console.log("🎉 MIGRATION COMPLETE!");
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ MIGRATION FAILED:", error);
    process.exit(1);
  }
};

migrate();
