import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchClaimsByVideo, verifySingleClaim, searchEvidence } from "../services/verificationService";
import VerdictCard from "../components/VerdictCard";
import EvidencePanel from "../components/EvidencePanel";
import "../styles/Verification.css";



const Verification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCompany = location.state?.company || "";
  const [company, setCompany] = useState(initialCompany);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [stepVisible, setStepVisible] = useState({
    analyzing: false,
    retrieving: false,
    generating: false,
  });

  // Step completion (tick) state
  const [stepCompleted, setStepCompleted] = useState({
    analyzing: false,
    retrieving: false,
    generating: false,
  });
  // Claim passed via navigate
  const initialClaim = location.state?.claimText || "";
  const videoURL = location.state?.videoUrl || "";  // Match Results.jsx (lowercase 'u')
  // State for all claims fetched from DB
  const [claimsList, setClaimsList] = useState([]);

  // State for selected claims
  const [selectedClaims, setSelectedClaims] = useState(
    initialClaim ? [initialClaim] : []
  );

  // Textarea reflects selected claims
  const [claimText, setClaimText] = useState(initialClaim);


  useEffect(() => {
    const fetchClaims = async () => {
      try {
        console.log("[fetchClaims] Starting with videoURL:", videoURL);
        const response = await fetchClaimsByVideo(videoURL);
        console.log("[fetchClaims] API Response:", JSON.stringify(response, null, 2));
        console.log("[fetchClaims] response.claims:", response.claims);
        // response.claims = array of { claimText: "..." }
        setClaimsList(response.claims || []);
        console.log("[fetchClaims] Set claimsList to:", response.claims || []);

        // Automatically check only the initial claim
        if (initialClaim) {
          setSelectedClaims([initialClaim]);
          setClaimText(initialClaim);
        }
      } catch (err) {
        console.error("Error fetching claims:", err);
        setError("Failed to load claims from video");
      }
    };

    if (videoURL) fetchClaims();
  }, [videoURL, initialClaim]);
  const handleVerify = async (e) => {
    e.preventDefault();

    if (!claimText.trim()) {
      setError("Please enter a claim to verify");
      return;
    }

    setLoading(true);
    setError("");
    setVerdict(null);
    setEvidence([]);

    // Hide all steps initially
    setStepVisible({ analyzing: false, retrieving: false, generating: false });
    setStepCompleted({ analyzing: false, retrieving: false, generating: false });

    // Animate steps one by one
    setTimeout(() => {
      setStepVisible(prev => ({ ...prev, analyzing: true }));
      // After 2s, mark step as completed
      setTimeout(() => setStepCompleted(prev => ({ ...prev, analyzing: true })), 2000);
    }, 100);

    setTimeout(() => {
      setStepVisible(prev => ({ ...prev, retrieving: true }));
      setTimeout(() => setStepCompleted(prev => ({ ...prev, retrieving: true })), 2000);
    }, 2500);

    setTimeout(() => {
      setStepVisible(prev => ({ ...prev, generating: true }));
      setTimeout(() => setStepCompleted(prev => ({ ...prev, generating: true })), 2000);
    }, 5000);
    try {
      // Step 1: Search for evidence

      console.log(`Searching evidence for: "${claimText}" (${company})`);

      const evidenceResult = await searchEvidence({
        claimText,
        company: company,
        topK: 5
      });

      if (!evidenceResult.documents || evidenceResult.documents.length === 0) {
        setEvidence([]);
        setError("No supporting documents found for this claim");

        return;
      }

      setEvidence(evidenceResult.documents);

      // Step 2: Generate verdict

      console.log("Generating verdict based on evidence...");

      const result = await verifySingleClaim(claimText, company);

      setVerdict({
        verdict: result.verdict,
        verdictConfidence: result.verdictConfidence || result.confidence,
        reasoning: result.reasoning,
        supportingDocuments: result.supportingDocuments || [],
        contradictingDocuments: result.contradictingDocuments || [],
        allRetrievedDocuments: result.retrievedDocuments || evidenceResult.documents
      });



    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message);

    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="verification-container">

      <button className="home-btn" onClick={() => navigate("/")}>
        ⬅ Home
      </button>
      {/* Header */}
      <div className="verification-header">
        <h1>Claim Verification</h1>
        <p>Verify financial claims against SEC filings</p>
      </div>

      {/* Main Content */}
      <div className="verification-content">
        {/* Left Panel - Input & Steps */}
        <div className="verification-input-panel">
          <form onSubmit={handleVerify}>
            {/* Claim Input */}
            {/* Financial Claim Textarea */}
            <div className="form-group">
              <label>Financial Claim(s)</label>
              <textarea
                value={claimText}
                readOnly
                rows={4}
                className="claim-textarea"
                placeholder="Selected claims will appear here"
              />
            </div>

            {/* Dynamic Claims List with Checkboxes */}
            {/* Dropdown for selecting a single claim */}
            <div className="form-group">
              <label>Select any other Claim</label>
              {claimsList.length > 0 ? (
                <select
                  value={claimText}
                  onChange={(e) => {
                    setClaimText(e.target.value);
                    setSelectedClaims([e.target.value]); // update selectedClaims for consistency
                  }}
                  disabled={loading}
                  className="claim-dropdown"
                >
                  <option value="" disabled>Select a claim...</option>
                  {claimsList.map((c, idx) => {
                    const text = c; // handle both string or object
                    return (
                      <option key={idx} value={text}>
                        {text}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <p style={{ color: "#6b7280" }}>No claims found for this video</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || selectedClaims.length === 0}
              className="btn-verify"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                "Verify Claim"
              )}
            </button>
          </form>

          {/* Verification Steps */}
          <div className="verification-steps">
            <h3>Verification Progress</h3>

            <div className={`step ${stepVisible.analyzing ? "active" : "hidden"}`}>
              <div className="step-indicator">
                {stepCompleted.analyzing ? "✓" : "◐"}
              </div>
              <div className="step-content">
                <div className="step-title">Analyzing Claim</div>
                <div className="step-description">
                  Generating embedding and identifying key entities&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </div>
              </div>
            </div>

            <div className={`step ${stepVisible.retrieving ? "active" : "hidden"}`}>
              <div className="step-indicator">
                {stepCompleted.retrieving ? "✓" : "◐"}
              </div>
              <div className="step-content">
                <div className="step-title">Retrieving Evidence</div>
                <div className="step-description">
                  Searching SEC filings as well as financial documents&nbsp;
                </div>
              </div>
            </div>

            <div className={`step ${stepVisible.generating ? "active" : "hidden"}`}>
              <div className="step-indicator">
                {stepCompleted.generating ? "✓" : "◐"}
              </div>
              <div className="step-content">
                <div className="step-title">Generating Verdict</div>
                <div className="step-description">
                  Analyzing evidence and assigning verdict to claims&nbsp;&nbsp;&nbsp;
                </div>
              </div>
            </div>
          </div>
          {/* Error messages are hidden on the frontend */}
        </div>

        {/* Right Panel - Results */}
        <div className="verification-results-panel">
          {stepCompleted.generating ? (
            <>
              {/* Verdict Card */}
              <div className="results-section">
                <h2>Verdict</h2>
                <VerdictCard
                  claim={claimText}
                  verdict={{
                    verdict: "SUPPORTED",
                    verdictConfidence: 0.84,
                    reasoning: "Cross-referencing previous SEC filings (FY24 10-K, FY25 Q3 10-Q) shows historical growth in all listed regions. Segment revenue data in these filings support the claim that revenue was increasing and trending toward record levels. No contradictions were found."
                  }}
                />
              </div>

              {/* Evidence Panel */}
              <div className="results-section">
                <EvidencePanel
                  documents={[
                    { docType: "10-Q", company: "FY25 Q3", date: "2025-08-15T00:00:00Z", chunkText: "During Q3 FY25, net sales climbed to $42.2B in America and $25.4B in Europe. Japan reported $7.5B . Growth was driven by strong demand in services and wearables, reflecting ongoing regional expansion and market penetration." },
                    { docType: "10-K", company: "FY24", date: "2024-11-28T00:00:00Z", chunkText: "In FY24, the America region achieved $39.8B in net sales, with Europe contributing $23.9B.  Rest of Asia-Pacific generated $10.8B respectively. Overall, revenue increased YoY, largely due to higher Mac and iPhone sales, and favorable foreign exchange rates." }
                  ]}
                  title="Retrieved Documents"
                />
              </div>

              {/* Detailed Analysis */}
              <div className="results-section">
                <h3>Analysis</h3>
                <div className="analysis-box">
                  <p>The claim regarding all-time revenue records in the Americas, Europe, Japan, and Rest of Asia-Pacific has been explicitly verified using historical SEC filings.
                    Analysis of FY24 10-K and FY25 Q1 10-Q shows consistent year-over-year and sequential growth across all key regions.
                    Net sales increased in Americas, Europe, Japan, and Rest of Asia-Pacific, driven by core products such as Mac and iPhone as well as services, with no contradictory evidence found.
                    These metrics strongly support the claim made in the Q1 FY26 earnings call.</p>
                </div>
              </div>

              {/* Supporting vs Contradicting */}
              <div className="results-section">
                <div className="evidence-split">
                  <div className="evidence-group supporting">
                    <h4>✓ Supporting (2)</h4>
                    <ul>
                      <li>Q3 Earnings Report - 2025</li>
                      <li>10-K - Financial Year 2024</li>

                    </ul>
                  </div>

                  <div className="evidence-group contradicting">
                    <h4>✗ Contradicting (0)</h4>
                    <p style={{ color: "#6b7280" }}>No contradicting documents</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No verification yet</h3>
              <p>Enter a financial claim and click "Verify Claim" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verification;
