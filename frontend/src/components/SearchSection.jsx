import React, { useState } from "react";
import EarningsTable from "./EarningsTable.jsx";

const SearchSection = ({ earningsList, setEarningsList, loading, setLoading }) => {
  const [company, setCompany] = useState("");
  const [year, setYear] = useState("");

  const handleSearch = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/earnings/search?company=${company}&year=${year}`
      );
      const data = await response.json();
      setEarningsList(data);
    } catch (error) {
      console.error("Search error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="search-section">
      <h2>Search Latest Earnings Calls</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <input
          type="text"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />

        <button onClick={handleSearch}>Search</button>
      </div>

      {loading ? <p>Loading...</p> : <EarningsTable earningsList={earningsList} />}
    </div>
  );
};

export default SearchSection;