
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/news.css";

const categories = [
  "All",
  "Revenue",
  "Profit",
  "Growth",
  "Risk",
  "Market Trend"
];

const companies = ["AAPL", "TSLA", "MSFT", "GOOGL"];

const News = () => {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState("AAPL");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTime, setSelectedTime] = useState("24h");

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 3);

    const from = past.toISOString().split("T")[0];
    const to = today.toISOString().split("T")[0];

    setLoading(true);

    fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${selectedCompany}&from=${from}&to=${to}&token=d72org9r01qlfd9o1iqgd72org9r01qlfd9o1ir0`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setNews([]);
          setLoading(false);
          return;
        }

        const formatted = data.slice(0, 12).map((item, i) => {
          const text = (item.headline + " " + item.summary).toLowerCase();

          let category = "Market Trend";
          if (/revenue|sales/.test(text)) category = "Revenue";
          else if (/profit|earnings/.test(text)) category = "Profit";
          else if (/growth|increase/.test(text)) category = "Growth";
          else if (/risk|fall|decline|loss/.test(text)) category = "Risk";

          return {
            id: i,
            headline: item.headline,
            source: item.source,
            datetime: item.datetime,
            time: new Date(item.datetime * 1000).toLocaleString(),
            category,
            summary: item.summary || "No summary available",
            url: item.url
          };
        });

        setNews(formatted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCompany]);

  const now = Date.now();

  const filteredNews = news.filter((item) => {
    const itemTime = item.datetime * 1000;

    if (selectedCategory !== "All" && item.category !== selectedCategory)
      return false;

    if (selectedTime === "1h" && now - itemTime > 3600000) return false;
    if (selectedTime === "24h" && now - itemTime > 86400000) return false;
    if (selectedTime === "3d" && now - itemTime > 3 * 86400000)
      return false;

    return true;
  });

  return (
    <div className="news-container">
      {/* 🔙 Home Button */}
      <button className="home-btn" onClick={() => navigate("/")}>
        ⬅ Home
      </button>
      {/* 🎥 Background Video */}
      <video autoPlay muted loop className="bg-video">
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <div className="news-wrapper">
        {/* HERO */}
        <div className="news-hero">
          <h1>Real-Time Financial News & Claims</h1>
          <p>Structured insights from financial news streams</p>
        </div>

        {/* FILTERS */}
        <div className="news-filters">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            {companies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          >
            <option value="1h">Last 1h</option>
            <option value="24h">Last 24h</option>
            <option value="3d">Last 3 days</option>
          </select>
        </div>

        {/* FEED */}
        <div className="news-feed">
          {loading ? (
            <p>Loading...</p>
          ) : filteredNews.length === 0 ? (
            <p>No results found</p>
          ) : (
            filteredNews.map((item) => (
              <div key={item.id} className="news-card">
                <h2>{item.headline}</h2>

                <div className="news-meta">
                  {item.source} • {item.time}
                </div>

                <div className="news-category">{item.category}</div>

                <p className="news-summary">{item.summary}</p>

                <div className="news-actions">
                  <button onClick={() => window.open(item.url, "_blank")}>
                    View Article
                  </button>

                  <button
                    onClick={() =>
                      alert("Claim extraction coming soon 🚀")
                    }
                  >
                    View Claims
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default News;