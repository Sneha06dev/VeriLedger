import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AnalyzeSection = () => {
  const [videoUrl, setVideoUrl] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!videoUrl) {
      alert("Please enter a video link");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/earnings/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await response.json();

      if (data.earningsId) {
        navigate(`/earnings/${data.earningsId}`);
      }
    } catch (error) {
      console.error("Analyze error:", error);
    }
  };

  return (
    <div className="analyze-section">
      <h2>Analyze Latest Earnings Call</h2>
      <input
        type="text"
        placeholder="Paste YouTube earnings call link"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />
      <button onClick={handleAnalyze}>Analyze</button>
    </div>
  );
};

export default AnalyzeSection;