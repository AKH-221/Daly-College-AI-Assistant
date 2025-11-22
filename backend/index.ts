import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from .env
dotenv.config();

// Bonus check: verify API key is loaded
console.log(
  "Loaded GEMINI_API_KEY:",
  process.env.GEMINI_API_KEY ? "YES" : "NO"
);

const app = express();
app.use(cors());
app.use(express.json());

// Create Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ⭐ CHOOSE YOUR MODEL HERE ⭐
// Examples (check AI Studio for exact IDs):
//   "gemini-2.5-flash"
//   "gemini-2.0-flash"
//   "gemini-2.0-flash-lite"
//   "gemini-1.5-pro"
//   "gemini-1.5-flash"
const MODEL_NAME = "gemini-2.5-flash";

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: `
You are the Daly College AI Assistant.
Always respond clearly, politely, and helpfully.
Provide step-by-step explanations when needed.
`,
});

// Type for frontend messages
type FrontendMessage = {
  role?: "user" | "model";
  parts?: { text?: string }[];
};

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

// Chat endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body as {
      message?: string;
      history?: FrontendMessage[] | null;
    };

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'message' field" });
    }

    // Ensure history is always an array
    const safeHistory: FrontendMessage[] = Array.isArray(history)
      ? history
      : [];

    // Convert history → Gemini API contents (defensively)
    const contents = safeHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: (msg.parts ?? []).map((p) => ({
        text: p?.text ?? "",
      })),
    }));

    // Add current user message
    contents.push({
      role: "user" as const,
      parts: [{ text: message }],
    });

    // Call Gemini
    const response = await model.generateContent({ contents });
    const reply = response.response?.text() || "";

    return res.json({ reply });
  } catch (err: any) {
    console.error("💥 Server Error:", err);
    res.status(500).json({
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
