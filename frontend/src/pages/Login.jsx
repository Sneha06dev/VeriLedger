// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/auth.css";
import { setToken, setUser } from "../utils/auth"; // helper functions to store JWT

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Store JWT and user info
      setToken(data.token);
      setUser(data.user);

      // Redirect to dashboard or homepage
      navigate(from, { replace: true });

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <h2>Login</h2>
          <p className="subtitle">Welcome back</p>

          <form className="form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #555",
                  backgroundColor: "#ffffff",
                  color: "#1f1f1f",       // ✅ black text
                  caretColor: "#1e1e1e",  // ✅ black cursor
                  width: "100%",
                  fontSize: "14px",
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "35%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "#555",
                  userSelect: "none",
                  fontSize: "14px",
                }}
              >
                {showPassword ? "🔓" : "🔒"}
              </span>
            </div>

            <button type="submit">Login →</button>
          </form>

          {error && <p className="error">{error}</p>}

          <p className="switch-text">
            Don’t have an account? <Link to="/signup" state={{ from: location.state?.from }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;