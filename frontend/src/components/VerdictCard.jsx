import React from "react";

const VerdictCard = ({ claim, verdict }) => {
  const getVerdictColor = (verdictType) => {
    switch (verdictType) {
      case "SUPPORTED":
        return "#22c55e"; // green
      case "REFUTED":
        return "#ef4444"; // red
      case "UNCERTAIN":
        return "#f59e0b"; // amber
      default:
        return "#6b7280"; // gray
    }
  };

  const getVerdictIcon = (verdictType) => {
    switch (verdictType) {
      case "SUPPORTED":
        return "✓";
      case "REFUTED":
        return "✗";
      case "UNCERTAIN":
        return "?";
      default:
        return "○";
    }
  };

  if (!verdict) {
    return (
      <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#f3f4f6" }}>
        <p style={{ color: "#6b7280", margin: 0 }}>No verdict available</p>
      </div>
    );
  }

  const color = getVerdictColor(verdict.verdict);
  const icon = getVerdictIcon(verdict.verdict);
  const confidencePercent = Math.round((verdict.verdictConfidence || 0) * 100);

  return (
    <div style={{
      padding: "16px",
      borderRadius: "8px",
      borderLeft: `4px solid ${color}`,
      backgroundColor: "#f9fafb",
      marginBottom: "16px"
    }}>
      {/* Claim Text */}
      <p style={{
        margin: "0 0 8px 0",
        fontWeight: "500",
        fontSize: "14px",
        color: "#1f2937"
      }}>
        {claim}
      </p>

      {/* Verdict Badge */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "8px"
      }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: color,
          color: "white",
          fontSize: "16px",
          fontWeight: "bold"
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: "14px",
          fontWeight: "600",
          color: color
        }}>
          {verdict.verdict}
        </span>
        <span style={{
          fontSize: "12px",
          color: "#6b7280",
          marginLeft: "auto"
        }}>
          Confidence: {confidencePercent}%
        </span>
      </div>

      {/* Reasoning */}
      {verdict.reasoning && (
        <p style={{
          margin: "8px 0",
          fontSize: "13px",
          color: "#374151",
          fontStyle: "italic"
        }}>
          {verdict.reasoning}
        </p>
      )}

      {/* Supporting/Contradicting Count */}
      <div style={{
        display: "flex",
        gap: "16px",
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "8px"
      }}>
        {verdict.supportingDocuments && verdict.supportingDocuments.length > 0 && (
          <span style={{ color: "#22c55e" }}>
            ✓ {verdict.supportingDocuments.length} supporting doc(s)
          </span>
        )}
        {verdict.contradictingDocuments && verdict.contradictingDocuments.length > 0 && (
          <span style={{ color: "#ef4444" }}>
            ✗ {verdict.contradictingDocuments.length} contradicting doc(s)
          </span>
        )}
      </div>
    </div>
  );
};

export default VerdictCard;
