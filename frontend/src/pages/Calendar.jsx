import React, { useState } from "react";
import "../styles/Calendar.css";
import { useNavigate } from "react-router-dom";
const earningsData = {
  "2026-03-02": [
    { name: "Oracle", ticker: "ORCL", time: "AMC", eps: "1.12", revenue: "$13B", call: "#" },
  ],
  "2026-03-05": [
    { name: "Meta", ticker: "META", time: "AMC", eps: "3.21", revenue: "$36B", call: "#" },
  ],
  "2026-03-08": [
    { name: "Intel", ticker: "INTC", time: "BMO", eps: "0.45", revenue: "$15B", call: "#" },
  ],
  "2026-03-10": [
    { name: "Netflix", ticker: "NFLX", time: "AMC", eps: "2.45", revenue: "$9B", call: "#" },
  ],
  "2026-03-12": [
    { name: "Adobe", ticker: "ADBE", time: "BMO", eps: "4.1", revenue: "$5B", call: "#" },
  ],
  "2026-03-15": [
    { name: "Nvidia", ticker: "NVDA", time: "AMC", eps: "5.02", revenue: "$28B", call: "#" },
  ],
  "2026-03-18": [
    { name: "AMD", ticker: "AMD", time: "AMC", eps: "0.95", revenue: "$7B", call: "#" },
  ],
  "2026-03-20": [
    { name: "Google", ticker: "GOOGL", time: "AMC", eps: "1.89", revenue: "$80B", call: "#" },
  ],
  "2026-03-22": [
    { name: "Salesforce", ticker: "CRM", time: "BMO", eps: "1.5", revenue: "$9B", call: "#" },
  ],
  "2026-03-25": [
    { name: "Uber", ticker: "UBER", time: "AMC", eps: "0.32", revenue: "$10B", call: "#" },
  ],
  "2026-03-26": [
    { name: "Apple", ticker: "AAPL", time: "AMC", eps: "1.42", revenue: "$94B", call: "#" },
    { name: "Tesla", ticker: "TSLA", time: "BMO", eps: "0.82", revenue: "$25B", call: "#" },
  ],
  "2026-03-26": [
    { name: "Microsoft", ticker: "MSFT", time: "AMC", eps: "2.78", revenue: "$61B", call: "#" },
    { name: "Amazon", ticker: "AMZN", time: "BMO", eps: "0.98", revenue: "$142B", call: "#" },
  ],
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [subscribed, setSubscribed] = useState({});
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const toggleSubscribe = (ticker) => {
    setSubscribed((prev) => ({
      ...prev,
      [ticker]: !prev[ticker],
    }));
  };

  const year = 2026;
  const month = 2;

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formatDate = (d) => `2026-03-${String(d).padStart(2, "0")}`;

  const cells = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(<div key={"e" + i} className="cell empty"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const key = formatDate(d);

    let companies = earningsData[key];

    if (companies && search) {
      companies = companies.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.ticker.toLowerCase().includes(search.toLowerCase())
      );
    }

    cells.push(
      <div
        key={d}
        className={`cell ${companies?.length ? "active" : ""}`}
        onClick={() => companies?.length && setSelectedDate(key)}
      >
        <div className="day">{d}</div>

        {companies?.slice(0, 2).map((c, i) => (
          <div key={i} className="event">
            {c.ticker}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="page">
      <button className="home-btn" onClick={() => navigate("/")}>
        ⬅ Home
      </button>
      {/* 🎬 VIDEO */}
      <video autoPlay muted loop className="bg-video">
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <div className="overlay"></div>

      {/* CONTENT */}
      <div className="content-wrapper">
        <div className="wrapper">

          <div className="header-card">
            <h1>Earnings Calendar</h1>

            <div className="header-controls">
              <div className="nav">
                <button className="nav-btn">←</button>
                <span className="month">March 2026</span>
                <button className="nav-btn">→</button>
              </div>

              <input
                className="search"
                placeholder="🔍 Search company (AAPL, Tesla...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="weekdays">
            {weekdays.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid">{cells}</div>

          {/* SIDEBAR */}
          {selectedDate && (
            <div className="sidebar">
              <div className="sidebar-header">
                <h2>{selectedDate}</h2>
                <button onClick={() => setSelectedDate(null)}>✕</button>
              </div>

              {earningsData[selectedDate].map((c, i) => (
                <div key={i} className="card">
                  <div className="top">
                    <div>
                      <h3>{c.name}</h3>
                      <p>{c.ticker}</p>
                    </div>
                    <span className={`badge ${c.time}`}>{c.time}</span>
                  </div>

                  <div className="metrics">
                    <div>
                      <p>EPS</p>
                      <strong>{c.eps}</strong>
                    </div>
                    <div>
                      <p>Revenue</p>
                      <strong>{c.revenue}</strong>
                    </div>
                  </div>

                  <a href={c.call} target="_blank" className="call">
                    ▶ View Earnings Call
                  </a>

                  <button
                    className={`sub ${subscribed[c.ticker] ? "active" : ""}`}
                    onClick={() => toggleSubscribe(c.ticker)}
                  >
                    {subscribed[c.ticker] ? "Subscribed ✓" : "Subscribe"}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}