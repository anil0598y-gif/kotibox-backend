require("dotenv").config();
const mongoose = require("mongoose");
const Song = require("./src/models/Song");

/* =========================================
   TITLE CLEANER
========================================= */
const cleanTitle = (raw = "") => {
  return String(raw)
    // 1. File extension hatao
    .replace(/\.(mp3|wav|m4a|flac|webm|opus|aac|ogg)$/i, "")

    // 2. Bitrate indicator hatao — (48k), (128k), (320kbps), [320K]
    .replace(/\(\s*\d+\s*k(?:bps)?\s*\)/gi, "")
    .replace(/\[\s*\d+\s*k(?:bps)?\s*\]/gi, "")

    // 3. Common tags hatao
    .replace(/\b(lyrical|official\s+video|full\s+song|full\s+video|audio|hd|4k|8k)\b/gi, "")

    // 4. Underscores → space
    .replace(/_+/g, " ")

    // 5. Multiple spaces / trailing dashes clean
    .replace(/\s+/g, " ")
    .replace(/\s*[-–—]\s*$/, "")
    .trim();
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    console.log("");

    const songs = await Song.find();
    console.log(`📊 Total songs: ${songs.length}`);
    console.log("");

    let updated = 0;

    for (const song of songs) {
      if (!song.title) continue;

      const cleaned = cleanTitle(song.title);

      if (cleaned && cleaned !== song.title) {
        console.log(`✏️  OLD: ${song.title}`);
        console.log(`    NEW: ${cleaned}`);
        console.log("");

        song.title = cleaned;
        await song.save();
        updated++;
      }
    }

    console.log("=================================");
    console.log(`✅ Updated: ${updated} songs`);
    console.log("=================================");
  } catch (err) {
    console.error("❌ ERROR:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
  }
})();