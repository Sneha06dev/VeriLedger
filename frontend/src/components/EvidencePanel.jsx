import React, { useState } from "react";

const EvidencePanel = ({ documents, title = "Supporting Evidence" }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!documents || documents.length === 0) {
    return (
      <div style={{
        padding: "16px",
        borderRadius: "8px",
        backgroundColor: "#f3f4f6",
        color: "#6b7280"
      }}>
        No evidence documents available
      </div>
    );
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <h4 style={{
        margin: "0 0 12px 0",
        fontSize: "14px",
        fontWeight: "600",
        color: "#1f2937"
      }}>
        {title} ({documents.length})
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {documents.map((doc, idx) => (
          <div
            key={idx}
            style={{
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              cursor: "pointer"
            }}
            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
          >
            {/* Document Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start"
            }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  margin: "0 0 4px 0",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1f2937"
                }}>
                  {doc.docType} - {doc.company}
                </p>
                <p style={{
                  margin: "0",
                  fontSize: "12px",
                  color: "#6b7280"
                }}>
                  {new Date(doc.date).toLocaleDateString()}
                  {doc.similarityScore && ` • Similarity: ${(doc.similarityScore * 100).toFixed(0)}%`}
                </p>
              </div>
              <span style={{
                fontSize: "12px",
                color: "#6b7280",
                marginLeft: "8px"
              }}>
                {expandedIndex === idx ? "▼" : "▶"}
              </span>
            </div>

            {/* Document Preview (Expanded) */}
            {expandedIndex === idx && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                <p style={{
                  margin: "0",
                  fontSize: "12px",
                  color: "#374151",
                  lineHeight: "1.5",
                  maxHeight: "200px",
                  overflow: "auto"
                }}>
                  {doc.chunkText}
                </p>
                {doc.sourceUrl && (
                  <a
                    href={doc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#3b82f6",
                      textDecoration: "none"
                    }}
                  >
                    View Source →
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvidencePanel;
