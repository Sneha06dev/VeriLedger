import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import "../styles/results.css";

const transcriptSteps = [
  { key: "validating", title: "Validating YouTube Link", description: "Checking URL..." },
  { key: "fetching", title: "Fetching Metadata", description: "Getting video info..." },
  { key: "downloading", title: "Downloading Audio", description: "Preparing stream..." },
  { key: "transcribing", title: "Transcribing", description: "Converting audio to text..." },
  { key: "postprocessing", title: "Cleaning Transcript", description: "Removing noise..." },
];

const Results = () => {
  const location = useLocation(); // gives info about current route
  const videoUrl = location.state?.videoUrl; 
  const company = location.state?.company;
  const [visibleCount, setVisibleCount] = useState(1); // Start with only 1st step
  const [completedSteps, setCompletedSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [transcriptText, setTranscriptText] = useState(""); // stores the text 
  const [transcriptReady, setTranscriptReady] = useState(false);
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [showClaims, setShowClaims] = useState(false);
  
  const processSteps = async () => {
    for (let i = 0; i < transcriptSteps.length; i++) {
      const delay = 1500; // step duration

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Mark step completed
      setCompletedSteps((prev) => [...prev, i]);

      // Reveal next step
      if (i < transcriptSteps.length - 1) {
        setVisibleCount(i + 2);
      } else {
        setTranscriptReady(true);
      }
    }
  };

  useEffect(() => {
    // Progress bar animates continuously using setInterval instead of requestAnimationFrame 
    // to prevent clogging React's render queue.
    const duration = 7500; // 7.5 seconds total
    const startTime = Date.now();

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const pct = Math.min(elapsed / duration, 1);
      
      setProgress(pct * 100); // progress from 0 → 100%
      
      if (pct >= 1) {
        clearInterval(timer);
      }
    }, 50); // Update every 50ms for smooth animation
    
    // Cleanup prevents double-firing in Strict Mode
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    processSteps();
  }, []);

  useEffect(() => {
    if (transcriptReady && videoUrl) {
      setLoadingTranscript(true);
      const timer = setTimeout(() => {
        const encodedUrl = encodeURIComponent(videoUrl);
        
        console.log("=".repeat(70));
        console.log("🎬 FETCHING TRANSCRIPT FROM API");
        console.log("Original videoUrl:", videoUrl);
        console.log("Encoded videoUrl:", encodedUrl);
        console.log("=".repeat(70));

        // ✅ Use full backend URL instead of relative path
        const apiUrl = `http://localhost:5000/api/transcript?videoUrl=${encodedUrl}`;
        console.log("📍 Fetching from:", apiUrl);

        fetch(apiUrl)
          .then((res) => {
            console.log("📡 API Response received");
            console.log("Status:", res.status);
            console.log("Status text:", res.statusText);
            console.log("Content-Type:", res.headers.get("content-type"));
            
            if (!res.ok) {
              throw new Error(`API returned ${res.status}: ${res.statusText}`);
            }
            
            // First, get raw text to debug what's being returned
            return res.text();
          })
          .then((text) => {
            console.log("📄 Raw response (first 300 chars):", text.substring(0, 300));
            console.log("📄 Is HTML?", text.trim().startsWith("<"));
            
            // Try to parse as JSON
            if (text.trim().startsWith("<")) {
              throw new Error("Server returned HTML instead of JSON. Check backend logs.");
            }
            
            return JSON.parse(text);
          })
          .then((data) => {
            console.log("✅ API Response parsed successfully");
            console.log("Response data:", data);
            
            // Try both field names for compatibility
            const transcript = data.text || data.transcript;
            
            if (transcript) {
              console.log("🎉 TRANSCRIPT RECEIVED!");
              console.log("Length:", transcript.length, "characters");
              if (data.metadata) {
                console.log("Metadata:", data.metadata);
              }
              setTranscriptText(transcript);
            } else {
              console.warn("⚠️ No transcript text found in response");
              console.log("Full response:", JSON.stringify(data, null, 2));
              setTranscriptText("Transcript data found but no text content.");
            }
            setLoadingTranscript(false);
          })
          .catch((err) => {
            console.error("❌ ERROR FETCHING TRANSCRIPT");
            console.error("Error type:", err.name);
            console.error("Error message:", err.message);
            console.error("Full error:", err);
            setTranscriptText(`Error: ${err.message}`);
            setLoadingTranscript(false); // done loading
          });
      }, 8000); // 8000ms = 8 seconds delay

      return () => clearTimeout(timer); // cleanup if component unmounts
    }
  }, [transcriptReady, videoUrl]);

  const fetchClaims = async () => {
  try {
    setLoadingClaims(true);

    const res = await fetch("http://localhost:5000/api/claims/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        transcript: transcriptText,
        videoUrl: videoUrl,
        company: company || "Unknown",
        transcriptId: videoUrl // simple unique id
      })
    });

    const data = await res.json();

    setClaims(data.claims || []);
    setShowClaims(true);

  } catch (err) {
    console.error(" Error fetching claims:", err);
  } finally {
    setLoadingClaims(false);
  }
};

  return (
    <div className="results-page">
      <video autoPlay muted loop className="bg-video">
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <div className="results-content">
        {!transcriptReady ? (
          <>
            <div className="verification-steps">
              <h3 className="status-title">Transcription Progress</h3>
              
              {/* Only map the steps that are currently visible */}
              {transcriptSteps.slice(0, visibleCount).map((step, index) => (
                <div
                  key={step.key}
                  className={`step-card ${completedSteps.includes(index) ? "completed" : "active"}`}
                >
                  <div className="step-indicator">
                    {completedSteps.includes(index) ? "✓" : "●"}
                  </div>
                  <div className="step-content">
                    <div className="step-title">{step.title}</div>
                    <p className="step-description">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

          <div className="progress-container">
  <div className="progress-bar" style={{ width: `${progress}%` }}></div>
</div>
</>
) : (
<>
  {loadingTranscript ? (
    <div className="loading-transcript" style={{ textAlign: "center", padding: "30px", color: "#999" }}>
      <p style={{ fontSize: "24px", fontWeight: "bold" }}>⏳ Loading transcript...</p>
    </div>
  ) : transcriptText && !transcriptText.startsWith("Error:") ? (
    <div className="final-transcript fade-in">
      <h2>✓ Transcript Ready!</h2>

      <div className="transcript-box">
        <div style={{ marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "15px" }}>
          <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
            📝 <strong>Word Count:</strong> {transcriptText.split(/\s+/).length.toLocaleString()} words
          </p>
          <p style={{ margin: "5px 0", fontSize: "14px", color: "#666" }}>
            📄 <strong>Length:</strong> {transcriptText.length.toLocaleString()} characters
          </p>
        </div>

        <div
          style={{
            maxHeight: "500px",
            overflowY: "auto",
            padding: "15px",
            backgroundColor: "#f9f9f9",
            borderRadius: "5px",
            lineHeight: "1.6"
          }}
        >
          {transcriptText}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
        <button
          onClick={fetchClaims}
          style={{
            marginTop: "20px",
            padding: "10px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "6px"
          }}
        >
          Show Extracted Claims ➜
        </button>
        </div>
      </div>

      {loadingClaims && (
        <p style={{ marginTop: "10px" }}>⏳ Extracting claims...</p>
      )}

      {showClaims && claims.length > 0 && (
  <div
    style={{
      marginTop: "20px",
      padding: "10px",
      width: "100%",
    }}
  >
    <h3>Extracted Claims</h3>

    {claims.map((claim, index) => (
      <div
        key={index}
        className="claim-card"
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        <p><strong>Text:</strong> {claim.claimText}</p>
        <p><strong>Type:</strong> {claim.claimType}</p>
        <p><strong>Nature:</strong> {claim.claimNature}</p>
        <p><strong>Speaker:</strong> {claim.speaker}</p>

        {/* Numerical Data Section */}
        {claim.numericalData && claim.numericalData.length > 0 && (
          <div className="numerical-section" >
            <p><strong> Numerical Data:</strong></p>
            {claim.numericalData.map((num, idx) => (
              <div
                key={idx}
                className="numerical-item"
                
              >
                <p><b>Metric:</b> {num.metric}</p>
                <p><b>Value:</b> {num.value} {num.unit}</p>
                <p><b>Direction:</b> {num.direction}</p>
                <p><b>Period:</b> {num.period}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
)}
        </div>
     
  ) : (
    <div className="final-transcript fade-in">
      <div className="transcript-box" style={{ textAlign: "center", color: "red", padding: "20px" }}>
        ⚠️ {transcriptText}
      </div>
    </div>
  )}
</>
)}
            
      </div>
    </div>
  );
};

export default Results;