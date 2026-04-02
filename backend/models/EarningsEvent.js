const mongoose = require("mongoose");

const earningsEventSchema = new mongoose.Schema({
  company: String,
  ticker: String,
  date: String,
  videoId: String,
  source: String,
  notifiedUsers: [String]
}, { timestamps: true });

//  Prevent duplicates
earningsEventSchema.index({ videoId: 1 }, { unique: true });

//  THIS LINE IS VERY IMPORTANT
module.exports = mongoose.model("EarningsEvent", earningsEventSchema);