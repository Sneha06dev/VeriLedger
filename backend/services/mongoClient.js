// mongoClient.js
const path = require("path");
const dns = require("dns");

require("dotenv").config({ path: path.resolve(__dirname, "../..", ".env") });

dns.setServers(["1.1.1.1", "8.8.8.8"]);
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI not defined in .env");

const client = new MongoClient(uri);
let db;

async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    db = client.db(process.env.MONGO_DB || "transcripts");
    return db;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    throw err;
  }
}

function getDb() {
  if (!db) throw new Error("MongoDB not connected. Call connect() first.");
  return db;
}

module.exports = { connect, getDb };