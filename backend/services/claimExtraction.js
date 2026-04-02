// claimExtraction.js

let axios;
try { axios = require("axios"); } catch (e) { axios = null; }

/* -----------------------------
DIRECTION DETECTION
--------------------------------*/
function detectDirection(text) {

  const inc = /(increase|increased|grew|growth|rose|up|expanded|improved)/i;
  const dec = /(decrease|declined|fell|drop|down|reduced|contracted)/i;

  if (inc.test(text)) return "increase";
  if (dec.test(text)) return "decrease";

  return null;
}

/* -----------------------------
METRIC DETECTION
--------------------------------*/
function detectMetric(text) {

  const metrics = {
    revenue: /(revenue|sales|turnover)/i,
    profit: /(profit|net income|earnings)/i,
    margin: /(margin|operating margin|ebitda margin)/i,
    cost: /(cost|expense|spending)/i,
    growth: /(growth)/i,
    users: /(users|customers|subscribers)/i
  };

  for (const key in metrics) {
    if (metrics[key].test(text)) return key;
  }

  return "other";
}

/* -----------------------------
VALUE EXTRACTION
--------------------------------*/
function extractValue(text) {

  const numberMatch = text.match(/\d+(\.\d+)?/);

  if (!numberMatch) return null;

  return Number(numberMatch[0]);
}

/* -----------------------------
UNIT EXTRACTION
--------------------------------*/
function extractUnit(text) {

  if (/%/.test(text)) return "%";
  if (/\$|usd/i.test(text)) return "USD";
  if (/₹|inr/i.test(text)) return "INR";
  if (/million/i.test(text)) return "million";
  if (/billion/i.test(text)) return "billion";

  return null;
}

/* -----------------------------
COMPANY DETECTION
--------------------------------*/
function detectCompany(text) {

  const match = text.match(
    /\b([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*)\b/
  );

  if (!match) return null;

  return match[1];
}

/* -----------------------------
TIMESTAMP DETECTION
--------------------------------*/
function detectTimestamp(text) {

  const match = text.match(/\d{2}:\d{2}:\d{3}/);

  if (!match) return null;

  return match[0];
}

/* -----------------------------
TRANSCRIPT PREPROCESS
--------------------------------*/
function preprocessTranscript(transcript) {

  let cleaned = transcript;

  const filler = [
    "uh", "um", "you know", "like",
    "actually", "okay"
  ];

  filler.forEach(w => {
    const r = new RegExp(`\\b${w}\\b`, "gi");
    cleaned = cleaned.replace(r, "");
  });

  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/* -----------------------------
CLAIM EXTRACTION LOGIC
--------------------------------*/
function extractStructuredClaims(transcript) {

  const sentences = transcript.split(/[.!?]/);

  const claims = [];

  sentences.forEach((s, idx) => {

    const text = s.trim();

    if (text.length < 20) return;

    const direction = detectDirection(text);
    const metric = detectMetric(text);
    const value = extractValue(text);
    const unit = extractUnit(text);
    const company = detectCompany(text);
    const timestamp = detectTimestamp(text);

    claims.push({
      company,
      speaker: null,
      claimType: "strategic",
      metric,
      value,
      unit,
      direction,
      timestamp,
      confidence: 0.85,
      originalText: text
    });

  });

  return claims;
}

/* -----------------------------
GEMINI PROMPT
--------------------------------*/
function generateGeminiPrompt(transcript) {

  return `
Extract claims from this transcript.

Return JSON format:

{
 "claims":[
  {
   "company":"",
   "speaker":"",
   "claimType":"",
   "metric":"",
   "value":null,
   "unit":"",
   "direction":"",
   "timestamp":"",
   "confidence":0.0,
   "originalText":""
  }
 ]
}

Transcript:
${transcript}
`;
}

/* -----------------------------
CALL GEMINI
--------------------------------*/
async function extractClaimsWithGemini(transcript) {

  if (!axios) throw new Error("Axios required");

  const cleaned = preprocessTranscript(transcript);

  const prompt = generateGeminiPrompt(cleaned);

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  try {

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          response_mime_type: "application/json"
        }
      },
      {
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.candidates[0].content.parts[0].text;

    return JSON.parse(raw);

  } catch (e) {

    console.error("Gemini API Error:",
      e.response ? e.response.data : e.message
    );

    return { claims: [] };
  }
}

module.exports = {
  preprocessTranscript,
  extractStructuredClaims,
  extractClaimsWithGemini
};