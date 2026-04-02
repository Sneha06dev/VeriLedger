import 'dotenv/config';
import OpenAI from "openai";

console.log("API key loaded:", process.env.OPENAI_API_KEY?.slice(0, 5) + "...");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function test() {
  try {
    const models = await client.models.list();
    console.log("Models accessible:", models.data.map(m => m.id));
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();