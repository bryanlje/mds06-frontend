// index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import { Storage } from "@google-cloud/storage";
import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { google } from "googleapis";
import FormData from "form-data";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "..", "dist");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://my-web-app-19134553205.asia-southeast1.run.app",
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Serve frontend build
app.use(express.static(DIST_DIR));

// Google Cloud Storage client
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const bucket = storage.bucket(process.env.BUCKET_NAME);

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// --------------------------------------------------------
// FUNCTION: Generate a signed URL for uploading to GCS
// Requirement: The system must allow users to upload files
// --------------------------------------------------------
app.get("/api/upload-url", async (req, res) => {
  try {
    const { filename, filetype } = req.query;
    if (!filename || !filetype)
      return res.status(400).json({ error: "Missing filename or filetype" });

    const uniqueName = `${Date.now()}_${filename}`;
    const file = bucket.file(uniqueName);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 3600 * 1000,
      contentType: filetype,
    });

    res.json({ uploadUrl: url, key: uniqueName });
  } catch (err) {
    console.error("❌ Upload URL Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------
// FUNCTION: Run ML Pipeline
// Requirement: The system must send uploaded video to the
// deep learning pipeline and return analysis output.
// --------------------------------------------------------
app.post("/api/run-model", async (req, res) => {
  try {
    const { filename, user_id = "anonymous" } = req.body;
    if (!filename) return res.status(400).json({ error: "Missing filename" });

    const gcsUri = `gs://${process.env.BUCKET_NAME}/${filename}`;
    console.log("🚀 Sending to ML pipeline:", gcsUri);

    const form = new FormData();
    form.append("gcs_uri", gcsUri);
    form.append("output_bucket", process.env.BUCKET_NAME);
    form.append("output_prefix", "output");
    form.append("overlay", "true");
    form.append("return_debug", "false");
    form.append("user_id", user_id);
    form.append("job_id", `job_from_gcs_001`);

    const response = await fetch(`${process.env.PIPELINE_URL}/process`, {
      method: "POST",
      headers: form.getHeaders(),
      body: form,
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("ML pipeline returned error:", text);
      return res.status(response.status).json({
        error: `Pipeline error (${response.status})`,
        raw: text,
      });
    }

    res.json(JSON.parse(text));
  } catch (err) {
    console.error("❌ Error running model:", err);
    res.status(500).json({ error: err.message });
  }
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post("/api/analyze-table", async (req, res) => {
  try {
    const { summaryTable } = req.body;

    if (!summaryTable) {
      return res.status(400).json({ error: "Missing summaryTable data" });
    }

    const analysisPrompt = `
Match Shot Summary:
${JSON.stringify(summaryTable, null, 2)}

You are a world-class badminton analyst and commentator. Your task is to provide a detailed, professional analysis of two badminton players based on a statistical summary of their shot selection during a match.

Your analysis must be insightful, articulate, and written in a professional tone suitable for a sports broadcast or a post-match report. Go beyond simply restating the numbers; interpret them to tell a story about each player's strategy, strengths, and tactical approach.

Analysis Guidelines:

Player 1 Analysis:
- Based on the shot distribution, characterize Player 1's playing style (e.g., aggressive baseline attacker, strategic net player, defensive retriever, all-court player).
- Use specific shot counts as evidence. For instance, a high number of "Smashes" and "Drives" indicates an offensive, aggressive style, whereas a high number of "Drops," "Lifts," and "Clears" points towards a more controlled, defensive, or strategic game.
- Infer their likely on-court strategy and what they were trying to achieve.

Player 2 Analysis:
- Provide the same in-depth analysis for Player 2, identifying their playing style and tactical preferences based on their shot data.

Head-to-Head Comparison:
- Directly compare and contrast the two players' styles.
- Describe the tactical dynamic of the match (aggression vs defense, net vs backcourt control, etc.)
- Conclude with a summary of how their approaches interacted on the court.

Note: do not use any bold, italic, or underline formatting in the main text. Write in plain paragraphs as if it appears under the “INSIGHTS” section of a match analysis software. Your response must contain exactly three sections: Player 1 Analysis, Player 2 Analysis, and Overall Analysis — and nothing else.
`;

    const analysisResult = await model.generateContent(analysisPrompt);
    const aiAnalysis = analysisResult.response.text();

    const prompt2 = `
Here is an AI-generated analysis of two badminton players' playstyles:

${aiAnalysis}

Going through these players' analysis i want to find professional matches with player that shows similar playstyle for improvement and comparison, return me only in the output with the player name and the youtube link for their matches

For each player, return this format:

Player 1 (style summary)
[Player Name] - [YouTube Link]

Player 2 (style summary)
[Player Name] - [YouTube Link]

Rules:
- The style summary must be short (2-7 words only).
- No markdown, no bullet points, no extra explanations.
    `;
    const refResult = await model.generateContent(prompt2);
    const aiRaw = await refResult.response.text();

    const lines = aiRaw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);

    const players = [];
    let current = null;
    for (const line of lines) {
      if (line.startsWith("Player 1") || line.startsWith("Player 2")) {
        const match = line.match(/Player (\d) \(([^)]+)\)/);
        if (match) current = { number: `Player ${match[1]}`, style: match[2] };
      } else if (line.includes("-") && current) {
        const [name, url] = line.split("-").map((x) => x.trim());
        current.name = name;
        current.link = url.startsWith("http") ? url : null;
        players.push(current);
        current = null;
      }
    }
    const aiVerified = [];
    for (const p of players) {
      const link = await getYouTubeMatchLink(p.name);
      aiVerified.push({
        player: p.number,
        style: p.style,
        name: p.name,
        link: link || "No video found",
      });
    }

    res.json({
      aiSummary: aiAnalysis,
      aiVerified: aiVerified
        .map((p) => `${p.player} (${p.style})\n${p.name} - ${p.link}`)
        .join("\n\n"),
    });
  } catch (err) {
    console.error("🔥 Gemini error:", err);
  }
});

async function getYouTubeMatchLink(playerName) {
  try {
    const res = await youtube.search.list({
      part: "snippet",
      q: `${playerName} badminton match highlights`,
      maxResults: 1,
      type: "video",
    });
    const video = res.data.items?.[0];
    if (!video) return null;
    return `https://www.youtube.com/watch?v=${video.id.videoId}`;
  } catch (err) {
    console.error(`YouTube search error for ${playerName}:`, err.message);
    return null;
  }
}

// -----------------------------
// Fallback: serve frontend
// -----------------------------
app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.includes(".")) return next();
  res.sendFile(path.join(DIST_DIR, "index.html"), (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Something went wrong");
    }
  });
});

// -----------------------------
// Start server
// -----------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
