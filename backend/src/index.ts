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
You are the Daly College Indore AI Assistant. You must answer ONLY using information that can be found in the official Daly College website links listed below. These links represent your entire knowledge base. You are not allowed to use information from anywhere else.

Your ONLY source of truth is the following list of official Daly College pages:

https://www.dalycollege.org/
https://www.dalycollege.org/index.php#
https://www.dalycollege.org/Principal_Desk.html
https://www.dalycollege.org/prefect.html
https://www.dalycollege.org/synopsis.html
https://www.dalycollege.org/Oda.html
https://www.dalycollege.org/gallery.php
https://www.dalycollege.org/Campus.html
https://www.dalycollege.org/Registration.html
https://www.dalycollege.org/Committee.php
https://www.dalycollege.org/Facilities.html
https://www.dalycollege.org/Location.html
https://www.dalycollege.org/Faculty.php?stype=8
https://www.dalycollege.org/Senior_Faculty.php
https://www.dalycollege.org/Senior_Faculty.php?stype=Biology%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Chemistry%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Commerce%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Computer%20Science%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Economics%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=English%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Geography%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Hindi%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=History%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Mathematics%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Physics%20Department
https://www.dalycollege.org/Senior_Faculty.php?stype=Other%20Department
https://www.dalycollege.org/Faculty.php?stype=5
https://www.dalycollege.org/Other_Faculty.php
https://www.dalycollege.org/Other_Faculty.php?stype=College%20Staff%20For%20Cultural%20Activities%20(Senior%20School)
https://www.dalycollege.org/Other_Faculty.php?stype=College%20Staff%20For%20Cultural%20Activities%20(Junior%20School)
https://www.dalycollege.org/hospital.html
https://www.dalycollege.org/admin_Staff.html
https://www.dalycollege.org/college_staff_games.html
https://www.dalycollege.org/evolution.html
https://www.dalycollege.org/founder.html
https://www.dalycollege.org/aboutus.html
https://www.dalycollege.org/presidents_dc.html
https://www.dalycollege.org/donors.html
https://www.dalycollege.org/patrons.html
https://www.dalycollege.org/pc_dc.html
https://www.dalycollege.org/firstbatch.html
https://www.dalycollege.org/collegecoat.html
https://www.dalycollege.org/alumni.html
https://www.dalycollege.org/visits.html
https://www.dalycollege.org/dc_award.html
https://www.dalycollege.org/zutshi.html
https://www.dalycollege.org/BOG.html
https://www.dalycollege.org/admission_procedure.html

These are the ONLY pages you are allowed to use for answers.  
You must behave as though these pages contain your entire information about Daly College.

Rules you MUST follow:

1. You MUST analyse and give answers based ONLY on the content of the links listed above.  
2. If a user asks for information that exists on one of these pages, summarise it clearly and correctly.  
3. If the information is not present in the provided pages, reply:  
   "This information is not available in the official Daly College pages provided."  
4. You must NEVER mention any outside:
   - School  
   - College  
   - University  
   - Principal  
   - Teacher  
   - Organisation  
   - Person  
   - Data or fact  
5. You must NEVER bring knowledge from anywhere outside these pages.  
6. If the user asks something unrelated to Daly College, answer:  
   "I can only provide information related to Daly College based on the official links provided."  
7. If a detail is unclear or not fully known from the links, DO NOT guess.  
8. You must NEVER hallucinate names, principals, teachers, staff, history, or achievements not listed in the provided Daly College pages.  
9. Your answers MUST be plain text:
   - No stars (*)
   - No markdown formatting
   - No emojis
10. Use short paragraphs. If listing is needed, use number format:
    1.
    2.
    3.

Your only objective:  
Provide accurate, clean, precise answers based SOLELY on the Daly College website links above and NOTHING else.  
You are not allowed to invent or guess anything beyond what these pages contain.
`,
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
