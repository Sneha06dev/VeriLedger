// routes/youtubeRoutes.js
const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const controllerPath = path.join(__dirname, "../controllers/youtubeTranscriptController.js");
console.log("Checking if controller file exists at:", controllerPath);
console.log("Exists?", fs.existsSync(controllerPath));
// --- DEBUG: Log router initialization ---
console.log("Initializing youtubeRoutes router");

// --- Import the processVideo controller with debug ---
let processVideo;
try {
  ({ processVideo } = require("../controllers/youtubeTranscriptController"));
  console.log("processVideo controller imported successfully:", typeof processVideo);
} catch (err) {
  console.error("Error importing processVideo controller:", err);
}

// --- Register the route with inline debug wrapper ---
router.post("/youtube/process-video", (req, res) => {
  console.log("Request hit /youtube/process-video route");
  console.log("Request body:", req.body);

  // --- Check if controller exists before calling ---
  if (typeof processVideo === "function") {
    console.log("Calling processVideo controller...");
    return processVideo(req, res);
  } else {
    console.error("processVideo controller not loaded!");
    return res.status(500).json({ error: "processVideo controller not loaded" });
  }
});

// --- DEBUG: Print all registered routes inside router ---
console.log(
  "Routes inside router:",
  router.stack.map((r) => (r.route ? r.route.path : undefined))
);

// --- Export the router ---
module.exports = router;