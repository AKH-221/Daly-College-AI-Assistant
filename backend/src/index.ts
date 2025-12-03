import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { MongoClient, Db, Collection } from "mongodb";

dotenv.config();

// -----------------------------
// Express app setup
// -----------------------------
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// -----------------------------
// Gemini (Google Generative AI)
// -----------------------------
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error("❌ GEMINI_API_KEY is NOT SET. Please add it in .env / Render variables.");
}

const genAI = new GoogleGenerativeAI(geminiApiKey || "");
const model: GenerativeModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// -----------------------------
// MongoDB setup
// -----------------------------
const mongoUri = process.env.MONGODB_URI || "";
const mongoDbName = process.env.MONGODB_DB_NAME || "dalycollege";
const mongoCollectionName =
  process.env.MONGODB_COLLECTION_NAME || "resources";

let mongoClient: MongoClient | null = null;

async function getCollection(): Promise<Collection | null> {
  try {
    if (!mongoUri) {
      console.warn("⚠️ MONGODB_URI not set. Skipping DB connection.");
      return null;
    }

    if (!mongoClient) {
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      console.log("✅ Connected to MongoDB");
    }

    const db: Db = mongoClient.db(mongoDbName);
    return db.collection(mongoCollectionName);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    return null;
  }
}

// -----------------------------
// Health check route
// -----------------------------
app.get("/", (_req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

// -----------------------------
// Main chat route
// -----------------------------
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    // Safely read body
    const body = (req.body ?? {}) as { message?: string };
    const rawMessage = (body.message ?? "").toString().trim();

    if (!rawMessage) {
      return res.status(400).json({ error: "Missing or invalid 'message'" });
    }

    const messageLower = rawMessage.toLowerCase();

    // -----------------------------
    // 1) GREETING / SMALL TALK
    // -----------------------------
    const greetingWords = ["hi", "hello", "hey", "hii", "hiii", "yo"];
    const smallTalkPhrases = [
      "who are you",
      "what are you",
      "what can you do",
      "help",
      "menu",
      "options",
    ];

    // simple greeting
    if (
      greetingWords.some(
        (g) => messageLower === g || messageLower.startsWith(g + " ")
      )
    ) {
      return res.json({
        reply:
          "Hi! 👋 I’m the Daly College AI Assistant. I can help you with houses, academics, sports, staff, campus, heritage and more. What would you like to know?",
      });
    }

    // small talk / meta questions
    if (smallTalkPhrases.some((p) => messageLower.includes(p))) {
      return res.json({
        reply:
          "I’m the Daly College AI Assistant. I use Daly College data to answer questions about the school – houses, leadership, academics, sports, campus facilities, boarding and heritage. Just ask me in your own words, even if the spelling is not perfect. 🙂",
      });
    }

    // -----------------------------
    // 2) LOAD DALY COLLEGE DATA FROM MONGODB
    // -----------------------------
    let dataText = "";
    try {
      const collection = await getCollection();
      if (collection) {
        const docs = await collection.find({}).toArray();
        dataText = JSON.stringify(docs, null, 2);
      } else {
        dataText = "";
      }
    } catch (dbErr) {
      console.error("❌ MongoDB query error:", dbErr);
      dataText = "";
    }

    // -----------------------------
    // 3) BUILD PROMPT FOR GEMINI
    // -----------------------------
    const prompt = `
You are the Daly College AI Assistant.

You ONLY use the Daly College data given below to answer.
The user might make spelling mistakes, mix English and Hindi, or write very short messages.
Still, try to understand what they mean and answer from the data.

If the exact information truly does not exist in this data, say:
"I don’t have this exact information in the Daly College data, but I can help with houses, academics, sports, staff, campus and heritage."

If the data block is empty, answer politely with general information about Daly College and mention that detailed data is not yet loaded.

--- DALY COLLEGE DATA START ---
${dataText || "(no structured data loaded from MongoDB)"}
--- DALY COLLEGE DATA END ---

User question (may have spelling mistakes):
"""${rawMessage}"""
`;

    // -----------------------------
    // 4) CALL GEMINI
    // -----------------------------
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const modelText = result?.response?.text?.();
    const reply =
      typeof modelText === "string" && modelText.trim().length > 0
        ? modelText
        : "Sorry, I could not generate a response at this moment.";

    return res.json({ reply });
  } catch (error) {
    console.error("❌ Gemini / server error:", error);
    return res.status(500).json({
      error: "Internal server error while talking to Gemini",
    });
  }
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
