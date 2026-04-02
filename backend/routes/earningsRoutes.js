const express = require("express");
const router = express.Router();

// Company name to Alpha Vantage ticker symbol mapping
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
  "Block": "XYZ", "Fidelity National Information Services": "FIS", "Fiserv": "FI",
  "Global Payments": "GPN",
};

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;

// GET /api/earnings/transcript?company=IBM&year=2024&quarter=Q1
router.get("/earnings/transcript", async (req, res) => {
  try {
    const { company, year, quarter } = req.query;

    if (!company || !year || !quarter) {
      return res.status(400).json({ error: "Missing required params: company, year, quarter" });
    }

    const symbol = COMPANY_SYMBOLS[company] || company; // fallback to raw value if not in map
    const quarterParam = `${year}${quarter}`; // e.g. "2024Q1"

    console.log(`Fetching earnings transcript for ${company} (${symbol}) - ${quarterParam}`);

    const url = `https://www.alphavantage.co/query?function=EARNINGS_CALL_TRANSCRIPT&symbol=${symbol}&quarter=${quarterParam}&apikey=${ALPHA_VANTAGE_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.Information) {
      return res.status(429).json({ error: "API rate limit reached. Please try again later.", details: data.Information });
    }

    if (!data.transcript || data.transcript.length === 0) {
      return res.status(404).json({ error: `No transcript found for ${company} (${symbol}) ${quarterParam}` });
    }

    // Return structured response
    res.json({
      symbol: data.symbol,
      company,
      quarter: data.quarter,
      totalSpeakers: new Set(data.transcript.map(t => t.speaker)).size,
      totalSegments: data.transcript.length,
      averageSentiment: (
        data.transcript.reduce((sum, t) => sum + parseFloat(t.sentiment || 0), 0) / data.transcript.length
      ).toFixed(2),
      transcript: data.transcript,
    });

  } catch (err) {
    console.error("Earnings transcript error:", err);
    res.status(500).json({ error: "Failed to fetch earnings transcript" });
  }
});

// GET /api/earnings/search - fetch latest transcripts for multiple companies
router.get("/earnings/search", async (req, res) => {
  try {
    const { year, quarter } = req.query;

    if (!year || !quarter) {
      return res.status(400).json({ error: "Missing required params: year, quarter" });
    }

    // Fetch for a curated set of popular companies to show in the table
    const popularCompanies = ["Apple", "Microsoft", "Alphabet", "Amazon", "Meta Platforms", "Nvidia", "Tesla", "IBM", "JPMorgan Chase", "Goldman Sachs"];
    const quarterParam = `${year}${quarter}`;

    console.log(`Searching earnings calls for ${quarterParam}...`);

    const results = [];

    // Fetch in parallel but with a small batch to avoid rate limits
    for (const company of popularCompanies) {
      const symbol = COMPANY_SYMBOLS[company];
      if (!symbol) continue;

      try {
        const url = `https://www.alphavantage.co/query?function=EARNINGS_CALL_TRANSCRIPT&symbol=${symbol}&quarter=${quarterParam}&apikey=${ALPHA_VANTAGE_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.transcript && data.transcript.length > 0) {
          const avgSentiment = (
            data.transcript.reduce((sum, t) => sum + parseFloat(t.sentiment || 0), 0) / data.transcript.length
          ).toFixed(2);

          results.push({
            company,
            symbol,
            quarter: data.quarter,
            totalSegments: data.transcript.length,
            totalSpeakers: new Set(data.transcript.map(t => t.speaker)).size,
            averageSentiment: avgSentiment,
            status: "available",
          });
        }

        // Alpha Vantage free tier: 5 calls/min. Small delay between calls
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (innerErr) {
        console.error(`Failed to fetch for ${company}:`, innerErr.message);
      }
    }

    res.json({ quarter: quarterParam, results });

  } catch (err) {
    console.error("Earnings search error:", err);
    res.status(500).json({ error: "Failed to search earnings calls" });
  }
});

module.exports = router;
