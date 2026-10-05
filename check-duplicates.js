require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    const dup = await User.aggregate([
      { $match: { email: { $ne: "" } } },
      {
        $group: {
          _id: "$email",
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (dup.length === 0) {
      console.log("✅ Koi duplicate email nahi hai");
    } else {
      console.log("❌ Duplicates found:");
      dup.forEach((d) => {
        console.log(`   ${d._id} — ${d.count} times`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

run();