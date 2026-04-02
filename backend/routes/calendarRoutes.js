const express = require("express");
const { getUpcomingCalendarEvents } = require("../services/calendarService.js");

const router = express.Router();

router.get("/upcoming", async (req, res) => {
  try {
    const data = await getUpcomingCalendarEvents();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

module.exports = router;