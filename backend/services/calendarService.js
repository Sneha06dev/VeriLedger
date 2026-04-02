const axios = require("axios");

const getUpcomingCalendarEvents = async () => {
  try {
    console.log("🌐 Calling RapidAPI earnings calendar endpoint...");
    
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

    console.log("✅ API Response received successfully!");
    console.log("📊 Number of earnings events:", response.data.length || response.data?.data?.length);
    console.log("🔍 Full response:", JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error("❌ API Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

module.exports = { getUpcomingCalendarEvents };