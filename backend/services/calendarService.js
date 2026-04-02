const axios = require("axios");

const getUpcomingCalendarEvents = async () => {
  try {
    const response = await axios.get(
      "https://earnings-calendar.p.rapidapi.com/upcoming",
      {
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY,
          "x-rapidapi-host": "earnings-calendar.p.rapidapi.com"
        },
        params: {
          limit: 50
        }
      }
    );

    const rawData = response.data;
    const grouped = {};

    rawData.forEach(event => {
      const date = event.date;

      if (!grouped[date]) grouped[date] = [];

      grouped[date].push({
        name: event.company || event.symbol,
        ticker: event.symbol,
        time: event.time || "AMC",
        eps: event.eps || "-",
        revenue: event.revenue || "-",
        call: "#" // we will replace this later
      });
    });

    return grouped;

  } catch (error) {
    console.error("API Error:", error.message);
    throw error;
  }
};

module.exports = { getUpcomingCalendarEvents };