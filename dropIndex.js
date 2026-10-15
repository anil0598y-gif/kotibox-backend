require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || process.env.MONGODB_URI;

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected");

    const collection = mongoose.connection.collection("artists");

    // Saare indexes list karo
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes.map((i) => i.name));

    // name_text wala drop karo
    try {
      await collection.dropIndex("name_text");
      console.log("✅ Dropped: name_text");
    } catch (e) {
      console.log("⚠️ name_text index not found — skip");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  }
};

run();
