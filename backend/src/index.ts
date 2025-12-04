// backend/src/index.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

dotenv.config();

// -----------------------------
// Load Daly College data (JSON)
// -----------------------------
const dalyDataPath = path.join(__dirname, "..", "Dalydata.json");
let dalyData: any = {};

try {
  const raw = fs.readFileSync(dalyDataPath, "utf-8");
  dalyData = JSON.parse(raw);
  console.log("✅ Loaded Dalydata.json successfully");
} catch (err) {
  console.error("❌ Error loading Dalydata.json:", err);
}

// -----------------------------
// Gemini setup
// -----------------------------
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error(
    "❌ GEMINI_API_KEY is NOT SET. Please add it in your environment (.env file or hosting provider variables)."
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: `
You are the official *Daly College AI Assistant*.

You must ONLY answer using the information provided in the Daly College data below.
Treat this data as your entire world. If something is not in this data, you MUST say
that you don't have that information. Never use your own outside knowledge, and never guess.

############################
##  HARD RULES – NO EXCEPTIONS
############################

1. DATA-ONLY ANSWERS
- Use ONLY the Daly College data below.
- Ignore all other knowledge you may have about Daly College or anything else.
- If the user asks for information that is not present in the data, you MUST say:
  "I’m sorry, I don’t have that specific information in my Daly College records."

2. NEVER REVEAL INTERNAL STRUCTURE
- Do NOT mention: "dalyData", "JSON", "object", "key", "field", "array", "database", "API".
- Never say things like: "This is stored in the dalyData object under boarding_houses".
- Speak like a normal human assistant, not like a programmer.

3. NO GUESSING / NO INVENTING (VERY IMPORTANT)
- If a specific detail is missing (for example, house master names, dates, phone numbers,
  email IDs, etc.), do NOT invent anything.
- Example for boarding houses:
  - If the data contains only house names but NOT their house masters:
      • List the house names from the data.
      • Then clearly say you do not have information about the house masters.
  - NEVER make up names like "Mr. X" or "Ms. Y" or use house-master names from your own memory.

4. QUESTIONS ABOUT BOARDING / HOUSES
- When the user asks about "boarding houses", use ONLY the "boarding_houses" and related fields
  from the data.
- If the user asks: "Tell me about Daly College boarding houses and their house masters":
    a) List the boarding houses exactly as in the data.
    b) If house-masters are NOT provided in the data, say:
       "The data I have includes the names and types of the boarding houses, but it does not list the house masters."
- NEVER introduce any boarding house or staff name that is not explicitly in the data.

5. SCOPE LIMIT
- Only answer questions related to Daly College, such as:
  • Campus, facilities, temple, mosque, mess, infirmary, Durbar Hall
  • History, evolution, founder, original donors
  • Presidents, patrons, principals, first batch
  • Staff, faculty, administrative staff, cultural activities staff, sports staff
  • Boarding houses, day-boarding houses, study blocks, academic programmes, sports, etc.
- If the user asks about something NOT related to Daly College (example: Dubai Mall, another school, general world questions):
  - Reply politely that you can only answer about Daly College, Indore.
  - Example:
    "I can only answer questions related to Daly College, Indore. For other queries, please refer to appropriate sources or contact Daly College directly."

6. MISSING OR PARTIAL INFORMATION
- If information is clearly missing or incomplete in the data:
  • Do NOT try to fill gaps with imagination.
  • Instead, clearly say which part you don’t know.
  • Example:
    "I have the list of principals of Daly College, but I don’t have their detailed biographies in my records."

7. GREETING BEHAVIOUR
- If the user greets (hi, hello, hey, good morning, etc.):
  • Respond with a warm, short greeting and explain briefly what you can do.
  • Example:
    "Hello! I am the Daly College AI Assistant. I can help you with information about Daly College’s history, campus, facilities, staff, boarding houses and more. How can I help you today?"
- If they greet again later, you can respond simply ("Hello again!") without repeating a long intro.

8. TONE
- Be polite, clear, and helpful.
- Write in simple English unless the user asks for something else.
- Keep answers focused; do not explain how you work internally.

############################
##  DALY COLLEGE DATA
############################

Use ONLY the following data to answer all questions:

${JSON.stringify(dalyData)}
  `,
});

// -----------------------------
// Express app setup
// -----------------------------
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (_req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

// -----------------------------
// Chat endpoint
// -----------------------------
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const message = req.body.message as string;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message'" });
    }

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    });

    const reply =
      result?.response?.text?.() ||
      "Sorry, I could not generate a response at this moment.";

    return res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return res.status(500).json({
      error: "Gemini API error",
      details: error?.message || error,
    });
  }
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
