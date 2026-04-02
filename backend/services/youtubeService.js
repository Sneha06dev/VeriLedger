const { google } = require("googleapis");

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY
});

async function searchEarningsVideos(publishedAfter) {
  const res = await youtube.search.list({
    part: "snippet",
    q: "earnings call",
    maxResults: 25,
    order: "date",
    type: "video",
    publishedAfter //  NEW
  });

  return res.data.items.map(item => ({
    title: item.snippet.title,
    videoId: item.id.videoId,
    publishedAt: item.snippet.publishedAt
  }));
}

module.exports = { searchEarningsVideos };