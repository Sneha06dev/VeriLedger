import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ShieldCheck,
  Newspaper
} from "lucide-react";
import "../styles/landing.css";


const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );
  return (
    <div className="landing-container">
      <div className="video-bg">
        <video autoPlay loop muted playsInline>
          <source src="/bg.mp4" type="video/mp4" />
        </video>

      </div>
      <div className="video-overlay"></div>
      {/* ===== NAVBAR ===== */}
      <nav className="landing-navbar">
        <img src="/logo.png" alt="logo" className="logo-img" />

        <div className="nav-links">
          <button>Home</button>
          <button onClick={() => navigate("/home")}>Verify</button>
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          {user ? (
            <>
              <button onClick={() => navigate("/profile")}>
                Profile
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  setUser(null);
                  navigate("/");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/login")}>Login</button>
              <button onClick={() => navigate("/signup")}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="landing-hero">
        <p className="landing-tagline">FROM CLAIM TO CLARITY</p>

        <h1 className="landing-title">
          VERIFY <br />
          <span>FINANCIAL CLAIMS</span>
        </h1>

        <p className="landing-subtitle">
          Analyze earnings calls, YouTube videos, and financial news powered by
          semantic search and AI reasoning.
        </p>

        <div className="hero-buttons">
          <button
            className="primary-btn"
            onClick={() => navigate("/home")}
          >
            Enter App →
          </button>

          
        </div>

       
      </section>

      {/* ===== FEATURES ===== */}
      <section className="features-section">

        <div className="features-header">
          <h2 className="features-heading">CORE FEATURES</h2>

        </div>

        <div className="features-grid">

          {/* Earnings */}
          <div
            className="feature-card earnings"
            onClick={() => navigate("/earnings")}
          >

            <div className="card-spacer"></div>

            <div className="card-icon">
              <CalendarDays size={32} />
            </div>

            <div className="card-content">
              <h3>EARNINGS TRACKER</h3>
              <p className="highlight">Stay Updated</p>
              <p>
                Track company earnings calls and receive updates when new transcripts
                or reports are available.
              </p>
              <span className="explore">EXPLORE →</span>
            </div>

          </div>

          {/* Verification */}
          <div
            className="feature-card verification"
            onClick={() => navigate("/home")}
          >

            <div className="card-spacer"></div>

            <div className="card-icon">
              <ShieldCheck size={32} />
            </div>

            <div className="card-content">
              <h3>CLAIM VERIFICATION</h3>
              <p className="highlight">Verify Instantly</p>
              <p>
                Validate financial claims using AI, vector search, and evidence-backed
                explanations.
              </p>
              <span className="explore">EXPLORE →</span>
            </div>

          </div>

          {/* News */}
          <div
            className="feature-card news"
            onClick={() => navigate("/news")}
          >

            <div className="card-spacer"></div>

            <div className="card-icon">
              <Newspaper size={32} />
            </div>

            <div className="card-content">
              <h3>REAL-TIME NEWS</h3>
              <p className="highlight">Stay Informed</p>
              <p>
                Get the latest financial news and insights related to your selected
                companies.
              </p>
              <span className="explore">EXPLORE →</span>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};

export default Landing;