/**
 * Verification Service
 * Client-side integration with verification API
 */

const API_BASE = "http://localhost:5000/api";

/**
 * Fetch claims by video URL
 * @param {string} videoURL - The video URL
 * @returns {Promise<Object>} - List of claims from the video
 */
export async function fetchClaimsByVideo(videoURL) {
  try {
    console.log("\n[fetchClaimsByVideo CLIENT] Called with:", videoURL);
    const params = new URLSearchParams({
      videoURL
    });
    console.log("[fetchClaimsByVideo CLIENT] Sending query string:", params.toString());

    const url = `${API_BASE}/verify/claims/by-video?${params}`;
    console.log("[fetchClaimsByVideo CLIENT] Full URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("[fetchClaimsByVideo CLIENT] Response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to fetch claims");
    }

    const data = await response.json();
    console.log("[fetchClaimsByVideo CLIENT] Got data:", data);
    return data;
  } catch (error) {
    console.error("[fetchClaimsByVideo CLIENT] ERROR:", error);
    throw error;
  }
}

/**
 * Verify a single claim
 * @param {string} claimText - The claim to verify
 * @param {string} company - Company symbol (e.g., AAPL, MSFT)
 * @returns {Promise<Object>} - Verdict with evidence and reasoning
 */
export async function verifySingleClaim(claimText, company) {
  try {
    const response = await fetch(`${API_BASE}/verify/claim/single`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        claimText,
        company
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to verify claim");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error verifying claim:", error);
    throw error;
  }
}

/**
 * Search for evidence documents
 * @param {Object} params - Search parameters
 * @returns {Promise<Object>} - List of evidence documents
 */
export async function searchEvidence({
  claimText,
  company,
  docTypes,
  startDate,
  endDate,
  topK = 5
}) {
  try {
    const params = new URLSearchParams({
      claimText,
      ...(company && { company }),
      ...(docTypes && { docTypes: docTypes.join(",") }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      topK
    });

    const response = await fetch(`${API_BASE}/evidence/search?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Evidence search failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching evidence:", error);
    throw error;
  }
}

/**
 * Get verification status for a transcript
 * @param {string} transcriptId - ID of the transcript
 * @returns {Promise<Object>} - Verification status
 */
export async function getVerificationStatus(transcriptId) {
  try {
    const response = await fetch(`${API_BASE}/verify/transcript/${transcriptId}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to get verification status");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting verification status:", error);
    throw error;
  }
}

/**
 * Get all verdicts for a transcript
 * @param {string} transcriptId - ID of the transcript
 * @returns {Promise<Object>} - List of verdicts
 */
export async function getTranscriptVerdicts(transcriptId) {
  try {
    const response = await fetch(`${API_BASE}/verify/transcript/${transcriptId}/verdicts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to get verdicts");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting verdicts:", error);
    throw error;
  }
}

/**
 * Get evidence statistics
 * @returns {Promise<Object>} - Evidence statistics
 */
export async function getEvidenceStats() {
  try {
    const response = await fetch(`${API_BASE}/evidence/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to get evidence stats");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting evidence stats:", error);
    throw error;
  }
}
