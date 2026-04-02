const express = require("express");
const EarningsEvent = require("../models/EarningsEvent");

const router = express.Router();

router.get("/upcoming", async (req, res) => {
  try {
    const events = await EarningsEvent.find().sort({ date: 1 });

    const grouped = {};

    events.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = [];

      grouped[e.date].push({
        name: e.company,
        ticker: e.ticker,
        time: "AMC",
        eps: "-",
        revenue: "-",
        call: `https://youtube.com/watch?v=${e.videoId}` //  FIXED
      });
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

module.exports = router;