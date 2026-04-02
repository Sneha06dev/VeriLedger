import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import { Upload } from "lucide-react";
const companies = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "ORCL",
  "ADBE", "INTC", "CRM", "AMD", "QCOM", "CSCO", "IBM", "NOW", "SNOW"
];

const Home = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [ytCompany, setYtCompany] = useState("AAPL");
  const isValidYouTubeUrl = (url) => {
  const regex =
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return regex.test(url);
};
  // ===== Handlers =====
  const handleAnalyzeYouTube = async () => {
    if (!youtubeLink.trim()) return alert("Enter YouTube link");
    if (!isValidYouTubeUrl(youtubeLink)) {
    alert("Please enter a valid YouTube link");
    return;
  }
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/youtube/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: youtubeLink,
          company: ytCompany
        })
      });

      if (!response.ok) throw new Error("Failed");

      await response.json();

      
      navigate("/results", { state: { videoUrl: youtubeLink }});
      

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setYoutubeLink("");
    }
  };

  const handleFileUpload = (e) => {
    setUploadedFile(e.target.files[0]);
  };

  const handleAnalyzeFile = () => {
    if (!uploadedFile) return alert("Upload file first");
    console.log("Analyzing:", uploadedFile);
    setUploadedFile(null);
  };

  return (
    <div className="home">
      <button className="home-btn" onClick={() => navigate("/")}>
        ⬅ Home
      </button>
      {/* 🎥 VIDEO BACKGROUND */}
      <div className="home-video-bg">
        <video autoPlay loop muted playsInline>
          <source src="/bg.mp4" type="video/mp4" />
        </video>
      </div>


      {/* HERO */}
      <div className="home-hero">

        {/* LEFT */}
        <div className="home-left">
          <p className="home-tag">MEDIA ANALYSIS</p>

          <h1>
            Analyze Earnings Call <br />
            & Verify Claims
          </h1>

          <p className="home-subtitle">
            Upload financial transcripts or paste YouTube links of Earnings Call for over 100 companies to verify claims using Retrival Augmented Reasoning.Relax and let VeriLedger do the heavy lifting!
          </p>

          <div className="home-stats">
            <div className="home-stat-box">
              <h3>16</h3>
              <p>Reports Analyzed</p>
            </div>

            <div className="home-stat-box">
              <h3>2.4GB</h3>
              <p>Data Processed</p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="home-right">
          <div className="home-card">

            <h3>Upload Transcript</h3>

            <div className="home-upload">
              <Upload size={32} />
              <p>Drag & drop transcript here</p>
              <input type="file" onChange={handleFileUpload} />
            </div>

            <button className="home-btn-primary" onClick={handleAnalyzeFile}>
              Analyze Here
            </button>

            <p className="home-or">OR</p>

            <input
              type="text"
              placeholder="Paste YouTube link..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
            />

            <div className="home-row">
              <select
                value={ytCompany}
                onChange={(e) => setYtCompany(e.target.value)}
              >
                {companies.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <button onClick={handleAnalyzeYouTube}>
                {loading ? "Processing..." : "Analyze"}
              </button>
            </div>

            {error && <p className="home-error">{error}</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;