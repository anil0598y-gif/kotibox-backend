/* =========================================
   ONE-TIME SCRIPT: Sync Artists from Songs
   Chalane ka tarika:
     cd ~/Desktop/song-backend
     node syncArtists.js
========================================= */

require("dotenv").config();
const mongoose = require("mongoose");

const Song = require("./src/models/Song");
const Artist = require("./src/models/Artist");

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env file");
  process.exit(1);
}

const parseNames = (str) =>
  String(str || "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

const run = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const songs = await Song.find({}, { artist: 1, imageUrl: 1 });
    console.log(`📀 Found ${songs.length} songs\n`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const song of songs) {
      const names = parseNames(song.artist);

      if (names.length === 0) {
        skippedCount++;
        continue;
      }

      for (const name of names) {
        let artist = await Artist.findOne({
          name: { $regex: `^${name}$`, $options: "i" },
        });

        if (!artist) {
          await Artist.create({
            name,
            image: song.imageUrl || "",
            type: "Singer",
            genre: "Bollywood",
            language: "Hindi",
            country: "India",
            followers: 0,
            songs: [song._id],
            albums: [],
            status: "Active",
          });
          console.log(`✅ Created: ${name}`);
          createdCount++;
        } else {
          const songIdStr = String(song._id);
          const alreadyHas = (artist.songs || []).some(
            (id) => String(id) === songIdStr
          );

          if (!alreadyHas) {
            artist.songs = [...(artist.songs || []), song._id];
            if (!artist.image && song.imageUrl) {
              artist.image = song.imageUrl;
            }
            await artist.save();
            console.log(`🔄 Updated: ${name}`);
            updatedCount++;
          } else {
            console.log(`⏭️  Skipped (already has): ${name}`);
          }
        }
      }
    }

    console.log("\n=========================================");
    console.log(`✅ DONE`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped songs without artist: ${skippedCount}`);
    console.log("=========================================\n");

    const totalArtists = await Artist.countDocuments();
    console.log(`📊 Total artists now: ${totalArtists}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  }
};

run();