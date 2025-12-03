import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dalyData from "./Dalydata.json"; // your big JSON file

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// 👇 KEEP YOUR EXISTING SYSTEM PROMPT TEXT HERE
// Copy it EXACTLY from your old index.ts and paste inside the backticks:
const SYSTEM_PROMPT = `
<<< PASTE YOUR ORIGINAL DALY COLLEGE SYSTEM INSTRUCTION HERE WITHOUT CHANGING ANYTHING >>>
`;

// ---------------- Gemini setup ----------------
const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is missing");
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ---------------- Health route ----------------
app.get("/", (_req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✔ (JSON mode, system prompt preserved)");
});

// ---------------- Chat route ----------------
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const userMsg = (req.body?.message ?? "").toString().trim();

    if (!userMsg) {
      return res.status(400).json({ reply: "Please enter a message." });
    }

    const lower = userMsg.toLowerCase();

    // Simple greeting handler (does NOT touch your system prompt)
    if (["hi", "hello", "hey", "hii"].some((g) => lower.startsWith(g))) {
      return res.json({
        reply:
          "Hi 👋 I’m the Daly College AI Assistant. Ask me about houses, staff, academics, sports, campus, AFS, Round Square, and more!"
      });
    }

    // Build final prompt: your SYSTEM_PROMPT + JSON data + user question
    const dataText = JSON.stringify(dalyData, null, 2);

    const fullPrompt = `
${SYSTEM_PROMPT}

You also have access to the following structured Daly College knowledge (from Dalydata.json). 
Use it as factual reference. If the answer is not present, clearly say you don't have that exact information in the data.

--- DALY COLLEGE DATA START ---
${dataText}
--- DALY COLLEGE DATA END ---

User question (may have spelling mistakes):
"""${userMsg}"""
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ]
    });

    const replyText = result.response.text();
    return res.json({ reply: replyText || "Sorry, I could not generate a response." });
  } catch (err) {
    console.error("❌ Gemini / server error:", err);
    return res.status(500).json({ reply: "Server error while talking to Gemini." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

export default app;
