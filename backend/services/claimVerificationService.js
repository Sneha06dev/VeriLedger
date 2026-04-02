const { getDb } = require("./mongoClient");
const evidenceRetrievalService = require("./evidenceRetrievalService");
const verdictService = require("./verdictService");

/**
 * ClaimVerificationService
 * Orchestrates the entire verification pipeline.
 * 
 * Flow:
 * 1. Fetch transcript and associated claims from MongoDB.
 * 2. Iterate through each claim:
 *    a. Retrieve relevant evidence using EvidenceRetrievalService (RAG).
 *    b. Pass claim + evidence to VerdictService for AI-powered analysis.
 *    c. Construct a detailed verdict record with citations.
 * 3. Bulk update findings in the Verdicts collection.
 * 4. Update the parent transcript status to 'verified'.
 */
class ClaimVerificationService {
  /**
   * Verify all claims from a transcript
   * @param {string} transcriptId - ID of the transcript containing claims
   * @param {string} company - Company name for context
   * @returns {Promise<Object>} - Verification results
   */
  async verifyClaimsForTranscript(transcriptId, company) {
    const db = getDb();

    try {
      // Step 1: Fetch transcript and claims
      console.log(`\nVerifying claims for transcript: ${transcriptId}`);

      const transcript = await db.collection("Transcripts")
        .findOne({ transcriptId: transcriptId });

      if (!transcript) {
        throw new Error(`Transcript not found: ${transcriptId}`);
      }

      const claimsDoc = await db.collection("Claims")
        .findOne({ transcriptId: transcriptId });

      if (!claimsDoc || !claimsDoc.claims || claimsDoc.claims.length === 0) {
        console.log("No claims found for transcript");
        return {
          transcriptId: transcriptId,
          claimsVerified: 0,
          verdicts: []
        };
      }

      // Step 2: Verify each claim
      const verdicts = [];
      const summaryStats = {
        SUPPORTED: 0,
        REFUTED: 0,
        UNCERTAIN: 0
      };

      for (const claim of claimsDoc.claims) {
        try {
          console.log(`\nVerifying claim: "${claim.claimText.substring(0, 60)}..."`);

          // Retrieve evidence for this claim
          const evidence = await evidenceRetrievalService.retrieveEvidence(
            claim.claimText,
            {
              company: company,
              topK: 5
            }
          );

          // Generate verdict
          const verdict = await verdictService.generateVerdict(
            claim.claimText,
            evidence,
            {
              company: company,
              transcriptDate: transcript.uploadedAt
            }
          );

          // Store result
          const verdictRecord = {
            transcriptId: transcriptId,
            claimId: claim._id || claim.text,
            claimText: claim.claimText,
            claimType: claim.claimType,
            speaker: claim.speaker,
            claimConfidence: claim.confidence,
            verdict: verdict.verdict,
            verdictConfidence: verdict.confidence,
            reasoning: verdict.reasoning,
            supportingDocuments: evidence.filter((_, idx) =>
              verdict.supportingReferences.includes(idx)
            ),
            contradictingDocuments: evidence.filter((_, idx) =>
              verdict.contradictingReferences.includes(idx)
            ),
            allRetrievedDocuments: evidence,
            verifiedAt: new Date()
          };

          verdicts.push(verdictRecord);
          summaryStats[verdict.verdict]++;

          // Log result
          console.log(`✓ Verdict: ${verdict.verdict} (confidence: ${(verdict.confidence * 100).toFixed(1)}%)`);

        } catch (error) {
          console.error(`Error verifying claim "${claim.claimText}":`, error);
          verdicts.push({
            transcriptId: transcriptId,
            claimId: claim._id || claim.text,
            claimText: claim.claimText,
            verdict: "UNCERTAIN",
            verdictConfidence: 0.0,
            reasoning: `Verification error: ${error.message}`,
            supportingDocuments: [],
            contradictingDocuments: [],
            allRetrievedDocuments: [],
            verifiedAt: new Date(),
            error: true
          });
        }
      }

      // Step 3: Store verdicts in MongoDB
      console.log(`\nStoring ${verdicts.length} verdicts in database...`);

      for (const verdict of verdicts) {
        await db.collection("Verdicts").updateOne(
          {
            transcriptId: transcriptId,
            claimId: verdict.claimId
          },
          {
            $set: verdict
          },
          {
            upsert: true
          }
        );
      }

      // Step 4: Update transcript verification status
      await db.collection("Transcripts").updateOne(
        { transcriptId: transcriptId },
        {
          $set: {
            verified: true,
            verifiedAt: new Date(),
            verdictSummary: summaryStats
          }
        }
      );

      console.log("\n✓ Verification complete");
      console.log(`Summary: SUPPORTED=${summaryStats.SUPPORTED}, REFUTED=${summaryStats.REFUTED}, UNCERTAIN=${summaryStats.UNCERTAIN}`);

      return {
        transcriptId: transcriptId,
        claimsVerified: verdicts.length,
        verdictSummary: summaryStats,
        verdicts: verdicts
      };

    } catch (error) {
      console.error("Error in claim verification service:", error);
      throw error;
    }
  }

  /**
   * Verify a single claim (for on-demand verification)
   * @param {string} claimText - Claim text to verify
   * @param {string} company - Company context
   * @returns {Promise<Object>} - Verdict object
   */
  async verifySingleClaim(claimText, company) {
    try {
      const evidence = await evidenceRetrievalService.retrieveEvidence(
        claimText,
        { company: company, topK: 5 }
      );

      const verdict = await verdictService.generateVerdict(
        claimText,
        evidence,
        { company: company }
      );

      return {
        claimText: claimText,
        ...verdict,
        retrievedDocuments: evidence
      };
    } catch (error) {
      console.error("Error verifying single claim:", error);
      throw error;
    }
  }

  /**
   * Get verification status for a transcript
   * @param {string} transcriptId - Transcript ID
   * @returns {Promise<Object>} - Verification status and stats
   */
  async getVerificationStatus(transcriptId) {
    const db = getDb();

    try {
      const transcript = await db.collection("Transcripts")
        .findOne({ transcriptId: transcriptId });

      if (!transcript) {
        throw new Error(`Transcript not found: ${transcriptId}`);
      }

      const verdictStats = await db.collection("Verdicts").aggregate([
        { $match: { transcriptId: transcriptId } },
        {
          $group: {
            _id: "$verdict",
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      const statsMap = {
        SUPPORTED: 0,
        REFUTED: 0,
        UNCERTAIN: 0
      };

      verdictStats.forEach(stat => {
        statsMap[stat._id] = stat.count;
      });

      return {
        transcriptId: transcriptId,
        verified: transcript.verified || false,
        verifiedAt: transcript.verifiedAt || null,
        verdictSummary: statsMap,
        totalClaims: verdictStats.reduce((sum, s) => sum + s.count, 0)
      };

    } catch (error) {
      console.error("Error getting verification status:", error);
      throw error;
    }
  }
}

module.exports = new ClaimVerificationService();
