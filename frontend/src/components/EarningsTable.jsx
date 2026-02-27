import React from "react";
import { useNavigate } from "react-router-dom";

const EarningsTable = ({ earningsList }) => {
  const navigate = useNavigate();

  return (
    <table className="earnings-table">
      <thead>
        <tr>
          <th>Company</th>
          <th>Quarter</th>
          <th>Date</th>
          <th>Status</th>
          <th>Analyze</th>
        </tr>
      </thead>
      <tbody>
        {earningsList.map((item) => (
          <tr key={item._id}>
            <td>{item.company}</td>
            <td>{item.quarter}</td>
            <td>{item.date}</td>
            <td>{item.analyzed ? "Analyzed" : "Not Analyzed"}</td>
            <td>
              <button onClick={() => navigate(`/earnings/${item._id}`)}>
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default EarningsTable;