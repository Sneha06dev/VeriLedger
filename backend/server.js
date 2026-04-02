require("dotenv").config({ path: __dirname + "/../.env" });

// START CRON JOB
require("./jobs/earningsWatcher");
const userRoutes = require("./routes/userRoutes");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const { connect, getDb } = require("./services/mongoClient");

const youtubeRoutes = require("./routes/youtubeRoutes");
const authRoutes = require("./routes/authRoutes");
const calendarRoutes = require("./routes/calendarRoutes");

const authMiddleware = require("./middleware/authMiddleware");

const app = express();

console.log(" Server starting...");

// ===== MONGOOSE DEBUG =====
mongoose.set("debug", true);

mongoose.connection.on("connected", () => console.log("✅ MongoDB connected!"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB error:", err));

// ===== CONNECT DB =====
async function initDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" MongoDB Atlas connected!");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(" Collections:", collections.map(c => c.name));

  } catch (err) {
    console.error(" DB connection failed:", err.message);
  }
}

initDB();

// ===== MIDDLEWARE =====
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true
}));

app.use(express.json());

// ===== ROUTES =====
app.use("/api", youtubeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/calendar", calendarRoutes);

app.use("/api/user", userRoutes);
// ===== TEST ROUTE =====
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Hello ${req.user.fullName}` });
});

// ===== TRANSCRIPT ROUTE =====
app.get("/api/transcript", async (req, res) => {
  const videoUrl = req.query.videoUrl;

  if (!videoUrl) {
    return res.status(400).json({ error: "Missing videoUrl" });
  }

  try {
    const db = getDb();
    const collection = db.collection("Transcripts");

    const doc = await collection.findOne({ videoUrl });

    if (!doc) {
      return res.status(404).json({ error: "Transcript not found" });
    }

    res.json({ transcript: doc.text });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).send("Route not found");
});

// ===== START SERVER =====
const PORT = 5000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});