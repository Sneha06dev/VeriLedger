const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verificationController");

/**
 * Verification API Routes
 */

// Verify entire transcript
router.post("/verify/transcript/:transcriptId", verificationController.verifyTranscript);

// Get verification status
router.get("/verify/transcript/:transcriptId/status", verificationController.getVerificationStatus);

// Get all verdicts for transcript
router.get("/verify/transcript/:transcriptId/verdicts", verificationController.getTranscriptVerdicts);

// Get verdict for specific claim
router.get("/verify/claim/:claimId", verificationController.getClaimVerdict);

// Verify single claim on-demand
router.post("/verify/claim/single", verificationController.verifySingleClaim);

// Fetch claims by video URL
router.get("/claims/by-video", verificationController.getClaimsByVideo);

// DEBUG: Get all claims in database
router.get("/claims/test-all", verificationController.getClaimsTestAll);

// Search for evidence
router.get("/evidence/search", verificationController.searchEvidence);

// Get evidence statistics
router.get("/evidence/stats", verificationController.getEvidenceStats);

module.exports = router;
