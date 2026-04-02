const cron = require("node-cron");
const { searchEarningsVideos } = require("../services/youtubeService");
const EarningsEvent = require("../models/EarningsEvent");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");
const { COMPANY_SYMBOLS } = require("../utils/companySymbols");

// Track last run (24h for testing)
let lastRunTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();

// Extract company
function extractCompany(title) {
  const cleanTitle = title.toLowerCase();

  for (const [company, ticker] of Object.entries(COMPANY_SYMBOLS)) {
    const companyLower = company.toLowerCase();
    const tickerLower = ticker.toLowerCase();

    if (cleanTitle.includes(companyLower)) return company;

    const tickerRegex = new RegExp(`\\b${tickerLower}\\b`, "i");
    if (tickerRegex.test(cleanTitle)) return company;
  }

  return null;
}

// MAIN FUNCTION
async function runWatcher() {
  console.log("🔥 Running earnings watcher...");

  try {
    const now = new Date().toISOString();

    const videos = await searchEarningsVideos(lastRunTime);
    console.log("📺 New videos found:", videos.length);

    lastRunTime = now;

    for (const video of videos) {
      const title = video.title.toLowerCase();

      if (!title.includes("earnings")) continue;

      const company = extractCompany(video.title);
      if (!company) continue;

      const ticker = COMPANY_SYMBOLS[company];
      if (!ticker) continue;

      const date = new Date(video.publishedAt)
        .toISOString()
        .split("T")[0];

      let event = await EarningsEvent.findOne({
        videoId: video.videoId
      });

      if (!event) {
        console.log(`🆕 New earnings detected: ${company}`);

        event = await EarningsEvent.create({
          company,
          ticker,
          date,
          videoId: video.videoId,
          source: "youtube",
          notifiedUsers: []
        });
      }

      // ✅ MATCH USERS (company + ticker safe)
      const users = await User.find({
        watchlist: { $in: [company, ticker] }
      });

      console.log(`👥 Matched users for ${company}:`, users.map(u => u.email));

      // ✅ SEND EMAIL HERE
      for (const user of users) {
        if (!event.notifiedUsers.includes(user._id.toString())) {
          console.log(`📧 Sending email to ${user.email}`);

          await sendEmail(
            user.email,
            `📊 ${company} (${ticker}) Earnings Call Available`,
            `${company} earnings call available`,

            `
            <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
              
              <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                
                <div style="background:#0f172a;color:white;padding:20px;text-align:center;">
                  <h2 style="margin:0;">VeriLedger Earnings Alert</h2>
                </div>

                <div style="padding:24px;">
                  
                  <p style="font-size:16px;">
                    Hi <strong>${user.fullName || "Investor"}</strong>,
                  </p>

                  <p style="font-size:16px;">
                    <strong>${company} (${ticker})</strong> has released its latest earnings call.
                  </p>

                  <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:20px 0;">
                    <p style="margin:0;">
                       <strong>Date:</strong> ${date}
                    </p>
                  </div>

                  <div style="text-align:center;margin:30px 0;">
                    <a href="https://youtube.com/watch?v=${video.videoId}"
                       style="background:#2563eb;color:white;padding:14px 22px;text-decoration:none;border-radius:8px;font-weight:bold;">
                       ▶ Watch Earnings Call
                    </a>
                  </div>

                  <p style="font-size:14px;color:#64748b;">
                    You’re receiving this because <strong>${company}</strong> is in your watchlist.
                  </p>

                </div>

                <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#94a3b8;">
                  <p style="margin:0;">Stay ahead of the market </p>
                  <p style="margin:4px 0;">— VeriLedger </p>
                </div>

              </div>
            </div>
            `
          );

          event.notifiedUsers.push(user._id.toString());
        }
      }

      await event.save();
    }

  } catch (err) {
    console.error("❌ CRON ERROR:", err.message);
  }
}

console.log("📡 earningsWatcher loaded");

(async () => {
  console.log("🚀 Initial watcher run...");
  await runWatcher();
})();

cron.schedule("*/10 * * * *", () => {
  console.log("⏰ Cron triggered");
  runWatcher();
});