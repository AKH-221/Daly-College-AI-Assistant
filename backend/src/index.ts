import express, { Request, Response } from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// Allow all origins for now (works for Render + Vercel)
app.use(cors());
app.use(express.json());

// Make sure GEMINI_API_KEY is set on Render / .env
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ⭐ Choose the Gemini model you want
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

// Main chat endpoint – ignores history to avoid crashes
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message } = req.body as { message?: string; history?: any };

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid 'message' field" });
    }

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
