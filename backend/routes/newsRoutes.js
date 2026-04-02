const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// Reuse the company symbols map
const COMPANY_SYMBOLS = {
  "Apple": "AAPL", "Microsoft": "MSFT", "Alphabet": "GOOGL", "Amazon": "AMZN",
  "Meta Platforms": "META", "Nvidia": "NVDA", "Tesla": "TSLA", "Adobe": "ADBE",
  "Oracle": "ORCL", "Intel": "INTC", "Salesforce": "CRM", "Advanced Micro Devices": "AMD",
  "Qualcomm": "QCOM", "Cisco Systems": "CSCO", "IBM": "IBM", "ServiceNow": "NOW",
  "Palo Alto Networks": "PANW", "Snowflake": "SNOW", "Palantir": "PLTR", "Shopify": "SHOP",
  "JPMorgan Chase": "JPM", "Bank of America": "BAC", "Wells Fargo": "WFC",
  "Goldman Sachs": "GS", "Morgan Stanley": "MS", "BlackRock": "BLK", "Citigroup": "C",
  "American Express": "AXP", "Charles Schwab": "SCHW", "U.S. Bancorp": "USB",
  "PNC Financial": "PNC", "Truist Financial": "TFC", "Capital One": "COF",
  "American International Group": "AIG", "Bank of New York Mellon": "BK",
  "Johnson & Johnson": "JNJ", "Pfizer": "PFE", "Merck": "MRK", "AbbVie": "ABBV",
  "Eli Lilly": "LLY", "Bristol-Myers Squibb": "BMY", "Gilead Sciences": "GILD",
  "Amgen": "AMGN", "CVS Health": "CVS", "UnitedHealth Group": "UNH",
  "Medtronic": "MDT", "Thermo Fisher Scientific": "TMO", "Intuitive Surgical": "ISRG",
  "Walmart": "WMT", "Costco": "COST", "Home Depot": "HD", "Lowe's": "LOW",
  "Nike": "NKE", "McDonald's": "MCD", "Starbucks": "SBUX", "Target": "TGT",
  "Booking Holdings": "BKNG", "eBay": "EBAY", "Etsy": "ETSY", "TJX Companies": "TJX",
  "Dollar General": "DG", "Dollar Tree": "DLTR", "ExxonMobil": "XOM", "Chevron": "CVX",
  "ConocoPhillips": "COP", "EOG Resources": "EOG", "Schlumberger": "SLB",
  "Phillips 66": "PSX", "Marathon Petroleum": "MPC", "Kinder Morgan": "KMI",
  "Valero Energy": "VLO", "Halliburton": "HAL", "Boeing": "BA", "Caterpillar": "CAT",
  "Deere": "DE", "General Electric": "GE", "Honeywell": "HON", "RTX Corporation": "RTX",
  "Lockheed Martin": "LMT", "UPS": "UPS", "FedEx": "FDX", "Union Pacific": "UNP",
  "CSX": "CSX", "Norfolk Southern": "NSC", "Verizon": "VZ", "AT&T": "T",
  "T-Mobile": "TMUS", "Walt Disney": "DIS", "Comcast": "CMCSA", "Netflix": "NFLX",
  "Warner Bros Discovery": "WBD", "Visa": "V", "Mastercard": "MA", "PayPal": "PYPL",
  "Block": "SQ", "Fidelity National Information Services": "FIS", "Fiserv": "FI",
  "Global Payments": "GPN",
};

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Simple in-memory cache to avoid rate limits
const newsCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// GET /api/news/company?company=Apple&from=2026-02-24&to=2026-03-24
router.get("/company", async (req, res) => {
  try {
    const { company, from, to } = req.query;

    if (!company || !from || !to) {
      return res.status(400).json({ error: "Missing required params: company, from, to" });
    }

    const symbol = COMPANY_SYMBOLS[company] || company;

    console.log(`Fetching Finnhub news for ${company} (${symbol}) from ${from} to ${to}`);

    // Check Date limits (1 year max for free tier)
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Quick validation
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    if (toDate < fromDate) {
      return res.status(400).json({ error: "'to' date cannot be before 'from' date" });
    }

    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      return res.status(400).json({ error: "Date range cannot exceed 1 year" });
    }

    const cacheKey = `${symbol}_${from}_${to}`;
    if (newsCache.has(cacheKey)) {
      const cached = newsCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Serving Finnhub news for ${symbol} from memory cache (${cached.data.count} articles)`);
        return res.json(cached.data);
      } else {
        newsCache.delete(cacheKey); // Expired
      }
    }

    const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (response.status === 401) {
      return res.status(401).json({ error: "Invalid Finnhub API Key" });
    }
    if (response.status === 429) {
      return res.status(429).json({ error: "Finnhub rate limit hit" });
    }

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: "Unexpected response format from Finnhub", details: data });
    }

    const resultPayload = { company, symbol, count: data.length, articles: data };
    newsCache.set(cacheKey, { timestamp: Date.now(), data: resultPayload });

    // Limit to 50 articles in the response to prevent huge payloads, but realistically
    // they can just paginate or whatever. We'll return all, frontend can slice.
    res.json(resultPayload);

  } catch (err) {
    console.error("Finnhub news error:", err);
    res.status(500).json({ error: "Failed to fetch company news" });
  }
});

module.exports = router;
