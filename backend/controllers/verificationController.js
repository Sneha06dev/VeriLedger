const claimVerificationService = require("../services/claimVerificationService");
const evidenceRetrievalService = require("../services/evidenceRetrievalService");
const { getDb } = require("../services/mongoClient");

/**
 * Verification Controller
 * Handles verification-related API requests
 */

/**
 * POST /api/verify/transcript/:transcriptId
 * Verify all claims in a transcript
 */
exports.verifyTranscript = async (req, res) => {
  try {
    const { transcriptId } = req.params;
    const { company } = req.body;

    if (!transcriptId || !company) {
      return res.status(400).json({
        error: "Missing required fields: transcriptId, company"
      });
    }

    const result = await claimVerificationService.verifyClaimsForTranscript(
      transcriptId,
      company
    );

    return res.status(200).json({
      message: "Verification completed successfully",
      ...result
    });

  } catch (error) {
    console.error("Error verifying transcript:", error);
    return res.status(500).json({
      error: "Verification failed",
      details: error.message
    });
  }
};

/**
 * GET /api/verify/transcript/:transcriptId/status
 * Get verification status for a transcript
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const { transcriptId } = req.params;

    const status = await claimVerificationService.getVerificationStatus(transcriptId);

    return res.status(200).json(status);

  } catch (error) {
    console.error("Error getting verification status:", error);
    return res.status(500).json({
      error: "Failed to get verification status",
      details: error.message
    });
  }
};

/**
 * GET /api/verify/transcript/:transcriptId/verdicts
 * Get all verdicts for a transcript
 */
exports.getTranscriptVerdicts = async (req, res) => {
  try {
    const { transcriptId } = req.params;
    const db = getDb();

    const verdicts = await db.collection("Verdicts")
      .find({ transcriptId: transcriptId })
      .toArray();

    if (verdicts.length === 0) {
      return res.status(404).json({
        message: "No verdicts found for this transcript"
      });
    }

    return res.status(200).json({
      transcriptId: transcriptId,
      verdictCount: verdicts.length,
      verdicts: verdicts
    });

  } catch (error) {
    console.error("Error getting verdicts:", error);
    return res.status(500).json({
      error: "Failed to get verdicts",
      details: error.message
    });
  }
};

/**
 * GET /api/verify/claim/:claimId
 * Get verdict for a specific claim
 */
exports.getClaimVerdict = async (req, res) => {
  try {
    const { claimId } = req.params;
    const db = getDb();

    const verdict = await db.collection("Verdicts")
      .findOne({ claimId: claimId });

    if (!verdict) {
      return res.status(404).json({
        error: "Verdict not found for this claim"
      });
    }

    return res.status(200).json(verdict);

  } catch (error) {
    console.error("Error getting claim verdict:", error);
    return res.status(500).json({
      error: "Failed to get claim verdict",
      details: error.message
    });
  }
};

/**
 * POST /api/verify/claim/single
 * Verify a single claim on-demand
 */
exports.verifySingleClaim = async (req, res) => {
  try {
    const { claimText, company } = req.body;

    if (!claimText || !company) {
      return res.status(400).json({
        error: "Missing required fields: claimText, company"
      });
    }

    const result = await claimVerificationService.verifySingleClaim(
      claimText,
      company
    );

    return res.status(200).json({
      message: "Claim verified successfully",
      ...result
    });

  } catch (error) {
    console.error("Error verifying single claim:", error);
    return res.status(500).json({
      error: "Claim verification failed",
      details: error.message
    });
  }
};

/**
 * GET /api/evidence/search
 * Search for evidence documents
 */
exports.searchEvidence = async (req, res) => {
  try {
    const {
      claimText,
      company,
      docTypes,
      startDate,
      endDate,
      topK = 5
    } = req.query;

    if (!claimText) {
      return res.status(400).json({
        error: "Missing required parameter: claimText"
      });
    }

    const docTypesArray = docTypes ? docTypes.split(",") : null;

    const evidence = await evidenceRetrievalService.retrieveEvidence(
      claimText,
      {
        company: company || null,
        docTypes: docTypesArray,
        dateRange: startDate && endDate ? { from: startDate, to: endDate } : null,
        topK: parseInt(topK)
      }
    );

    return res.status(200).json({
      claimText: claimText,
      documentCount: evidence.length,
      documents: evidence
    });

  } catch (error) {
    console.error("Error searching evidence:", error);
    return res.status(500).json({
      error: "Evidence search failed",
      details: error.message
    });
  }
};

/**
 * GET /api/evidence/stats
 * Get statistics about available evidence
 */
exports.getEvidenceStats = async (req, res) => {
  try {
    const stats = await evidenceRetrievalService.getEvidenceStats();

    return res.status(200).json({
      message: "Evidence statistics retrieved",
      statistics: stats
    });

  } catch (error) {
    console.error("Error getting evidence stats:", error);
    return res.status(500).json({
      error: "Failed to get evidence statistics",
      details: error.message
    });
  }
};
