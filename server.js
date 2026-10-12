require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("=================================");
    console.log("✅ MongoDB connected");
    console.log("=================================");

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      },
    });

    app.set("io", io);

    io.on("connection", (socket) => {
      console.log("✅ User connected:", socket.id);
      socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
      });
    });

    server.listen(PORT, () => {
      console.log("=================================");
      console.log("🚀 Admin Backend Server Started");
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`📡 Socket.io: ready`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("❌ MongoDB error:", error.message);
    process.exit(1);
  }
};

startServer();