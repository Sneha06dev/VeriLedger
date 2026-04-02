import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifySingleClaim, searchEvidence } from "../services/verificationService";
import VerdictCard from "../components/VerdictCard";
import EvidencePanel from "../components/EvidencePanel";
import "../styles/Verification.css";

const companies = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];

const Verification = () => {
  const [claimText, setClaimText] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [verificationStep, setVerificationStep] = useState(null); // null, "analyzing", "retrieving", "generating", "done"
  const navigate = useNavigate();
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
    setVerificationStep("analyzing");

    try {
      // Step 1: Search for evidence
      setVerificationStep("retrieving");
      console.log(`Searching evidence for: "${claimText}" (${selectedCompany})`);

      const evidenceResult = await searchEvidence({
        claimText,
        company: selectedCompany,
        topK: 5
      });

      if (!evidenceResult.documents || evidenceResult.documents.length === 0) {
        setEvidence([]);
        setError("No supporting documents found for this claim");
        setVerificationStep("done");
        return;
      }

      setEvidence(evidenceResult.documents);

      // Step 2: Generate verdict
      setVerificationStep("generating");
      console.log("Generating verdict based on evidence...");

      const result = await verifySingleClaim(claimText, selectedCompany);

      setVerdict({
        verdict: result.verdict,
        verdictConfidence: result.verdictConfidence || result.confidence,
        reasoning: result.reasoning,
        supportingDocuments: result.supportingDocuments || [],
        contradictingDocuments: result.contradictingDocuments || [],
        allRetrievedDocuments: result.retrievedDocuments || evidenceResult.documents
      });

      setVerificationStep("done");

    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message);
      setVerificationStep("done");
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step) => {
    if (verificationStep === step) {
      return "active";
    }
    if (["analyzing", "retrieving", "generating", "done"].indexOf(verificationStep) > ["analyzing", "retrieving", "generating", "done"].indexOf(step)) {
      return "completed";
    }
    return "pending";
  };

  return (
    <div className="verification-container">
      <button className="home-btn" onClick={() => navigate("/")}>
        ⬅ Home
      </button>
      {/* Header */}
      <div className="verification-header">
        <h1>Claim Verification</h1>
        <p>Verify financial claims against SEC filings and corporate documents</p>
      </div>

      {/* Main Content */}
      <div className="verification-content">
        {/* Left Panel - Input & Steps */}
        <div className="verification-input-panel">
          <form onSubmit={handleVerify}>
            {/* Claim Input */}
            <div className="form-group">
              <label>Financial Claim</label>
              <textarea
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="Enter a financial claim from an earnings call (e.g., 'Revenue exceeded $400 billion in 2025')"
                rows={4}
                disabled={loading}
                className="claim-textarea"
              />
            </div>

            {/* Company Selection */}
            <div className="form-group">
              <label>Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                disabled={loading}
                className="company-select"
              >
                {companies.map(company => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
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
          {(verificationStep || loading) && (
            <div className="verification-steps">
              <h3>Verification Progress</h3>

              <div className={`step ${getStepStatus("analyzing")}`}>
                <div className="step-indicator">
                  {getStepStatus("analyzing") === "completed" ? "✓" : "◐"}
                </div>
                <div className="step-content">
                  <div className="step-title">Analyzing Claim</div>
                  <div className="step-description">Generating embedding and identifying key entities</div>
                </div>
              </div>

              <div className={`step ${getStepStatus("retrieving")}`}>
                <div className="step-indicator">
                  {getStepStatus("retrieving") === "completed" ? "✓" : "◐"}
                </div>
                <div className="step-content">
                  <div className="step-title">Retrieving Evidence</div>
                  <div className="step-description">Searching SEC filings and corporate documents</div>
                </div>
              </div>

              <div className={`step ${getStepStatus("generating")}`}>
                <div className="step-indicator">
                  {getStepStatus("generating") === "completed" ? "✓" : "◐"}
                </div>
                <div className="step-content">
                  <div className="step-title">Generating Verdict</div>
                  <div className="step-description">Analyzing evidence and assigning verdict</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="verification-results-panel">
          {verdict ? (
            <>
              {/* Verdict Card */}
              <div className="results-section">
                <h2>Verdict</h2>
                <VerdictCard claim={claimText} verdict={verdict} />
              </div>

              {/* Evidence Panel */}
              {evidence && evidence.length > 0 && (
                <div className="results-section">
                  <EvidencePanel documents={evidence} title="Retrieved Documents" />
                </div>
              )}

              {/* Detailed Analysis */}
              {verdict.reasoning && (
                <div className="results-section">
                  <h3>Analysis</h3>
                  <div className="analysis-box">
                    <p>{verdict.reasoning}</p>
                  </div>
                </div>
              )}

              {/* Supporting vs Contradicting */}
              <div className="results-section">
                <div className="evidence-split">
                  <div className="evidence-group supporting">
                    <h4>✓ Supporting ({verdict.supportingDocuments?.length || 0})</h4>
                    {verdict.supportingDocuments && verdict.supportingDocuments.length > 0 ? (
                      <ul>
                        {verdict.supportingDocuments.slice(0, 3).map((doc, idx) => (
                          <li key={idx}>
                            {doc.filing_type} - {doc.company} ({doc.year})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: "#6b7280" }}>No supporting documents</p>
                    )}
                  </div>

                  <div className="evidence-group contradicting">
                    <h4>✗ Contradicting ({verdict.contradictingDocuments?.length || 0})</h4>
                    {verdict.contradictingDocuments && verdict.contradictingDocuments.length > 0 ? (
                      <ul>
                        {verdict.contradictingDocuments.slice(0, 3).map((doc, idx) => (
                          <li key={idx}>
                            {doc.filing_type} - {doc.company} ({doc.year})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: "#6b7280" }}>No contradicting documents</p>
                    )}
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
