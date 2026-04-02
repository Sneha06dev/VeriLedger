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
  const [visibleCount, setVisibleCount] = useState(1); // Start with only 1st step
  const [completedSteps, setCompletedSteps] = useState([]);
  const [progress, setProgress] = useState(0);
   const [transcriptText, setTranscriptText] = useState(""); // stores the text 
  const [transcriptReady, setTranscriptReady] = useState(false);
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
  const duration = 7000; // 8 seconds
  const startTime = Date.now();

  const animate = () => {
    const now = Date.now();
    const elapsed = now - startTime;
    const pct = Math.min(elapsed / duration, 1);
    setProgress(pct * 100); // progress from 0 → 100%
    if (pct < 1) requestAnimationFrame(animate);
  };
  
  animate();
}, []);

   useEffect(() => {
  processSteps();
}, []);

  useEffect(() => {
  if (transcriptReady && videoUrl) {
    const timer = setTimeout(() => {
      const encodedUrl = encodeURIComponent(videoUrl);

      fetch(`/api/transcript?videoUrl=${encodedUrl}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch transcript");
          return res.json();
        })
        .then((data) => {
          if (data && data.text) {
            setTranscriptText(data.text); // match your API response
          } else {
            setTranscriptText("Transcript not found.");
          }
        })
        .catch((err) => {
          console.error("Failed to fetch transcript:", err);
          setTranscriptText("Error loading transcript.");
        });
    }, 8000); // 8000ms = 8 seconds delay

    return () => clearTimeout(timer); // cleanup if component unmounts
  }
}, [transcriptReady, videoUrl]);
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
          <div className="final-transcript fade-in">
            <h2>Transcript Ready!</h2>
            <div className="transcript-box">
               <p>{transcriptText || "Loading transcript..."}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;