import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  MongoClient,
  MongoClientOptions,
  Db,
  Collection,
  Document,
} from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// --------------------------------------------------
// ENVIRONMENT
// --------------------------------------------------
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const MONGODB_URI = process.env.MONGODB_URI || "";

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in environment");
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in environment");
  process.exit(1);
}

// --------------------------------------------------
// EXPRESS APP
// --------------------------------------------------
const app = express();

app.use(
  cors({
    origin: "*",
    credentials: false,
  })
);
app.use(express.json());

// --------------------------------------------------
// MONGODB SETUP (WORKS ON LOCAL + RENDER)
// --------------------------------------------------
interface DalyCollegeDoc extends Document {
  [key: string]: any;
}

let db: Db | null = null;
let resourcesCollection: Collection<DalyCollegeDoc> | null = null;
let dbReady = false;

// TLS options fix for Render SSL error
const mongoOptions: MongoClientOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
};

const client = new MongoClient(MONGODB_URI, mongoOptions);

async function connectDB(): Promise<void> {
  try {
    await client.connect();
    db = client.db("dc-assistant"); // your DB name
    resourcesCollection = db.collection<DalyCollegeDoc>("resources");
    dbReady = true;
    console.log("✅ Connected to MongoDB dc-assistant.resources");
  } catch (err) {
    dbReady = false;
    console.error("❌ MongoDB connection error:", err);
  }
}

connectDB().catch((err) => {
  dbReady = false;
  console.error("❌ Initial MongoDB connect error:", err);
});

// --------------------------------------------------
// GEMINI SETUP
// --------------------------------------------------
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------
function getDirectAnswer(dbData: any, question: string): string | null {
  const q = question.toLowerCase();

  // Block developer/owner info
  if (
    q.includes("who made this") ||
    q.includes("who created this") ||
    q.includes("who developed this") ||
    q.includes("developer of this") ||
    q.includes("owner of this ai") ||
    q.includes("owner of this website")
  ) {
    return "I am the Daly College AI Assistant. I do not provide developer or owner information.";
  }

  // Owner of Daly College (institution)
  if (q.includes("owner of daly college")) {
    return "Daly College is not owned by a single person; it is governed by its Board of Governors.";
  }

  // Founder
  if (q.includes("founder of daly college") || q.includes("who is founder")) {
    return "Daly College traces its origins to the educational work of Sir Henry Daly in the late 19th century. The college is named in his honour.";
  }

  // Principal
  if (q.includes("principal")) {
    const pd = dbData?.principal_desk;
    if (!pd?.principal) return null;
    return `The Principal of Daly College is ${pd.principal}.`;
  }

  // Board of Governors
  if (q.includes("board of governors") || q.includes("bog")) {
    const bog = dbData?.bog?.board_of_governors;
    if (!Array.isArray(bog) || bog.length === 0) return null;
    const list = bog
      .map((m: any) => `${m.name} (${m.role})`)
      .join("; ");
    return `The Board of Governors of Daly College includes: ${list}.`;
  }

  // Day boarding houses
  if (q.includes("day boarding") || q.includes("day houses")) {
    const houses = dbData?.houses;
    if (!houses) return null;

    const boysDay = (houses.boys_day || []).map((h: any) => h.name).join(", ");
    const girlsDay = (houses.girls_day || [])
      .map((h: any) => h.name)
      .join(", ");

    return `Daly College has the following Day Boarding Houses.\nBoys: ${boysDay}.\nGirls: ${girlsDay}.`;
  }

  // Simple staff summary
  if (q.includes("staff") || q.includes("teachers") || q.includes("senior faculty")) {
    const staff = dbData?.staff?.faculty_all;
    if (!Array.isArray(staff) || staff.length === 0) return null;

    const sample = staff.slice(0, 8);
    const list = sample
      .map(
        (t: any) =>
          `${t.name} – ${t.designation || ""}${
            t.qualification ? ` (${t.qualification})` : ""
          }`
      )
      .join("; ");

    return `Some senior faculty and staff at Daly College include: ${list}.`;
  }

  return null;
}

function getRelevantSection(dbData: any, question: string): any {
  const q = question.toLowerCase();

  if (q.includes("principal")) return dbData.principal_desk;
  if (q.includes("founder") || q.includes("history")) return dbData.history || dbData.founder;
  if (q.includes("board of governors") || q.includes("bog")) return dbData.bog;
  if (q.includes("campus") || q.includes("facilities")) return {
    campus: dbData.campus,
    facilities: dbData.facilities,
  };
  if (q.includes("sport")) return dbData.sports;
  if (q.includes("house")) return dbData.houses;
  if (q.includes("staff") || q.includes("teacher")) return dbData.staff;
  if (q.includes("admission")) return dbData.admissions;

  // default: whole document
  return dbData;
}

// --------------------------------------------------
// ROUTES
// --------------------------------------------------
app.get("/", (_req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

app.get("/debug-status", async (_req: Request, res: Response) => {
  try {
    let hasDoc = false;
    if (resourcesCollection) {
      const count = await resourcesCollection.countDocuments();
      hasDoc = count > 0;
    }

    res.json({
      dbReady,
      hasDoc,
      mongoUriSet: !!MONGODB_URI,
      geminiKeySet: !!GEMINI_API_KEY,
    });
  } catch (err) {
    res.status(500).json({
      error: "debug-status failed",
      details: String(err),
    });
  }
});

app.get("/test-mongo", async (_req: Request, res: Response) => {
  try {
    if (!resourcesCollection) {
      return res.status(500).json({ error: "resourcesCollection is null" });
    }
    const doc = await resourcesCollection.findOne({});
    if (!doc) return res.json({ error: "No document found" });
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({
      error: "test-mongo failed",
      details: String(err),
    });
  }
});

// MAIN CHAT ENDPOINT
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const messageRaw: unknown = req.body?.message;
    const message =
      typeof messageRaw === "string" ? messageRaw.trim() : "";

    if (!message) {
      return res.json({
        reply: "Please enter a question about Daly College.",
      });
    }

    if (!dbReady || !resourcesCollection) {
      // This is the message you saw on Vercel
      return res.json({ reply: "Database not connected." });
    }

    const doc = await resourcesCollection.findOne({});
    if (!doc) {
      return res.json({
        reply: "No Daly College data found in the database.",
      });
    }

    // Remove Mongo _id
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...dcData } = doc;

    // 1) Try direct answer first (no Gemini)
    const direct = getDirectAnswer(dcData, message);
    if (direct) {
      return res.json({ reply: direct });
    }

    // 2) Otherwise, pick relevant section and ask Gemini
    const section = getRelevantSection(dcData, message);

    const prompt = `
You are the Daly College AI Assistant.
Answer ONLY using the Daly College data given below.
If the information is not present, reply exactly:
"This information is not available in the provided Daly College data."

User question:
${message}

Relevant Daly College data (JSON):
${JSON.stringify(section, null, 2)}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const replyText =
      (result.response && result.response.text()) ||
      "Sorry, I could not generate a response at this moment.";

    return res.json({ reply: replyText });
  } catch (err) {
    console.error("💥 /api/chat error:", err);
    return res.status(500).json({
      reply:
        "There was an internal error while answering your question. Please try again later.",
    });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
