import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setToken, setUser } from "../utils/auth";
import { useLocation } from "react-router-dom";

const companies = ["Apple", "Microsoft", "Tesla", "Google", "Amazon"];

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [watchlist, setWatchlist] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleCompanyClick = (company, e) => {
    e.stopPropagation(); // ✅ prevent dropdown from immediately closing
    if (watchlist.includes(company)) {
      setWatchlist(watchlist.filter((c) => c !== company));
    } else {
      setWatchlist([...watchlist, company]);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, watchlist }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.message || "Signup failed");

      setToken(data.token);
      setUser(data.user);
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  // CSS-in-JS styles for dropdown
  const dropdownStyles = {
    container: {
      position: "relative",
      margin: "15px 0",
      width: "100%",
    },
    header: {
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #555",
      cursor: "pointer",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#222",
      color: "#fff",
    },
    list: {
      position: "absolute",
      top: "100%",
      left: 0,
      width: "100%",
      maxHeight: "150px",
      overflowY: "auto",
      border: "1px solid #555",
      borderRadius: "8px",
      backgroundColor: "#333",
      color: "#fff",
      boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
      zIndex: 10,
    },
    item: {
      padding: "10px",
      cursor: "pointer",
    },
    itemHover: {
      backgroundColor: "#444",
    },
    itemSelected: {
      backgroundColor: "#007bff",
      color: "#fff",
    },
    arrow: {
      marginLeft: "10px",
      transition: "transform 0.3s",
    },
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-left">
          <h2>Create Account</h2>
          <p className="subtitle">Join VeriLedger</p>

          <form className="form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #555",
                backgroundColor: "#ffffffff",
                color: "#1f1f1fff", // text color
                caretColor: "#1e1e1eff", // cursor color
                marginBottom: "12px",
                width: "100%",
                fontSize: "14px",
              }}
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #555",
                backgroundColor: "#ffffffff",
                color: "#1f1f1fff",
                caretColor: "#1e1e1eff",
                marginBottom: "12px",
                width: "100%",
                fontSize: "14px",
              }}
            />

            <div style={{ position: "relative", marginBottom: "12px" }}>
              <input
                type={showPassword ? "text" : "password"} // toggle type
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #555",
                  backgroundColor: "#ffffffff",
                  color: "#1f1f1fff",
                  caretColor: "#1e1e1eff",
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
                {showPassword ? "🔓" : "🔒"} {/* eye icons for show/hide */}
              </span>
            </div>


            <div style={dropdownStyles.container} ref={dropdownRef}>
              <label
                style={{ display: "block", marginBottom: "5px", color: "#151212ff" }}
              >
                Companies you want notifications for (optional):
              </label>
              <div style={dropdownStyles.header} onClick={toggleDropdown}>
                {watchlist.length > 0
                  ? watchlist.join(", ")
                  : "Select companies..."}
                <span
                  style={{
                    ...dropdownStyles.arrow,
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </span>
              </div>
              {dropdownOpen && (
                <div style={dropdownStyles.list}>
                  {companies.map((company) => (
                    <div
                      key={company}
                      style={{
                        ...dropdownStyles.item,
                        ...(watchlist.includes(company)
                          ? dropdownStyles.itemSelected
                          : {}),
                      }}
                      onClick={(e) => handleCompanyClick(company, e)} // ✅ pass event
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
                      onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = watchlist.includes(company)
                        ? "#007bff"
                        : "#444")
                      }
                    >
                      {company}
                    </div>
                  ))}

                </div>
              )}
            </div>

            <button type="submit">Sign Up →</button>
            {error && <p className="error">{error}</p>}
          </form>

          <p className="switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>

        {/* <div className="auth-right">
          <img
            src="/illustration.png"
            alt="Signup Illustration"
            className="auth-illustration"
          />
        </div> */}
      </div>
    </div>
  );
};

export default Signup;