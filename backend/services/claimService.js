const { getDb } = require("./mongoClient");
const { extractClaimsWithGemini } = require("./claimExtraction");
const claimVerificationService = require("./claimVerificationService"); // [NEW]

async function extractAndStoreClaims(videoId, transcriptText, company) { // [MODIFIED] - added company param
  const db = getDb();

  const existing = await db.collection("Claims")
    .findOne({ transcriptId: videoId });

  if (existing) {
    console.log("Claims already exist, skipping.");
    return;
  }

  console.log("Extracting claims...");

  const claimsResult = await extractClaimsWithGemini(transcriptText);

  await db.collection("Claims").insertOne({
    transcriptId: videoId,
    claims: claimsResult.claims,
    extractedAt: new Date()
  });

  await db.collection("Transcripts").updateOne(
    { transcriptId: videoId },
    { $set: { claimsExtracted: true } }
  );

  console.log("Claims stored successfully.");

  // [NEW] Trigger verification after claim extraction
  try {
    console.log("Starting automatic claim verification...");
    // await claimVerificationService.verifyClaimsForTranscript(videoId, company);
  } catch (error) {
    console.error("Error during automatic verification:", error);
    // Don't throw - verification failure shouldn't block claim extraction
  }
}

module.exports = { extractAndStoreClaims };