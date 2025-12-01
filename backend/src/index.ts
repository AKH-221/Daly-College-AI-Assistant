import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, Db, Collection } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// ----------------------------------------
// ENV
// ----------------------------------------
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MONGODB_URI = process.env.MONGODB_URI || "";

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in .env");
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in .env");
  process.exit(1);
}

// ----------------------------------------
// EXPRESS SETUP
// ----------------------------------------
const app = express();
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());

// ----------------------------------------
// MONGO SETUP
// ----------------------------------------
interface DalyCollegeData {
  [key: string]: any;
}

let db: Db | null = null;
let resourcesCollection: Collection<DalyCollegeData> | null = null;
let dbReady = false;

const client = new MongoClient(MONGODB_URI);

async function connectDB() {
  try {
    await client.connect();
    db = client.db("dc-assistant"); // ← YOUR DATABASE NAME
    resourcesCollection = db.collection<DalyCollegeData>("resources"); // ← COLLECTION
    dbReady = true;
    console.log("✅ Connected to MongoDB dc-assistant.resources");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    dbReady = false;
  }
}
connectDB();

// ----------------------------------------
// GEMINI SETUP
// ----------------------------------------
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ----------------------------------------
// DIRECT ANSWERS (no hallucination)
// ----------------------------------------
function getDirectAnswer(dbData: any, question: string): string | null {
  const q = question.toLowerCase();

  // Block developer questions
  if (
    q.includes("developer") ||
    q.includes("who made this") ||
    q.includes("who created this") ||
    q.includes("who built this") ||
    q.includes("owner of this ai") ||
    q.includes("owner of this website")
  ) {
    return "I am the Daly College AI Assistant. I do not provide developer or owner information.";
  }

  // OWNER
  if (q.includes("owner of daly college") || q.includes("who is owner")) {
    return "Daly College is not owned by a single person. It is governed by its Board of Governors.";
  }

  // ⭐ FOUNDER (FIXED ANSWER)
  if (q.includes("founder")) {
    return "Daly College was founded by Sir Henry Daly in the late 19th century. The institution is named after him.";
  }

  // PRINCIPAL
  if (q.includes("principal")) {
    const p = dbData.principal_desk;
    if (!p) return null;
    return `The Principal of Daly College is ${p.principal}.`;
  }

  // BOG
  if (q.includes("board of governors") || q.includes("bog")) {
    if (!dbData.bog) return null;
    const members = (dbData.bog.board_of_governors || [])
      .map((m: any) => `${m.name} (${m.role})`)
      .join("; ");
    return `The Board of Governors includes: ${members}`;
  }

  // DAY BOARDING
  if (q.includes("day boarding") || q.includes("day house")) {
    const h = dbData.houses;
    if (!h) return null;
    const boys = (h.boys_day || []).map((x: any) => x.name).join(", ");
    const girls = (h.girls_day || []).map((x: any) => x.name).join(", ");
    return `Day Boarding Houses:\nBoys: ${boys}\nGirls: ${girls}`;
  }

  return null;
}

// ----------------------------------------
// PICK RELEVANT SECTION
// ----------------------------------------
function pickSection(dbData: any, question: string) {
  const q = question.toLowerCase();
  if (q.includes("principal")) return dbData.principal_desk;
  if (q.includes("house")) return dbData.houses;
  if (q.includes("bog") || q.includes("board")) return dbData.bog;
  if (q.includes("campus")) return dbData.campus;
  if (q.includes("sport")) return dbData.sports;
  return dbData;
}

// ----------------------------------------
// ROUTES
// ----------------------------------------
app.get("/", (_req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

app.get("/debug-status", async (_req, res) => {
  try {
    const hasDoc = resourcesCollection
      ? (await resourcesCollection.countDocuments()) > 0
      : false;

    res.json({
      dbReady,
      hasDoc,
      mongoSet: !!MONGODB_URI,
      geminiSet: !!GEMINI_API_KEY,
    });
  } catch (err) {
    res.status(500).json({ error: "debug-status failed", details: String(err) });
  }
});

app.get("/test-mongo", async (_req, res) => {
  try {
    if (!resourcesCollection) return res.json({ error: "no collection" });
    const doc = await resourcesCollection.findOne({});
    return res.json(doc);
  } catch (err) {
    return res.json({ error: "test-mongo failed", details: String(err) });
  }
});

// ----------------------------------------
// MAIN CHAT ROUTE
// ----------------------------------------
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const message: string = req.body?.message;
    if (!message) return res.json({ reply: "Invalid message." });

    if (!dbReady || !resourcesCollection) {
      return res.json({ reply: "Database not connected." });
    }

    const doc = await resourcesCollection.findOne({});
    if (!doc) return res.json({ reply: "No Daly College data found in DB." });

    const { _id, ...dcData } = doc;

    // DIRECT ANSWER FIRST
    const direct = getDirectAnswer(dcData, message);
    if (direct) return res.json({ reply: direct });

    // OTHERWISE USE GEMINI
    const section = pickSection(dcData, message);
    const prompt = `
You are the Daly College Assistant AI.
Answer ONLY based on this data. If not available, say:
"This information is not available in the Daly College data."

User question: "${message}"

Relevant data:
${JSON.stringify(section, null, 2)}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const reply = result.response.text() || "No reply generated.";
    return res.json({ reply });
  } catch (err) {
    return res.json({ reply: "Server error: " + String(err) });
  }
});

// ----------------------------------------
// START SERVER
// ----------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
