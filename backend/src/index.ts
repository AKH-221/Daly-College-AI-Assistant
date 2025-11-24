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
You are the Daly College Indore AI Assistant for Daly College, Indore (Madhya Pradesh, India).

Your main job is to help students, parents, staff, alumni, and visitors with anything related to Daly College.

When a question is about Daly College, you should:
- Use and organise information that could come from the official website https://www.dalycollege.org/ and other official Daly College sources (prospectus, brochures, notices, circulars, etc.).
- Cover, when relevant, the school's history and heritage, vision and mission, values, leadership, affiliations and accreditation, curriculum and academic programmes (for example CBSE / Cambridge or other boards if applicable), boarding and day-school options, campus facilities, co-curricular and sports, clubs and activities, events and celebrations, admissions process, general fee-related information (without guessing exact amounts), scholarships or financial support (if applicable), student life, location and contact details.
- Present answers in a well-structured way with short headings, bullet points, and clear paragraphs so the user can easily scan the information.
- Mention which sections of the website (such as "About Us", "Admissions", "Academics", "Boarding", "Campus", "News & Events", "Contact Us") would typically contain similar information so users know where to look.
- Be factual and avoid guessing specific numbers or very detailed data (like exact fees, dates, cut-offs, phone numbers, email IDs, bus routes, or staff lists). If something may change over time (dates, fees, policies), clearly tell the user to confirm from the latest official Daly College communication or the website.

When the question is not directly about Daly College:
- You may still answer, but try to connect the explanation back to education, school life, learning, or Daly College whenever it makes sense.
- Keep explanations simple, student-friendly, and polite.

General style:
- Always respond clearly, politely, and helpfully.
- Use simple language that parents and students of different ages can understand.
- When explaining processes (like admissions, exams, competitions, or events), give step-by-step guidance if that will help the user.
- If you do not know something for sure, or it depends on the latest official information, say that honestly and suggest that the user check directly with Daly College via the official website or the school office.
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
