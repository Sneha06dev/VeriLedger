const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * VerdictService
 * Uses LLM (Gemini) to compare claims against evidence and assign verdicts
 */
class VerdictService {
  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: "v1" });
    // Use gemini-1.5-pro (latest available model)
    // Fallback options: gemini-1.5-flash (faster, cheaper), gemini-pro (deprecated)
    this.model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  /**
   * Generate verdict for a claim based on retrieved evidence
   * @param {string} claimText - The claim to verify
   * @param {Array} evidenceDocuments - Retrieved supporting documents
   * @param {Object} context - Additional context (company, date, etc.)
   * @returns {Promise<Object>} - Verdict with confidence score and explanation
   */
  async generateVerdict(claimText, evidenceDocuments, context = {}) {
    const { company = "Unknown", transcriptDate = new Date() } = context;

    try {
      // Step 1: Build evidence summary
      const evidenceSummary = this._buildEvidenceSummary(evidenceDocuments);

      // Step 2: Create prompt for Gemini
      const prompt = this._createVerdictPrompt(
        claimText,
        evidenceSummary,
        company,
        transcriptDate
      );

      // Step 3: Call Gemini API
      console.log(`Calling Gemini for verdict generation (model: ${this.model})...`);
      const model = this.client.getGenerativeModel({ model: this.model }, { apiVersion: "v1" });
      const result = await model.generateContent(prompt);
      
      const responseText = result.response.text();

      // Step 4: Parse LLM response
      const verdict = this._parseVerdictResponse(responseText);

      return {
        verdict: verdict.verdict, // SUPPORTED, REFUTED, UNCERTAIN
        confidence: verdict.confidence, // 0.0 - 1.0
        reasoning: verdict.reasoning,
        supportingReferences: verdict.supportingReferences,
        contradictingReferences: verdict.contradictingReferences,
        generatedAt: new Date(),
        modelUsed: this.model
      };

    } catch (error) {
      console.error("Error generating verdict:", error.message);
      
      // Provide diagnostic information for common errors
      if (error.status === 404) {
        console.error("\n🔴 ERROR: Model Not Found (404)");
        console.error("Possible causes:");
        console.error("  1. Model name is wrong: Check GEMINI_MODEL in .env");
        console.error("  2. API key is invalid: Check GEMINI_API_KEY in .env");
        console.error("  3. API not enabled: Enable 'Generative Language API' in Google Cloud Console");
        console.error("  4. API key revoked: Create a new API key at https://aistudio.google.com/apikey");
        console.error("\nCurrent config:");
        console.error(`  - Model: ${this.model}`);
        console.error(`  - API Key: ${process.env.GEMINI_API_KEY?.substring(0, 10)}...${process.env.GEMINI_API_KEY?.substring(-5)}`);
      } else if (error.status === 401 || error.status === 403) {
        console.error("\n🔴 ERROR: Authentication Failed (401/403)");
        console.error("  - Invalid or expired API key");
        console.error("  - Get a new key: https://aistudio.google.com/apikey");
      } else if (error.message?.includes("429")) {
        console.error("\n🔴 ERROR: Rate Limited (429)");
        console.error("  - Too many requests");
        console.error("  - Wait a moment and try again");
      }
      
      throw new Error(`Verdict generation failed: ${error.message}`);
    }
  }

  /**
   * Build summary of evidence for LLM
   * @private
   */
  _buildEvidenceSummary(documents) {
    if (!documents || documents.length === 0) {
      return "No supporting evidence documents found.";
    }

    return documents.map((doc, idx) => {
      return `[Doc ${idx + 1}] ${doc.filing_type || doc.docType} (${doc.company}, ${doc.date})\n` +
             `Similarity: ${(doc.similarityScore * 100).toFixed(1)}%\n` +
             `Content: ${doc.chunkText.substring(0, 300)}...\n`;
    }).join("\n");
  }

  /**
   * Create prompt for Gemini verdict generation
   * @private
   */
  _createVerdictPrompt(claimText, evidenceSummary, company, date) {
    return `
You are an expert fact-checker specializing in corporate financial claims.

Your task: Verify the following claim from an earnings call against supporting evidence documents.

CLAIM TO VERIFY:
"${claimText}"

COMPANY: ${company}
TRANSCRIPT DATE: ${date.toISOString().split('T')[0]}

SUPPORTING EVIDENCE DOCUMENTS:
${evidenceSummary}

ANALYSIS INSTRUCTIONS:
1. Compare the claim against each evidence document
2. Check for factual alignment, numerical accuracy, and temporal consistency
3. Assess whether evidence SUPPORTS, REFUTES, or provides UNCERTAIN information about the claim

RESPONSE FORMAT:
Provide your response as a JSON object with the following structure:
{
  "verdict": "SUPPORTED" | "REFUTED" | "UNCERTAIN",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of your verdict",
  "supportingReferences": ["List of document indices that support the claim"],
  "contradictingReferences": ["List of document indices that contradict the claim"]
}

VERDICT DEFINITIONS:
- SUPPORTED: Evidence clearly confirms the claim. 70%+ of documents align with the claim.
- REFUTED: Evidence contradicts the claim. Multiple documents show opposite information.
- UNCERTAIN: Insufficient, ambiguous, or conflicting evidence. Cannot determine with confidence.

Respond ONLY with the JSON object, no additional text.
`;
  }

  /**
   * Parse LLM response and extract verdict
   * @private
   */
  _parseVerdictResponse(responseText) {
    try {
      // Extract JSON from response (handle cases where there's surrounding text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate verdict value
      const validVerdicts = ["SUPPORTED", "REFUTED", "UNCERTAIN"];
      if (!validVerdicts.includes(parsed.verdict)) {
        parsed.verdict = "UNCERTAIN";
      }

      // Validate confidence is between 0 and 1
      if (typeof parsed.confidence !== "number") {
        parsed.confidence = 0.5;
      }
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

      // Ensure supporting/contradicting references are arrays
      parsed.supportingReferences = Array.isArray(parsed.supportingReferences)
        ? parsed.supportingReferences
        : [];
      parsed.contradictingReferences = Array.isArray(parsed.contradictingReferences)
        ? parsed.contradictingReferences
        : [];

      return parsed;
    } catch (error) {
      console.error("Error parsing verdict response:", error);
      // Return safe default
      return {
        verdict: "UNCERTAIN",
        confidence: 0.3,
        reasoning: "Unable to parse LLM response",
        supportingReferences: [],
        contradictingReferences: []
      };
    }
  }

  /**
   * Generate mock verdict when API is unavailable
   * @private
   */
  _generateMockVerdict(claimText, evidenceDocuments, company) {
    // Simple heuristic: if we have evidence, claim is likely supported
    const hasRelevantEvidence = evidenceDocuments && evidenceDocuments.length > 0;
    const avgSimilarity = hasRelevantEvidence 
      ? evidenceDocuments.reduce((sum, doc) => sum + (doc.similarityScore || 0), 0) / evidenceDocuments.length
      : 0;

    let verdict = "UNCERTAIN";
    let confidence = 0.3;
    
    if (avgSimilarity > 0.7) {
      verdict = "SUPPORTED";
      confidence = 85;
    } else if (avgSimilarity > 0.5) {
      verdict = "SUPPORTED";
      confidence = 65;
    } else if (avgSimilarity > 0.3) {
      verdict = "UNCERTAIN";
      confidence = 50;
    } else if (hasRelevantEvidence) {
      verdict = "UNCERTAIN";
      confidence = 40;
    } else {
      verdict = "UNCERTAIN";
      confidence = 10;
    }

    return {
      verdict,
      confidence,
      reasoning: `Mock verdict (Gemini API unavailable). Based on ${evidenceDocuments.length} evidence documents with average similarity of ${(avgSimilarity * 100).toFixed(1)}%. This is a placeholder - enable Gemini API for accurate verdicts.`,
      supportingReferences: evidenceDocuments.slice(0, 2).map(doc => ({
        id: doc.documentId,
        type: doc.filing_type,
        similarity: doc.similarityScore
      })),
      contradictingReferences: [],
      generatedAt: new Date()
    };
  }

  /**
   * Batch generate verdicts for multiple claims
   * @param {Array} claims - Array of claims to verify
   * @param {Array} evidenceDocuments - Retrieved documents
   * @param {Object} context - Additional context
   * @returns {Promise<Array>} - Array of verdicts
   */
  async generateVerdictsBatch(claims, evidenceDocuments, context = {}) {
    const verdicts = [];

    for (const claim of claims) {
      try {
        const verdict = await this.generateVerdict(claim, evidenceDocuments, context);
        verdicts.push({
          claimText: claim,
          ...verdict
        });
      } catch (error) {
        console.error(`Error generating verdict for claim "${claim}":`, error);
        verdicts.push({
          claimText: claim,
          verdict: "UNCERTAIN",
          confidence: 0.0,
          reasoning: `Error: ${error.message}`,
          supportingReferences: [],
          contradictingReferences: []
        });
      }
    }

    return verdicts;
  }
}

module.exports = new VerdictService();
