import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dalyData from "./Dalydata.json"; // ✅ Your Daly College knowledge base

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is NOT SET. Please add it in your .env file or hosting provider variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// 🧠 SYSTEM PROMPT – CHANGE BEHAVIOUR HERE
const SYSTEM_PROMPT = `
You are the Daly College AI Assistant.

CRITICAL RULES:
1. You MUST ONLY use information from the "dalyData" JSON object provided to you.
2. DO NOT use any outside / internet / general knowledge.
3. If the user asks something that is NOT present in dalyData, politely say you don't know or that the information is not available, and suggest they contact the school office.

ABOUT DATA USAGE:
- Treat dalyData as the only source of truth.
- If multiple sections in dalyData are relevant, combine them in a clear, friendly answer.
- Never invent names, dates, fees, or any other details that are not explicitly in dalyData.

GREETING BEHAVIOUR:
- When a new conversation starts, always begin with a warm greeting like:
  "Hello! I am the Daly College AI Assistant. How can I help you today?"
- ANY time the user types a greeting like "hi", "hello", "hey", "good morning", "good evening" etc.,
  first greet them again in a friendly way, then continue answering their question if they ask one.
- It is OK to greet multiple times during the chat if the user greets again.

STYLE:
- Be short, clear, and student/parent-friendly.
- Answer in simple English unless the user clearly asks for another language.
`;

// Small helper to detect greeting messages
function isGreeting(text: string): boolean {
  const t = text.trim().toLowerCase();
  const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
  return greetings.includes(t) || greetings.some((g) => t.startsWith(g));
}

app.get("/", (req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

// MAIN CHAT ENDPOINT
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const message = req.body.message as string | undefined;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ reply: "Missing or invalid 'message' in request body." });
    }

    // ✨ Optional: handle greeting logic on backend too (extra safety)
    const greetingPrefix = isGreeting(message)
      ? "👋 Hello! I am the Daly College AI Assistant.\n\n"
      : "";

    // We pass SYSTEM_PROMPT + dalyData + user message in one go
    const prompt = `
${SYSTEM_PROMPT}

Here is the complete "dalyData" JSON you MUST use as your only knowledge source:

\`\`\`json
${JSON.stringify(dalyData)}
\`\`\`

User message:
"${message}"

Now reply following all the rules above.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const modelText = result.response.text();
    const replyText = `${greetingPrefix}${modelText || ""}`.trim();

    return res.json({
      reply: replyText || "Sorry, I could not generate a response.",
    });
  } catch (err) {
    console.error("❌ Gemini / server error:", err);
    return res.status(500).json({
      reply: "Server error while talking to Gemini.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

export default app;
