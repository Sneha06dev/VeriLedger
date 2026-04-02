const { getDb } = require("./mongoClient");
const { extractAndStoreClaims } = require("./claimService");

async function saveTranscript(videoId, transcriptText, company,youtubeUrl) {
  const db = getDb();

  const existing = await db.collection("Transcripts")
    .findOne({ transcriptId: videoId });

  if (!existing) {
    await db.collection("Transcripts").insertOne({
     transcriptId: videoId,
      text: transcriptText,
      company: company,      // dropdown value
      videoUrl: youtubeUrl,  // pass URL here
      uploadedAt: new Date(),
      claimsExtracted: false
    });
  }

  // // ✅ CALL NEW CLAIM PIPELINE
  // await extractAndStoreClaims(videoId, transcriptText, company);
}

module.exports = { saveTranscript };