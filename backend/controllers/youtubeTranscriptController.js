const { connect, getDb } = require("../services/mongoClient");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { saveTranscript } = require("../services/transcriptService");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.processVideo = async (req, res) => {
  try {
    const { youtubeUrl, company } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({ error: "YouTube link required" });
    }

    if (!company) {
      return res.status(400).json({ error: "Company name required" });
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const basePath = path.join(__dirname, videoId);
    const audioPath = `${basePath}.mp3`;

    let transcriptText = null;

    console.log("Step 1: Downloading subtitles (json3)...");

    const subtitlesExist = await downloadSubtitles(youtubeUrl, basePath);

    if (subtitlesExist) {
      const files = fs.readdirSync(__dirname);

      const subtitleFile = files.find(file =>
        file.startsWith(videoId) && file.endsWith(".json3")
      );

      if (subtitleFile) {
        console.log("Subtitle file detected:", subtitleFile);

        transcriptText = parseJSON3(path.join(__dirname, subtitleFile));
        transcriptText = cleanTranscript(transcriptText);
      }
    }

    if (!transcriptText) {
      console.log("No subtitles found. Using Whisper...");

      await downloadAudio(youtubeUrl, audioPath);
      transcriptText = await transcribeWithOpenAI(audioPath);

      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }

    if (!transcriptText) {
      return res.status(500).json({ error: "Transcript generation failed" });
    }

    await connect();
    await saveTranscript(videoId, transcriptText, company,youtubeUrl);

    console.log("Transcript saved. Cleaning up files...");
    cleanupFiles(videoId);

    return res.status(200).json({
      message: "Success",
      videoId,
      company
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Processing failed" });
  }
};

/* ---------------- HELPERS ---------------- */

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:.*v=|.*\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function downloadSubtitles(url, outputBase) {
  return new Promise((resolve) => {

    const yt = spawn("yt-dlp", [
      "--write-auto-subs",
      "--skip-download",
      "--sub-lang", "en.*",
      "--sub-format", "json3",
      "-o", outputBase,
      url
    ]);

    yt.on("close", (code) => {
      resolve(code === 0);
    });
  });
}

function downloadAudio(url, outputPath) {
  return new Promise((resolve, reject) => {
    const yt = spawn("yt-dlp", [
      "-x",
      "--audio-format", "mp3",
      "-o", outputPath,
      url
    ]);

    yt.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error("Audio download failed"));
    });
  });
}

async function transcribeWithOpenAI(audioPath) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: "whisper-1",
  });

  return transcription.text;
}

/* ---------- JSON3 PARSER ---------- */

function parseJSON3(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  let text = "";

  if (!data.events) return "";

  data.events.forEach(event => {
    if (event.segs) {
      event.segs.forEach(seg => {
        if (seg.utf8) {
          text += seg.utf8;
        }
      });
      text += " ";
    }
  });

  return text;
}

/* ---------- CLEANING ---------- */
function cleanTranscript(text) {
  return text
    .replace(/Kind:.*?Language:.*?\s/gi, "")
    .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/&nbsp;|&amp;/g, " ")
    .replace(/\b(\w+)( \1\b)+/gi, "$1")
    .replace(/(.{20,}?)\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------- CLEANUP ---------- */

function cleanupFiles(videoId) {
  const directory = __dirname;

  const files = fs.readdirSync(directory);

  files.forEach(file => {
    if (file.startsWith(videoId)) {
      try {
        fs.unlinkSync(path.join(directory, file));
      } catch {}
    }
  });
}