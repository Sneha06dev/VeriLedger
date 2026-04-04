// claimExtraction.js
// Use optional dependencies if available; provide offline fallback when not.
let axios;
try { axios = require('axios'); } catch (e) { axios = null; }
let stopwords = [];
try { stopwords = require('stopwords').english; } catch (e) { stopwords = []; }

/**
 * Step 1: Preprocess transcript
 * - Remove greetings, filler words, noise
 * - Optional: lowercasing, punctuation cleanup
 */
function preprocessTranscript(transcript) {
  let cleaned = transcript;

  // Remove greetings / polite openings
  const greetingPatterns = [
    /good morning/i,
    /good afternoon/i,
    /hello/i,
    /thank you/i,
    /operator/i,
    /you may now disconnect/i
  ];
  greetingPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // 2 Remove filler words / common verbal pauses
  const fillerWords = [
    "uh", "um", "like", "you know", "so", "actually", "right", "let me see", "okay"
  ];
  fillerWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    cleaned = cleaned.replace(regex, '');
  });

  // 3 Remove audio timestamps like [00:01:23] but keep calendar dates
  cleaned = cleaned.replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, '');

  // 4Remove inaudible / noise markers
  cleaned = cleaned.replace(/\(inaudible\)|\(laughter\)|\(\w+\)/gi, '');

  //  Normalize numbers (remove commas in large numbers if needed for parsing)
  // This keeps numeric values intact
  cleaned = cleaned.replace(/(\d),(\d)/g, '$1$2');

  //  Normalize whitespace & line breaks
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  //Ensure sentences are separated properly (optional, helps Gemini)
  cleaned = cleaned.replace(/([a-z])\s*([A-Z])/g, '$1. $2');

  return cleaned;
}

/**
 * Step 2: Generate prompt for Gemini
 */
function generateGeminiPrompt(transcript) {
  return `
You are an AI that extracts actionable claims from corporate transcripts. 

Instructions:
1. Read the transcript carefully.
2. Identify key statements that are claims, financial updates, strategic plans, acquisitions, or milestones.
3. Output JSON with an array called "claims".
4. Each claim should have these fields:
   - "claimText": the exact sentence or idea from the transcript
   - "claimType": one of ["financial", "strategic", "operational", "acquisition", "milestone","guidance","risk"]
   -"claimNature": one of ["historical","current","forward_looking","trend"]
   - "speaker": who said it (if available)
   -  "numericalData": [
    {
      "metric": "string", 
      "value": "number",
      "unit": "string", 
      "direction": "increase | decrease | neutral",
      "period": "string"
    }
  ],
   
   
Output only JSON. Do not add any extra text.

Transcript:
"${transcript}"
`;
}

/**
 * Step 3: Call Gemini API for claim extraction
 * Replace GEMINI_API_KEY and GEMINI_ENDPOINT with actual credentials
 */
// async function extractClaimsWithGemini(transcript) {
//   const cleanedTranscript = preprocessTranscript(transcript);
//   const prompt = generateGeminiPrompt(cleanedTranscript);

//   // 1. Correct URL (using v1beta or v1)
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

//   try {
//     const response = await axios.post(url, {
//       // 2. Correct Payload Structure
//       contents: [{
//         parts: [{ text: prompt }]
//       }],
//       generationConfig: {
//         temperature: 0,
//         response_mime_type: "application/json" // 3. Forces JSON output
//       }
//     }, {
//       headers: { 'Content-Type': 'application/json' }
//     });

//     // 4. Correct Response Extraction
//     const rawText = response.data.candidates[0].content.parts[0].text;
    
//     return JSON.parse(rawText);
//   } catch (e) {
//     console.error("Gemini API Error:", e.response ? e.response.data : e.message);
//     return { claims: [] };
//   }
// }

// module.exports = { extractClaimsWithGemini, preprocessTranscript };
async function extractClaimsWithGemini(transcript) {
  if (!axios) throw new Error("Axios is required for Gemini API calls");

  // debug key presence
  console.log('extractClaimsWithGemini: GEMINI_API_KEY=', process.env.GEMINI_API_KEY ? '<present>' : '<missing>');

  const cleanedTranscript = preprocessTranscript(transcript);
  const prompt = generateGeminiPrompt(cleanedTranscript);

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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

    // Extract text from response
    const rawText = response.data.candidates[0].content.parts[0].text;

    // Return parsed JSON
    return JSON.parse(rawText);
  } catch (e) {
    console.error("Gemini API Error:", e.response ? e.response.data : e.message);
    return { claims: [] };
  }
}

module.exports = { extractClaimsWithGemini, preprocessTranscript };