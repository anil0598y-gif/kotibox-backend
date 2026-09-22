require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("=================================");
    console.log("✅ MongoDB connected");
    console.log("=================================");

    app.listen(PORT, () => {
      console.log("=================================");
      console.log("🚀 Admin Backend Server Started");
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("❌ MongoDB error:");
    console.error(error.message);
  }
};

startServer();