
import React, { useState } from "react";
import "../App.css";

const sampleEarningsData = [
  { id: 1, company: "Infosys", quarter: "Q2 FY24", date: "Oct 12, 2023", status: "✓" },
  { id: 2, company: "TCS", quarter: "Q3 FY24", date: "Jan 10, 2024", status: "✓" },
  { id: 3, company: "HCL Technologies", quarter: "Q4 FY24", date: "Apr 15, 2024", status: "..." },
  { id: 4, company: "Wipro", quarter: "Q1 FY25", date: "Jul 22, 2024", status: "✓" },
  { id: 5, company: "Tech Mahindra", quarter: "Q2 FY25", date: "Oct 18, 2024", status: "✓" },
];

const companies = ["All Companies", "Infosys", "TCS", "HCL Technologies", "Wipro", "Tech Mahindra"];
const years = [2024, 2023, 2022];
const quarters = ["Q1", "Q2", "Q3", "Q4"];

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [companyURL, setCompanyURL] = useState("");

  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  const [earningsData, setEarningsData] = useState(sampleEarningsData);

  // ===== Handlers =====
const handleAnalyzeYouTube = async () => {
  if (!youtubeLink.trim()) return alert("Please enter a YouTube link");

  setLoading(true);
  setError("");

  try {
    const response = await fetch("http://localhost:5000/api/youtube/extract-transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtube_link: youtubeLink }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to extract transcript");
    }

    const data = await response.json();
    console.log("Transcript:", data.transcript);

    // Update pastedText state so the Analyze Text flow can use it
    setPastedText(data.transcript);
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setLoading(false);
    setYoutubeLink(""); // clear input
  }
};

  <div className="analysis-input-group">
  <input
    type="text"
    placeholder="Paste YouTube link..."
    value={youtubeLink}
    onChange={(e) => setYoutubeLink(e.target.value)}
    className="youtube-input"
  />
  <button onClick={handleAnalyzeYouTube} className="btn btn-primary" disabled={loading}>
    {loading ? "Fetching..." : "Analyze"}
  </button>
  {error && <p className="error-text">{error}</p>}
</div>

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    console.log("Uploaded file:", file);
    setUploadedFile(file);
  };

  const handleAnalyzeFile = () => {
    if (!uploadedFile) return alert("Please upload a file");
    console.log("Analyzing file:", uploadedFile);
    setUploadedFile(null);
  };

  const handleAnalyzeURL = () => {
    if (!companyURL.trim()) return alert("Please enter a company/IR URL");
    console.log("Analyze URL:", companyURL);
    setCompanyURL("");
  };

  const handleAnalyzeText = () => {
    if (!pastedText.trim()) return alert("Please paste transcript text");
    console.log("Analyze pasted text:", pastedText);
    setPastedText("");
  };

  const handleSearchFilters = () => {
    console.log("Search filters:", { selectedCompany, selectedYear, selectedQuarter });
  };

  const handleAnalyzeEarnings = (earningsId, company) => {
    console.log(`Analyze earnings ID ${earningsId} for ${company}`);
  };

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="navbar-title">VeriLedger</h1>
          <p className="navbar-subtitle">AI-Powered Earnings Call Verification</p>
        </div>
      </nav>

      <div className="home-content">
        {/* ===== Multi-Input Analysis Section ===== */}
        <section className="analysis-section">
          <h2>Earnings Call Analysis</h2>

          {/* YouTube */}
          <div className="analysis-input-group">
            <input
              type="text"
              placeholder="Paste YouTube link..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="youtube-input"
            />
            <button onClick={handleAnalyzeYouTube} className="btn btn-primary">Analyze</button>
          </div>

          {/* File Upload */}
          <div className="analysis-input-group">
  {/* Wrap the file input and label for better styling */}
  <label className="file-input-label">
    {uploadedFile ? uploadedFile.name : "Choose file (.txt,.pdf,.docx,.mp3,.wav,.m4a,.mp4,.mov,.avi)"}
    <input
      type="file"
      accept=".txt,.pdf,.docx,.mp3,.wav,.m4a,.mp4,.mov,.avi"
      onChange={handleFileUpload}
      style={{ display: "none" }}
    />
  </label>
  <button onClick={handleAnalyzeFile} className="btn btn-primary">
    Analyze File
  </button>
</div>

          {/* Company IR / Website URL */}
          <div className="analysis-input-group">
            <input
              type="text"
              placeholder="Paste company IR/website link..."
              value={companyURL}
              onChange={(e) => setCompanyURL(e.target.value)}
            />
            <button onClick={handleAnalyzeURL} className="btn btn-primary">Analyze URL</button>
          </div>

          {/* Paste Text */}
          <div className="analysis-input-group">
            <textarea
              placeholder="Paste transcript text here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={5}
              className="paste-textarea"
            />
            <button onClick={handleAnalyzeText} className="btn btn-primary">Analyze Text</button>
          </div>
        </section>

        {/* Filters Section */}
        <section className="filters-section">
          <h2>Filter Earnings Calls</h2>
          <div className="filter-group">
            <div className="filter-item">
              <label>Company:</label>
              <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
                {companies.map((company) => <option key={company}>{company}</option>)}
              </select>
            </div>

            <div className="filter-item">
              <label>Year:</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map((year) => <option key={year}>{year}</option>)}
              </select>
            </div>

            <div className="filter-item">
              <label>Quarter:</label>
              <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                {quarters.map((q) => <option key={q}>{q}</option>)}
              </select>
            </div>

            <button onClick={handleSearchFilters} className="btn btn-secondary">Search</button>
          </div>
        </section>

        {/* Latest Earnings Calls Table */}
        <section className="table-section">
          <h2>Latest Earnings Calls</h2>
          <table className="earnings-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Quarter</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {earningsData.map((earnings) => (
                <tr key={earnings.id}>
                  <td>{earnings.company}</td>
                  <td>{earnings.quarter}</td>
                  <td>{earnings.date}</td>
                  <td>{earnings.status}</td>
                  <td>
                    <button onClick={() => handleAnalyzeEarnings(earnings.id, earnings.company)}
                            className="btn btn-small btn-analyze">Analyze</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default Home;