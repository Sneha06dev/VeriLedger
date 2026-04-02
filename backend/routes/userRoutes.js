const express = require("express");
const router = express.Router();
const User = require("../models/User");

//  ADD TO WATCHLIST
router.post("/watchlist/add", async (req, res) => {
  try {
    const { userId, ticker, company } = req.body;

    const value = ticker; // or company if you prefer

    await User.findByIdAndUpdate(userId, {
      $addToSet: { watchlist: value }
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
});

// REMOVE FROM WATCHLIST
router.post("/watchlist/remove", async (req, res) => {
  try {
    const { userId, ticker } = req.body;

    await User.findByIdAndUpdate(userId, {
      $pull: { watchlist: ticker }
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
});

module.exports = router;