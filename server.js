require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Check for required API keys after loading dotenv
if (!process.env.DEEPSEEK_API_KEY || !process.env.ASSEMBLY_API_KEY) {
  console.error("Error: Missing required API keys in .env file");
  process.exit(1);
}

const app = express();

// --- Configuration ---
const uploadDir = path.join(__dirname, "server", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
console.log(`[Server Setup] Upload directory configured at: ${uploadDir}`);

// Define allowed file types
const fileFilter = (req, file, cb) => {
  // Accept audio files only
  const allowedTypes = [
    "audio/wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/ogg",
    "audio/webm",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only audio files are allowed."), false);
  }
};

// Configure storage with randomized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate random filename to prevent path traversal attacks
    crypto.randomBytes(16, (err, raw) => {
      if (err) return cb(err);

      // Use original extension but randomize filename
      const fileExt = path.extname(file.originalname);
      const safeName = raw.toString("hex") + fileExt;
      cb(null, safeName);
    });
  },
});

// Set up multer with size limits and filters
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 50MB max file size
  },
});

// Error handling middleware for multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific error handling
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ error: "File size too large. Max 200MB allowed." });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    // Generic error handling
    return res.status(500).json({ error: err.message });
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// --- AssemblyAI Endpoints ---
const assembly = axios.create({
  baseURL: "https://api.assemblyai.com/v2",
  headers: {
    authorization: process.env.ASSEMBLY_API_KEY,
    "content-type": "application/json",
  },
});

// --- API Routes ---

// File upload endpoint - MODIFIED TO HANDLE MULTIPLE FIELD NAMES
app.post("/api/upload", (req, res, next) => {
  // Create multer instance dynamically for this request
  const uploadHandler = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 200 * 1024 * 1024, // 200MB max file size
    },
  }).any(); // Accept any field name

  // Process the upload with our configured multer instance
  uploadHandler(req, res, (err) => {
    if (err) {
      // Forward to error middleware
      return next(err);
    }

    // Check if any file was uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Use the first file found
    const uploadedFile = req.files[0];

    // Sanitize file path before returning to client
    const sanitizedPath = path.basename(uploadedFile.path);
    const uploadUrl = `/uploads/${sanitizedPath}`;

    // Log successful upload with field name for debugging
    console.log(
      `[Upload] File received with field name: ${uploadedFile.fieldname}`
    );

    res.json({
      success: true,
      filePath: uploadUrl,
      originalName: uploadedFile.originalname,
      url: uploadUrl, // Add this field to match what the client expects
    });
  });
});

// Transcription endpoint - Modified to handle both local and AssemblyAI URLs
app.post("/api/transcription", async (req, res) => {
  try {
    let { audioUrl } = req.body;

    // Log the received URL for debugging
    console.log("[Transcription Request] Received URL:", audioUrl);

    // Handle local URLs from our uploads folder
    if (audioUrl && audioUrl.startsWith("/uploads/")) {
      console.log(
        `[Transcription Request] Converting local URL to AssemblyAI URL: ${audioUrl}`
      );

      // Fix the path resolution to properly locate uploaded files
      const fileName = path.basename(audioUrl);
      const localFilePath = path.join(uploadDir, fileName);

      console.log(
        `[Transcription Request] Looking for file at: ${localFilePath}`
      );

      // Verify the file exists
      if (!fs.existsSync(localFilePath)) {
        console.error(
          `[Transcription Request] File not found: ${localFilePath}`
        );
        return res.status(404).json({ error: "File not found" });
      }

      // Create a read stream for the file
      const fileStream = fs.createReadStream(localFilePath);

      // Upload to AssemblyAI
      console.log(`[Transcription Request] Uploading local file to AssemblyAI`);
      const uploadResponse = await axios.post(
        "https://api.assemblyai.com/v2/upload",
        fileStream,
        {
          headers: {
            authorization: process.env.ASSEMBLY_API_KEY,
            "content-type": "application/octet-stream",
          },
        }
      );

      audioUrl = uploadResponse.data.upload_url;
      console.log(
        `[Transcription Request] Uploaded to AssemblyAI, received URL: ${audioUrl}`
      );
    }

    // Now validate the URL is an AssemblyAI URL
    if (!audioUrl || !audioUrl.startsWith("https://cdn.assemblyai.com/")) {
      console.error("[Transcription Request] Invalid URL format:", audioUrl);
      return res.status(400).json({
        error:
          "Invalid AssemblyAI URL format. URL must start with https://cdn.assemblyai.com/",
      });
    }

    // Create transcription request using the upload_url
    const response = await assembly.post("/transcript", {
      audio_url: audioUrl, // AssemblyAI's own URL
      language_detection: true,
      speech_model: "nano",
    });

    console.log(
      `[Transcription Request] Successfully created with ID: ${response.data.id}`
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "[Transcription Request] Error:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response?.status || 500).json({
      error:
        "Failed to request transcription: " +
        (error.message || "Unknown error"),
    });
  }
});

// Keep the rest of your endpoints, including the transcription status endpoint
app.get("/api/transcription/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Transcription Status] Checking status for ID: ${id}`);

    const response = await assembly.get(`/transcript/${id}`);

    res.json(response.data);
  } catch (error) {
    console.error(
      "[Transcription Status] Error:",
      error.response ? error.response.data : error.message
    );
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to check transcription status" });
  }
});

// --- Deepseek API Endpoint ---
app.post("/api/summarize", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res
      .status(400)
      .json({ error: "Text is required for summarization." });
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that generates high-quality, concise notes from lecture transcripts. Do not add any extra information unless explicitly instructed. Your output should be clear, accurate, and optimized for college students to understand and revise efficiently. If necessary and important, include exact quotes from the transcript for key concepts or definitions to preserve accuracy.NOTE: Don't use ``` unless it is a code block.",
          },
          {
            role: "user",
            content: `Please summarize the following text:\n\n${text}`,
          },
        ],
        stream: false, // Set to false if you don't need streaming
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, // Use the loaded key
        },
      }
    );
    // Extract the summary from the response structure
    const summary = response.data.choices[0]?.message?.content;
    if (summary) {
      res.json({ summary });
    } else {
      console.error("Deepseek API response format unexpected:", response.data);
      res
        .status(500)
        .json({ error: "Failed to extract summary from Deepseek response." });
    }
  } catch (error) {
    console.error(
      "Error calling Deepseek API:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ error: "Failed to summarize text using Deepseek API." });
  }
});

// --- NEW: DeepSeek Note Generation Endpoint ---
app.post("/api/generate-notes", async (req, res) => {
  const { transcription, customPrompt } = req.body;

  if (!transcription) {
    return res
      .status(400)
      .json({ error: "Transcription is required for note generation." });
  }

  try {
    // Refined system prompt emphasizing Markdown
    const systemPrompt = `You are an AI assistant specializing in creating well-structured notes from audio transcriptions. Your output MUST be valid Markdown.
Follow these rules precisely:
1. **Output Format:** Strictly Markdown.
2. **Content:** Base notes ONLY on the provided transcription. Do NOT add external information.
3. **Structure:** Use Markdown headings (#, ##, ###), bullet points (* or -), numbered lists, bold (**text**), italics (*text*), and code blocks (\`\`\`lang...\`\`\`) for organization.
4. **Tables:** If relevant, use Markdown table syntax for structured data.
5. **Math:** Use LaTeX syntax for mathematical formulas: $inline$ for inline math and $$display$$ for block math.
6. **Language:** Output notes in English, regardless of the transcription's language.
7. **Clarity:** Ensure notes are clear, concise, and easy to read.`;

    const userMessage = `${
      customPrompt || ""
    }\n\nHere is the transcription:\n\n${transcription}`;

    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
      }
    );

    // Extract the notes from the response
    const notes = response.data.choices[0]?.message?.content;

    if (notes) {
      res.json({ notes });
    } else {
      console.error("DeepSeek API response format unexpected:", response.data);
      res.status(500).json({
        error: "Failed to extract notes from DeepSeek response.",
        fallback: true,
      });
    }
  } catch (error) {
    console.error(
      "Error calling DeepSeek API:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to generate notes using DeepSeek API.",
      fallback: true,
    });
  }
});

// Static file serving for React app
app.use(express.static(path.join(__dirname, "build")));

// Serve uploaded files statically (for local use/preview only)
app.use("/uploads", express.static(uploadDir));

// Catch-all for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
