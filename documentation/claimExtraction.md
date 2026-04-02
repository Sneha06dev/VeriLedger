# Claim Extraction Module

This module processes raw transcript text and extracts structured claims such as:
- company name
- metric (revenue, profit, etc.)
- value and unit
- direction (increase/decrease)
- timestamp (if present)

It supports:
1. Rule-based extraction (fast, local)
2. AI-based extraction using Gemini API (more accurate)

## Functions

### preprocessTranscript(transcript)
Cleans the input transcript before processing.

- Removes filler words such as "uh", "um", "like", etc.
- Normalizes whitespace

Returns: cleaned transcript string

---

### extractStructuredClaims(transcript)
Main rule-based extraction function.

- Splits transcript into sentences
- Filters out very short sentences
- Uses helper functions to extract:
  - company
  - metric
  - value
  - unit
  - direction
  - timestamp
- Builds a structured claim object for each sentence

Returns: array of claim objects

---

### generateGeminiPrompt(transcript)
Generates a prompt string to send to the Gemini API.

- Defines the expected JSON structure
- Embeds the transcript into the prompt

Returns: formatted prompt string

---

### extractClaimsWithGemini(transcript)
Uses Gemini API to extract claims.

**Flow:**
1. Cleans the transcript using `preprocessTranscript`
2. Generates a prompt (including the cleaned transcript) using `generateGeminiPrompt`
3. Sends a POST request to the Gemini API
4. Extracts response text from the API response
5. Parses the text into JSON and returns it

**Requirements:**
- `axios` must be available
- `GEMINI_API_KEY` must be set in environment variables

**Returns:**
- Object containing extracted claims

**Fallback:**
- Returns `{ claims: [] }` if an error occurs

---

### detectDirection(text)
Determines whether the sentence indicates an increase or decrease.

- Returns: `"increase"`, `"decrease"`, or `null`
- Based on keyword matching (e.g., "grew", "declined")

---

### detectMetric(text)
Identifies the metric mentioned in the text.

- Supported metrics:
  - revenue, profit, margin, cost, growth, users
- Returns: metric name or `"other"` if no match is found

---

### extractValue(text)
Extracts the first numeric value from the text.

- Supports integers and decimals (e.g., 10, 10.5)
- Returns: number or `null`

---

### extractUnit(text)
Identifies the unit associated with the value.

- Supported units:
  - `%`, USD, INR, million, billion
- Returns: unit as string or `null`

---

### detectCompany(text)
Attempts to extract a company name based on capitalization patterns.

- Example: "Apple", "Microsoft Corp"
- Returns: detected name or `null`
- Note: May produce false positives

---

### detectTimestamp(text)
Extracts timestamp from text if present.

- Expected format: `HH:MM:SSS`
- Returns: timestamp string or `null`


## Output Format

Each claim has the following structure:

{
  "company": "string | null",
  "speaker": "string | null",
  "claimType": "strategic",
  "metric": "revenue | profit | ...",
  "value": number | null,
  "unit": "% | USD | INR | ...",
  "direction": "increase | decrease | null",
  "timestamp": "string | null", 
  "confidence": number,
  "originalText": "string"
}
## Example

Input example:
"Apple revenue increased by 10% this quarter."

Output example:
{
  "claims": [
    {
      "company": "Apple",
      "metric": "revenue",
      "value": 10,
      "unit": "%",
      "direction": "increase",
      "confidence": 0.85
    }
  ]
}

