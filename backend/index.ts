import express, { Request, Response } from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// Allow requests from any origin (simple for now)
// If you want to restrict later, you can replace "*" with your Vercel URL.
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

// Make sure your GEMINI_API_KEY is set in Render / .env
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ⭐ Choose Gemini model here
// e.g. "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", etc.
const MODEL_NAME = "gemini-2.5-flash";

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: `
You are the Daly College AI Assistant.
Always respond clearly, politely, and helpfully to students and staff.
Provide step-by-step explanations when needed.
`,
});

// Simple health-check route
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

    // For now, ignore history and just send the current message
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
