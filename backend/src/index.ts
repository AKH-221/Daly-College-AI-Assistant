// src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// IMPORTANT: this requires "resolveJsonModule": true in tsconfig.json
import dalyData from "./Dalydata.json";

dotenv.config();

const app = express();

// CORS – adjust frontend URL if needed
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://daly-college-ai-assistant.vercel.app",
      "https://daly-college-ai-assistant.onrender.com",
      /\.vercel\.app$/,
      /\.onrender\.com$/,
    ],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 8080;

// ---------- Gemini setup ----------
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is NOT set in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System rules – ONLY use Dalydata.json
const SYSTEM_INSTRUCTION = `
You are the official Daly College AI Assistant.

You MUST follow these rules:

1. You can ONLY use the information given in the Dalydata JSON that the user provides in the prompt.
2. Do NOT use your own knowledge, the internet, or any outside information.
3. If the user asks something not related to Daly College, reply:
   "I can only answer questions related to Daly College."
4. If the answer CANNOT be found in the JSON data, reply EXACTLY:
   "I'm sorry, I don't have that specific information in my Daly College records."
5. If the user just says "hi", "hello", "hey" etc., greet them with:
   "Hello! I am the Daly College AI Assistant. How can I help you today?"
6. Otherwise, answer clearly and politely using ONLY the JSON data.
`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: SYSTEM_INSTRUCTION,
});

// ---------- Routes ----------

app.get("/", (_req: Request, res: Response) => {
  res.send("✅ Daly College AI Assistant backend is running");
});

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const message = (req.body.message || "").toString().trim();

    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in body" });
    }

    // simple greeting handling
    if (/^(hi|hello|hey)\b/i.test(message)) {
      return res.json({
        reply:
          "Hello! I am the Daly College AI Assistant. How can I help you today?",
      });
    }

    // Build one prompt that includes the JSON + user question
    const userPrompt = `
Here is the complete Daly College data in JSON format:

${JSON.stringify(dalyData, null, 2)}

Using ONLY this data, answer the user's question.

User question: "${message}"
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
    });

    const reply =
      result?.response?.text() ||
      "Sorry, I could not generate a response at this moment.";

    return res.json({ reply });
  } catch (err) {
    console.error("Gemini Error:", err);
    return res.status(500).json({
      error: "Gemini API error",
    });
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
