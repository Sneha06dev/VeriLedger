import React, { useState, useEffect } from "react";
import VerdictCard from "../components/VerdictCard";
import EvidencePanel from "../components/EvidencePanel";

const Claims = () => {
  const [verdicts, setVerdicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [error, setError] = useState("");

  // Load available transcripts on mount
  useEffect(() => {
    loadTranscripts();
  }, []);

  // Load verdicts when transcript changes
  useEffect(() => {
    if (selectedTranscript) {
      loadVerdicts(selectedTranscript);
    }
  }, [selectedTranscript]);

  const loadTranscripts = async () => {
    try {
      // This would normally fetch from an API endpoint
      // For now, we'll use a placeholder
      console.log("Loading transcripts...");
    } catch (error) {
      console.error("Error loading transcripts:", error);
    }
  };

  const loadVerdicts = async (transcriptId) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `http://localhost:5000/api/verify/transcript/${transcriptId}/verdicts`
      );
      
      if (!response.ok) {
        throw new Error("Failed to load verdicts");
      }
      
      const data = await response.json();
      setVerdicts(data.verdicts || []);
    } catch (error) {
      console.error("Error loading verdicts:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterVerdictsByStatus = (status) => {
    return verdicts.filter(v => v.verdict === status);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginTop: "0" }}>Claim Verification Results</h1>

      {/* Transcript Selector */}
      {transcripts.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
            Select Transcript:
          </label>
          <select
            value={selectedTranscript || ""}
            onChange={(e) => setSelectedTranscript(e.target.value)}
            style={{
              marginTop: "8px",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              width: "100%",
              maxWidth: "400px"
            }}
          >
            <option value="">-- Select a transcript --</option>
            {transcripts.map((t) => (
              <option key={t.id} value={t.id}>
                {t.company} - {new Date(t.uploadedAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: "12px",
          borderRadius: "6px",
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          marginBottom: "16px",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: "20px",
          textAlign: "center",
          color: "#6b7280"
        }}>
          Loading verdicts...
        </div>
      )}

      {/* No Data State */}
      {!loading && verdicts.length === 0 && !error && (
        <div style={{
          padding: "20px",
          textAlign: "center",
          color: "#6b7280",
          backgroundColor: "#f9fafb",
          borderRadius: "8px"
        }}>
          No verdicts available. Select a transcript or upload a new earnings call.
        </div>
      )}

      {/* Summary Stats */}
      {verdicts.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: "#dcfce7",
            borderLeft: "4px solid #22c55e"
          }}>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#166534", fontWeight: "600" }}>
              SUPPORTED
            </p>
            <p style={{ margin: "0", fontSize: "24px", fontWeight: "bold", color: "#22c55e" }}>
              {filterVerdictsByStatus("SUPPORTED").length}
            </p>
          </div>

          <div style={{
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: "#fee2e2",
            borderLeft: "4px solid #ef4444"
          }}>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#7f1d1d", fontWeight: "600" }}>
              REFUTED
            </p>
            <p style={{ margin: "0", fontSize: "24px", fontWeight: "bold", color: "#ef4444" }}>
              {filterVerdictsByStatus("REFUTED").length}
            </p>
          </div>

          <div style={{
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: "#fef3c7",
            borderLeft: "4px solid #f59e0b"
          }}>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#92400e", fontWeight: "600" }}>
              UNCERTAIN
            </p>
            <p style={{ margin: "0", fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>
              {filterVerdictsByStatus("UNCERTAIN").length}
            </p>
          </div>
        </div>
      )}

      {/* Verdicts List */}
      {verdicts.length > 0 && (
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", marginBottom: "16px" }}>
            All Claims
          </h2>
          
          {verdicts.map((verdict, idx) => (
            <div key={idx} style={{ marginBottom: "32px" }}>
              <VerdictCard
                claim={verdict.claimText}
                verdict={verdict}
              />
              
              {/* Supporting Evidence */}
              {verdict.supportingDocuments && verdict.supportingDocuments.length > 0 && (
                <EvidencePanel
                  documents={verdict.supportingDocuments}
                  title="✓ Supporting Evidence"
                />
              )}

              {/* Contradicting Evidence */}
              {verdict.contradictingDocuments && verdict.contradictingDocuments.length > 0 && (
                <EvidencePanel
                  documents={verdict.contradictingDocuments}
                  title="✗ Contradicting Evidence"
                />
              )}

              {/* All Retrieved Documents */}
              {verdict.allRetrievedDocuments && verdict.allRetrievedDocuments.length > 0 && 
               (!verdict.supportingDocuments?.length && !verdict.contradictingDocuments?.length) && (
                <EvidencePanel
                  documents={verdict.allRetrievedDocuments}
                  title="Retrieved Documents"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Claims;
