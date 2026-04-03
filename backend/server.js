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
    // Connect via raw MongoDB driver (for mongoClient)
    await connect();
    console.log("✅ Raw MongoDB driver connected!");
    
    // Also connect via Mongoose
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongoose connected!");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📊 Collections:", collections.map(c => c.name));

  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
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

// ===== HEALTH CHECK =====
app.get("/api/health", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({ status: "ok", message: "Server is running" });
});

// ===== TRANSCRIPT ROUTE (DEFINED BEFORE MIDDLEWARE) =====
app.get("/api/transcript", async (req, res) => {
  const videoUrl = req.query.videoUrl;

  console.log("\n" + "=".repeat(70));
  console.log("📝 TRANSCRIPT REQUEST RECEIVED");
  console.log("Raw videoUrl (as received):", videoUrl);
  console.log("Type:", typeof videoUrl);
  console.log("Length:", videoUrl?.length);
  console.log("=".repeat(70));

  if (!videoUrl) {
    return res.status(400).json({ error: "Missing videoUrl query parameter" });
  }

  try {
    const db = getDb();
    if (!db) {
      console.error("❌ Database not initialized");
      return res.status(500).json({ error: "Database not initialized" });
    }

    const collection = db.collection("Transcripts");
    
    const searchQueries = [
      { videoUrl: videoUrl },
      { videoUrl: videoUrl.trim() },
      { videoUrl: new RegExp(`^${videoUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    ];

    console.log("🔍 Searching for transcript with queries:");
    console.log("  1. Exact match:", videoUrl);
    console.log("  2. Trimmed match:", videoUrl.trim());
    console.log("  3. Case-insensitive regex");

    let doc = await collection.findOne(searchQueries[0]);

    if (!doc) {
      console.log("⚠️ Exact match failed, trying trimmed...");
      doc = await collection.findOne(searchQueries[1]);
    }

    if (!doc) {
      console.log("⚠️ Trimmed match failed, trying regex...");
      doc = await collection.findOne(searchQueries[2]);
    }

    if (!doc) {
      console.warn("⚠️ Transcript not found! Fetching all URLs in database for debugging...");
      const allDocs = await collection.find({}).project({ videoUrl: 1, transcriptId: 1 }).limit(5).toArray();
      console.log("📊 Sample URLs in database:");
      allDocs.forEach((d, idx) => {
        console.log(`  ${idx + 1}. "${d.videoUrl}" (ID: ${d.transcriptId})`);
        console.log(`     Length: ${d.videoUrl?.length}, Matches query: ${d.videoUrl === videoUrl}`);
      });
    }

    if (!doc) {
      console.error("❌ TRANSCRIPT NOT FOUND");
      return res.status(404).json({ 
        error: "Transcript not found for this video URL",
        searchedFor: videoUrl,
        note: "Check backend logs for database contents"
      });
    }

    console.log("✅ TRANSCRIPT FOUND!");
    console.log("   Company:", doc.company);
    console.log("   Uploaded:", doc.uploadedAt);
    console.log("   Text length:", doc.text?.length || 0, "characters");
    console.log("=".repeat(70) + "\n");

    const responseData = { 
      success: true,
      transcript: doc.text,
      text: doc.text,
      metadata: { 
        company: doc.company, 
        uploadedAt: doc.uploadedAt,
        transcriptId: doc.transcriptId
      } 
    };

    console.log("📤 SENDING RESPONSE:");
    console.log("   Content-Type: application/json");
    console.log("   Status: 200");
    console.log("   Data keys:", Object.keys(responseData));
    console.log("   Text length in response:", responseData.text.length);
    
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).json(responseData);
    
    console.log("✅ RESPONSE SENT SUCCESSFULLY\n");

  } catch (err) {
    console.error("❌ ERROR FETCHING TRANSCRIPT");
    console.error("Error message:", err.message);
    console.error("Stack:", err.stack);
    console.error("=".repeat(70) + "\n");
    res.status(500).json({ error: "Failed to fetch transcript", details: err.message });
  }
});

// ===== ROUTES =====
app.use("/api", youtubeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/calendar", calendarRoutes);

app.use("/api/user", userRoutes);
// ===== TEST ROUTE =====
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Hello ${req.user.fullName}` });
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