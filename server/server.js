const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit
});

// Middleware
app.use(cors());
app.use(express.json());

// Validate API keys are present
const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!ASSEMBLY_API_KEY || !DEEPSEEK_API_KEY) {
  console.error("Missing required API keys in environment variables");
  process.exit(1);
}

// File upload endpoint
app.post("/api/upload", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({
    filename: req.file.filename,
    url: fileUrl,
  });
});

// AssemblyAI endpoints
app.post("/api/transcription", async (req, res) => {
  try {
    const { audioUrl } = req.body;

    const response = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: audioUrl },
      { headers: { Authorization: ASSEMBLY_API_KEY } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Transcription request error:", error.message);
    res.status(500).json({ error: "Failed to request transcription" });
  }
});

app.get("/api/transcription/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${id}`,
      { headers: { Authorization: ASSEMBLY_API_KEY } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Transcription status error:", error.message);
    res.status(500).json({ error: "Failed to check transcription status" });
  }
});

app.get("/api/test-assembly-key", async (req, res) => {
  try {
    const response = await axios.get("https://api.assemblyai.com/v2/account", {
      headers: { Authorization: ASSEMBLY_API_KEY },
    });

    res.json({ valid: true, data: response.data });
  } catch (error) {
    res.status(400).json({ valid: false, error: error.message });
  }
});

// DeepSeek endpoints
app.post("/api/generate", async (req, res) => {
  try {
    const { transcription, prompt } = req.body;

    const response = await axios.post(
      "https://api.deepseek.ai/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes transcriptions.",
          },
          {
            role: "user",
            content: `${
              prompt || "Please summarize this transcription:"
            }\n\n${transcription}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Note generation error:", error.message);
    res.status(500).json({ error: "Failed to generate notes" });
  }
});

// Serve uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
