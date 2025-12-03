import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dalyData from "./Dalydata.json"; // your big Daly College knowledge file

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ Safety check for API key
if (!GEMINI_API_KEY) {
  console.error(
    "❌ GEMINI_API_KEY is NOT SET. Please add it in your .env or hosting provider environment variables."
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// 🔹 Helper: detect if the user message is ONLY a greeting (no question)
function isPureGreeting(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  const greetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste"
  ];
  return greetings.includes(normalized);
}

// 🧠 SYSTEM PROMPT – behaviour rules
const SYSTEM_PROMPT = `
You are the Daly College AI Assistant.

CRITICAL DATA RULES:
- You must ONLY use the information contained in the "dalyData" JSON object given to you.
- Do NOT use any outside knowledge (internet, general world knowledge, your own training data, or guesses).
- If the user asks for something that is NOT found anywhere in dalyData, you must politely say:
  "I'm sorry, I don't have that information in my Daly College data file. Please contact the school office for accurate details."
- Never invent or assume names, dates, marks, fees, statistics, or events that are not clearly present in dalyData.

GREETING RULES:
- The server or website handles the first greeting when the chat opens.
- Do NOT start every answer with "Hello", "Hi", or similar.
- If UserMessageType is "GREETING_ONLY", the user has sent just a greeting like "hi" or "hello".
  - In that case, reply with ONE warm greeting and a short line offering help.
  - Example: "Hello! I am the Daly College AI Assistant. How can I help you today?"
- If UserMessageType is "NORMAL_MESSAGE", the user is asking a question or giving details.
  - In that case, DO NOT greet again. Answer directly and politely without repeating "Hello".

STYLE:
- Be clear, polite, and student/parent-friendly.
- Use simple English unless the user clearly asks for another language.
- When answering, try to point to the exact section of dalyData you are using (e.g., staff, houses, academics, sports, etc.), but do it in natural language.
`;

// Simple health check
app.get("/", (req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

// MAIN CHAT ENDPOINT
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const message = req.body.message as string | undefined;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ reply: "Missing or invalid 'message' in request body." });
    }

    const userMessageType = isPureGreeting(message)
      ? "GREETING_ONLY"
      : "NORMAL_MESSAGE";

    // 🔹 Build the full prompt for Gemini
    const prompt = `
${SYSTEM_PROMPT}

Here is the complete "dalyData" JSON. This is your ONLY knowledge source:

\`\`\`json
${JSON.stringify(dalyData)}
\`\`\`

Metadata:
- UserMessageType: ${userMessageType}

User message:
"${message}"

Now respond following ALL the rules above.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const replyText = result.response.text();

    return res.json({
      reply:
        replyText ||
        "Sorry, I could not generate a response from the Daly College data.",
    });
  } catch (err) {
    console.error("❌ Gemini / server error:", err);
    return res.status(500).json({
      reply: "Server error while talking to Gemini.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Daly College backend running on port ${PORT}`);
});

export default app;
