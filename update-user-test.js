require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./src/models/User");
const Plan = require("./src/models/Plan");

const TEST_EMAIL = "anil0598y@gmail.com";  // 👈 Apna email daal

const run = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    // ✅ User dhoondh
    const user = await User.findOne({ email: TEST_EMAIL });
    if (!user) {
      console.log("❌ User not found:", TEST_EMAIL);
      process.exit(1);
    }
    console.log("👤 User found:", user.email);

    // ✅ Pro plan dhoondh
    const proPlan = await Plan.findOne({ name: "Pro" });
    if (!proPlan) {
      console.log("❌ Pro plan not found");
      process.exit(1);
    }
    console.log("📦 Pro plan found:", proPlan.name, "| ID:", proPlan._id);

    // ✅ Update user
    user.plan = "Pro";
    user.planId = proPlan._id;
    user.subscriptionStatus = "active";
    user.subscriptionStart = new Date("2026-10-03T00:00:00.000Z");
    user.subscriptionEnd = new Date("2026-10-04T00:00:00.000Z");

    await user.save();

    console.log("\n✅ USER UPDATED SUCCESSFULLY:");
    console.log("   Email:               ", user.email);
    console.log("   Plan:                ", user.plan);
    console.log("   Plan ID:             ", user.planId);
    console.log("   Subscription Status: ", user.subscriptionStatus);
    console.log("   Start Date:          ", user.subscriptionStart);
    console.log("   End Date:            ", user.subscriptionEnd);
    console.log("\n🎯 Ab user app mein login kar — song play kar — terminal dekho!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

run();