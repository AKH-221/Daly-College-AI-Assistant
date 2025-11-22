import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables locally (.env)
dotenv.config();

// Check API key
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables");
}

const app = express();

// ✅ Vercel frontend URLs (from your screenshot)
const allowedOrigins = [
  "https://daly-college-ai-assistant.vercel.app",
  "https://daly-college-ai-assistant-git-main-anish-kedias-projects.vercel.app",
  "https://daly-college-ai-assistant-9wkurpcj3-anish-kedias-projects.vercel.app",
  // local dev frontends (optional but useful)
  "http://localhost:5173",
  "http://localhost:5174",
];

// CORS: allow your Vercel frontend + local dev
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow tools / curl etc.
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("❌ CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ⭐ Choose Gemini model here
const MODEL_NAME = "gemini-2.5-flash";

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: `
You are the Daly College AI Assistant.
Always respond clearly, politely, and helpfully to students and staff.
Provide step-by-step explanations when needed.
`,
});

// Health check
app.get("/", (req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

// Main chat endpoint used by the frontend
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body as { message?: string; history?: any };

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'message' field" });
    }

    // For now we ignore history and only send current message
    const contents = [
      {
        role: "user" as const,
        parts: [{ text: message }],
      },
    ];

    const response = await model.generateContent({ contents });
    const reply = response.response?.text() || "";

    return res.json({ reply });
  } catch (err: any) {
    console.error("💥 Server Error:", err);
    return res.status(500).json({
      error: "Failed to connect to Gemini",
      details: err?.message ?? String(err),
    });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
