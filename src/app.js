const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

/* =========================================
   PATHS
========================================= */

const PUBLIC_PATH = path.resolve(__dirname, "../public");
const UPLOADS_PATH = path.resolve(__dirname, "../public/uploads");
const IMAGES_PATH = path.resolve(__dirname, "../public/images");

console.log("=========================================");
console.log("📁 PUBLIC PATH :", PUBLIC_PATH);
console.log("📁 UPLOADS PATH:", UPLOADS_PATH);
console.log("📁 IMAGES PATH :", IMAGES_PATH);
console.log("📁 UPLOADS EXISTS:", fs.existsSync(UPLOADS_PATH));
console.log("=========================================");

/* =========================================
   CORS
========================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "https://melodic-queijadas-7955df.netlify.app", // User App URL
  "https://kotibox-admin-frontend.netlify.app",   // Admin App URL (Netlify - purana)
  "https://kotibox-admin-frontend.vercel.app",    // Admin App URL (Vercel - naya) ✅
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

/* =========================================
   BODY PARSER
========================================= */

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

/* =========================================
   STATIC FILES
========================================= */

app.use(express.static(PUBLIC_PATH));

app.use(
  "/uploads",
  express.static(UPLOADS_PATH, {
    fallthrough: true,
    index: false,
    maxAge: "1d",
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.use(
  "/images",
  express.static(IMAGES_PATH, {
    fallthrough: false,
    index: false,
  })
);

/* =========================================
   TEST ROUTES
========================================= */

app.get("/test-upload", (req, res) => {
  const testFolder = path.join(UPLOADS_PATH, "songs");
  let files = [];

  try {
    if (fs.existsSync(testFolder)) {
      files = fs.readdirSync(testFolder);
    }
  } catch (error) {
    console.error("❌ Upload folder read error:", error);
  }

  res.json({
    success: true,
    uploadsPath: UPLOADS_PATH,
    uploadsExists: fs.existsSync(UPLOADS_PATH),
    songsFolder: testFolder,
    songsFolderExists: fs.existsSync(testFolder),
    files,
  });
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend is healthy" });
});

/* =========================================
   API ROUTES
========================================= */

app.use("/api/songs", require("./routes/songRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/user", require("./routes/userAuthRoutes"));
app.use("/api/user", require("./routes/userActionRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/playlists", require("./routes/playlistRoutes"));
app.use("/api/artists", require("./routes/artistRoutes"));
app.use("/api/albums", require("./routes/albumRoutes"));
app.use("/api/media", require("./routes/mediaRoutes"));
app.use("/api/lyrics", require("./routes/lyricsRoutes"));
app.use("/api/home", require("./routes/homeRoutes"));
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/plans", require("./routes/planRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/ads", require("./routes/adRoutes"));
app.use("/api/ad-networks", require("./routes/adNetworkRoutes"));

/* =========================================
   ✅ RAZORPAY PAYMENT ROUTES
========================================= */

app.use("/api/payment", require("./routes/paymentRoutes"));

/* =========================================
   404 HANDLER
========================================= */

app.use((req, res) => {
  console.log("❌ 404:", req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

/* =========================================
   ERROR HANDLER
========================================= */

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

/* =========================================
   EXPORT
========================================= */

module.exports = app;