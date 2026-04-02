/**
 * Prompt Templates for LLM
 */

const promptTemplates = {
  /**
   * Template for claim verification verdict
   */
  verdictTemplate: (claimText, evidenceSummary, company, date) => {
    return `
You are an expert fact-checker specializing in corporate financial claims.

Your task: Verify the following claim from an earnings call against supporting evidence documents.

CLAIM TO VERIFY:
"${claimText}"

COMPANY: ${company}
TRANSCRIPT DATE: ${date}

SUPPORTING EVIDENCE DOCUMENTS:
${evidenceSummary}

ANALYSIS INSTRUCTIONS:
1. Compare the claim against each evidence document
2. Check for factual alignment, numerical accuracy, and temporal consistency
3. Assess whether evidence SUPPORTS, REFUTES, or provides UNCERTAIN information about the claim
4. Consider context: Is the claim outdated? Is it about future projections?

RESPONSE FORMAT:
Provide your response as a JSON object with the following structure:
{
  "verdict": "SUPPORTED" | "REFUTED" | "UNCERTAIN",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation of your verdict",
  "supportingReferences": [array of indices of supporting documents],
  "contradictingReferences": [array of indices of contradicting documents]
}

VERDICT DEFINITIONS:
- SUPPORTED: Evidence clearly confirms the claim. 70%+ of evidence aligns.
- REFUTED: Evidence contradicts the claim. Clear contradiction found.
- UNCERTAIN: Insufficient, ambiguous, or conflicting evidence. Cannot determine.

Respond ONLY with the JSON object.
`;
  },

  /**
   * Template for claim extraction from transcript
   */
  claimExtractionTemplate: (transcript) => {
    return `
You are an expert financial analyst tasked with extracting key claims from earnings call transcripts.

EARNINGS CALL TRANSCRIPT:
"""
${transcript}
"""

Your task is to identify and extract:
1. Financial claims (revenue, profit, growth rates, margin improvements)
2. Operational claims (hiring, expansion, market position)
3. Forward-looking statements and guidance
4. Risk disclosures

For each claim, provide:
- claimText: Exact text of the claim
- claimType: one of ['financial', 'operational', 'forward-looking', 'risk']
- confidence: 0.0 to 1.0 confidence in claim extraction
- speaker: Speaker type (CEO, CFO, etc) if identifiable

Return a JSON object with a "claims" array.
`;
  },

  /**
   * Template for evidence relevance ranking
   */
  relevanceRankingTemplate: (claim, documents) => {
    return `
You are an expert at determining document relevance to specific claims.

CLAIM:
"${claim}"

DOCUMENTS TO RANK:
${documents.map((doc, idx) => `${idx + 1}. ${doc.title} (${doc.date})\n${doc.excerpt}`).join("\n---\n")}

For each document, provide a relevance score from 0 to 10.
A score of 10 means the document directly addresses the claim.
A score of 0 means the document is completely irrelevant.

Return a JSON object: { relevanceScores: [score1, score2, ...] }
`;
  },

  /**
   * Template for conflicting information detection
   */
  conflictDetectionTemplate: (claim, supporting, contradicting) => {
    return `
You are an expert at detecting conflicts in financial information.

CLAIM:
"${claim}"

SUPPORTING EVIDENCE:
${supporting}

CONTRADICTING EVIDENCE:
${contradicting}

Analyze whether there is genuine conflict or if the statements can be reconciled.
Provide:
- hasConflict: boolean
- explanation: why they conflict or don't
- recommendation: REFUTED if genuine conflict, otherwise provide explanation
`;
  }
};

module.exports = promptTemplates;
