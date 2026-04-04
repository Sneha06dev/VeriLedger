const express = require("express");
const router = express.Router();
const { getDb}= require("../services/mongoClient");
const { extractClaimsWithGemini } = require("../services/claimExtraction"); // adjust path if needed

// POST /api/claims/extract
router.post("/extract", async (req, res) => {
  console.log("\n" + "=".repeat(70));
  console.log("📊 CLAIM EXTRACTION ROUTE HIT");
  console.log("=".repeat(70));

  try {
    const { transcript, videoUrl, company, transcriptId  } = req.body;

    if (!transcript) {
  return res.status(400).json({ error: "Transcript is missing" });
}

if (!videoUrl) {
  return res.status(400).json({ error: "videoUrl is missing" });
}

if (!company) {
  return res.status(400).json({ error: "company is missing" });
}

if (!transcriptId) {
  return res.status(400).json({ error: "transcriptId is missing" });
}

 const db = getDb();
    const claimsCollection = db.collection("Claims");

    // ✅ 1. Check if already exists (cache)
    let existing = await claimsCollection.findOne({ videoUrl });

    if (existing) {
      console.log("⚡ Returning cached claims");
      return res.json(existing);
    }
    console.log("📝 Transcript length:", transcript.length);

    const result = await extractClaimsWithGemini(transcript);
    if (!result || !Array.isArray(result.claims)) {
  throw new Error("Invalid response from claim extraction");
}
    const doc = {
      videoUrl,
      company: company || null,
      transcriptId: transcriptId || null,
      claims: result.claims,
      createdAt: new Date()
    };

    // ✅ 4. Save to MongoDB
    await claimsCollection.updateOne(
  { videoUrl },
  { $setOnInsert: doc },
  { upsert: true }
);

    console.log("💾 Claims stored successfully");
    console.log("✅ Claims extracted:", result?.claims?.length || 0);

    res.status(200).json(doc);

  } catch (err) {
    console.error("❌ CLAIM EXTRACTION ERROR:", err.message);
    res.status(500).json({ error: "Claim extraction failed", details: err.message });
  }
});

module.exports = router;