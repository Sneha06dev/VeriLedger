// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); // ✅ Added mongoose import
const { connect,getDb } = require("./services/mongoClient");

 const youtubeRoutes = require("./routes/youtubeRoutes");
// const verificationRoutes = require("./routes/verificationRoutes");
// const earningsRoutes = require("./routes/earningsRoutes");
// const newsRoutes = require("./routes/newsRoutes");
const authRoutes = require("./routes/authRoutes"); // ✅ Auth routes
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

console.log("Server starting...");

// ===== Mongoose Debugging =====
mongoose.set("debug", true); // Logs all queries

mongoose.connection.on("connecting", () => console.log("🔄 MongoDB connecting..."));
mongoose.connection.on("connected", () => console.log("✅ MongoDB connected!"));
mongoose.connection.on("disconnecting", () => console.log("🔄 MongoDB disconnecting..."));
mongoose.connection.on("disconnected", () => console.log("❌ MongoDB disconnected!"));
mongoose.connection.on("reconnected", () => console.log("♻️ MongoDB reconnected!"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB error:", err));

// ===== Test Mongo Connection =====
const testMongoConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connection successful!");

    // Extra: list collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📂 Collections in DB:", collections.map(c => c.name));

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
};

testMongoConnection();

// ===== Middleware =====
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

// ===== Test route for MongoDB =====
app.get("/api/test-mongo", async (req, res) => {
  try {
    const db = mongoose.connection;
    console.log("🔹 Mongoose readyState:", db.readyState);

    if (db.readyState === 1) {
      const collections = await db.db.listCollections().toArray();
      res.json({ message: "✅ MongoDB is connected!", collections: collections.map(c => c.name) });
    } else {
      res.status(500).json({ message: "❌ MongoDB not connected", state: db.readyState });
    }
  } catch (err) {
    console.error("❌ Error accessing MongoDB:", err);
    res.status(500).json({ message: err.message });
  }
});

// ===== Test route =====
app.post("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// ===== Public Routes =====
 app.use("/api", youtubeRoutes);
// app.use("/api", verificationRoutes);
// app.use("/api", earningsRoutes);
// app.use("/api/news", newsRoutes);
app.use("/api/auth", authRoutes); // ✅ Signup/Login routes

// ===== Example Protected Route =====
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: `Hello ${req.user.fullName}, you are authorized!` });
});
app.get("/api/transcript", async (req, res) => {
  const videoUrl = req.query.videoUrl;
  console.log("Fetch request for videoUrl:", videoUrl);

  if (!videoUrl) return res.status(400).json({ error: "Missing videoUrl" });

  try {
     const db = getDb();                     // <-- get the connected db
    const collection = db.collection("Transcripts");
    const doc = await collection.findOne({ videoUrl: videoUrl });
    if (!doc) {
      console.log("No document found for videoUrl:", videoUrl);
      return res.status(404).json({ error: "Transcript not found" });
    }

    console.log("Found document:", doc);
    res.json({ transcript: doc.text });
  } catch (err) {
    console.error("MongoDB query failed:", err);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
});
// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).send("Route not found");
});

// ===== Start Server AFTER DB connects =====
async function startServer() {
  try {
    await connect(); // Make sure MongoDB is connected before starting server

    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });

  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();