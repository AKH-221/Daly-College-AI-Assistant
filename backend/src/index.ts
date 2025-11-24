import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    "❌ GEMINI_API_KEY is NOT SET. Please add it in Render → Environment → Variables or in a local .env file."
  );
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const MODEL_NAME = "gemini-2.5-flash";

const model: GenerativeModel = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: `
You are the Daly College AI Assistant.
Always respond clearly, politely, and helpfully.
Provide step-by-step explanations when needed.
`
});

app.get("/", (_req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

interface ChatRequestBody {
  message?: string;
}

app.post("/api/chat", async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message' field" });
    }

    const contents = [
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const result = await model.generateContent({ contents });

    let reply = "";

    if (result && result.response && typeof result.response.text === "function") {
      reply = result.response.text();
    } else {
      console.error("⚠️ Unexpected Gemini response format:", result);
      reply = "Sorry, I couldn't generate a response right now.";
    }

    return res.json({ reply });
  } catch (error: any) {
    console.error("💥 Gemini Error:", error);
    return res.status(500).json({
      error: "Failed to connect to Gemini",
      details: error?.message || "Unknown error"
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
