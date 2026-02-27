import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Sidebar from "./components/Sidebar.jsx";
import Home from "./pages/Home.jsx";
// import EarningsCall from "./pages/EarningsCall.jsx";
// import Claims from "./pages/Claims.jsx";
// import Evidence from "./pages/Evidence.jsx";
// import Verification from "./pages/Verification.jsx";
// import Explanation from "./pages/Explanation.jsx";
import "./App.css";

function App() {
  return (
     <Router>
      <div className="app">
        {/* <Sidebar /> removed for now */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
    // <Router>
    //   <div className="app">
    //     <Sidebar />
    //     <div className="main-content">
    //       <Routes>
    //         <Route path="/" element={<Home />} />
    //         <Route path="/earnings" element={<EarningsCall />} />
    //         <Route path="/claims" element={<Claims />} />
    //         <Route path="/evidence" element={<Evidence />} />
    //         <Route path="/verification" element={<Verification />} />
    //         <Route path="/explanation" element={<Explanation />} />
    //       </Routes>
    //     </div>
    //   </div>
    // </Router>
  );
}

export default App;