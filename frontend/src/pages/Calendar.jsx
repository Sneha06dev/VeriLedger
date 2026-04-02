import React, { useState, useEffect } from "react";
import "../styles/Calendar.css";
import { useNavigate } from "react-router-dom";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Calendar() {
  const [earningsData, setEarningsData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [subscribed, setSubscribed] = useState({});
  const [search, setSearch] = useState("");

  // ✅ Dynamic date state
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = useNavigate();

  // ✅ Fetch data
  useEffect(() => {
    fetch("http://localhost:5000/api/calendar/upcoming")
      .then((res) => res.json())
      .then((data) => {
        console.log("Calendar data:", data);
        setEarningsData(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // ✅ Extract year/month dynamically
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // ✅ FIXED DATE FORMAT (CRITICAL)
  const formatDate = (d) => {
    const date = new Date(year, month, d);
    return date.toISOString().split("T")[0];
  };

  // ✅ Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const toggleSubscribe = (ticker) => {
    setSubscribed((prev) => ({
      ...prev,
      [ticker]: !prev[ticker],
    }));
  };

  const cells = [];

  // Empty cells
  for (let i = 0; i < startOffset; i++) {
    cells.push(<div key={"e" + i} className="cell empty"></div>);
  }

  // Days
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

      <video autoPlay muted loop className="bg-video">
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      <div className="overlay"></div>

      <div className="content-wrapper">
        <div className="wrapper">

          <div className="header-card">
            <h1>Earnings Calendar</h1>

            <div className="header-controls">
              <div className="nav">
                <button className="nav-btn" onClick={prevMonth}>←</button>

                <span className="month">
                  {currentDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>

                <button className="nav-btn" onClick={nextMonth}>→</button>
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
          {selectedDate && earningsData[selectedDate] && (
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

                  <a href={c.call} target="_blank" rel="noreferrer" className="call">
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