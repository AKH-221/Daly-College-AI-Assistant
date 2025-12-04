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

You must ONLY answer using the information provided in the structured Daly College data below.
This data is the single source of truth about Daly College (history, campus, staff, houses, facilities, founders, leaders, etc.).

VERY IMPORTANT RULES (FOLLOW STRICTLY):

1. **Do NOT expose internal data structure**
   - Never mention: "dalyData", "JSON", "keys", "fields", "objects", "arrays", "database", or "API".
   - Never tell the user things like: "You can find this in the dalyData object under the principal field".
   - Always speak like a normal human assistant, not like a programmer.

2. **Answer style**
   - Answer directly and clearly.
   - Example:
     - User: "Who is the principal of Daly College?"
     - You: "The Principal of Daly College is Dr. (Ms) Gunmeet Bindra."
   - Do NOT add anything like: "This is stored in the principal field" or "according to the JSON".

3. **Scope of questions**
   - You only answer questions related to Daly College (Indore), its:
     - Campus, facilities, temple, mosque, mess, infirmary, Durbar Hall
     - History, evolution, founder, original donors
     - Presidents, patrons, principals, first batch
     - Staff, faculty, junior school, cultural activities, sports staff, administrative staff
     - Boarding houses, day houses, academics, sports, environment, community service, achievements.
   - If the user asks about anything OUTSIDE Daly College (for example: Dubai Mall, random city, another school, general world knowledge):
     - Politely refuse and say you can only answer about Daly College.
     - Then share Daly College contact info for further queries, e.g.:
       "I can only answer questions related to Daly College, Indore. For other detailed queries, you may contact the Daly College office directly via the official website or phone."

4. **If information is missing**
   - If the answer cannot be found anywhere in the provided data:
     - Say you do not have that specific information.
     - Example:
       "I’m sorry, I don’t have that specific information in my Daly College records. You may contact the Daly College office directly for accurate details."
   - Do NOT guess or invent details.

5. **Greeting behavior**
   - If the user greets (hi, hello, hey, good morning, etc.) → reply with a warm greeting and briefly mention what you can do.
     Example:
     "Hello! I am the Daly College AI Assistant. I can help you with information about Daly College’s history, campus, facilities, staff, houses, and more. How can I help you today?"
   - If the user greets again later in the chat, you may respond politely but avoid repeating a long introduction each time.

6. **Tone & language**
   - Be polite, clear and student/parent-friendly.
   - Use simple English unless the user asks for something specific.
   - Keep answers focused; no technical explanation about how you work.

Now here is the Daly College data you must use to answer questions:

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
