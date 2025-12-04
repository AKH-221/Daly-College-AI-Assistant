// backend/src/index.ts

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// -----------------------------
// Basic Express setup
// -----------------------------
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());

const PORT = process.env.PORT || 8080;

// -----------------------------
// Load Dalydata.json (DO NOT TOUCH DATA)
// -----------------------------
const DATA_PATH = path.join(__dirname, "..", "Dalydata.json");

let dalyData: any = null;
let dalyFlatChunks: string[] = [];

try {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  // assuming Dalydata.json is valid JSON in your project
  dalyData = JSON.parse(raw);
  console.log("✅ Dalydata.json loaded successfully");
} catch (err) {
  console.error("❌ Error loading/parsing Dalydata.json:", err);
  // If parsing fails, we still keep raw text as one big chunk
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    dalyData = raw;
    console.log("⚠️ Using Dalydata.json as raw text only");
  } catch (e2) {
    console.error("❌ Could not even read Dalydata.json as text:", e2);
  }
}

// -----------------------------
// Helper: Flatten Daly data into text chunks for search
// -----------------------------
function collectTextChunks(node: any, prefix = ""): string[] {
  const chunks: string[] = [];

  // primitive values -> add as text
  if (
    node === null ||
    node === undefined ||
    typeof node === "number" ||
    typeof node === "boolean" ||
    typeof node === "string"
  ) {
    const text = String(node).trim();
    if (text.length > 0) {
      chunks.push(text);
    }
    return chunks;
  }

  // arrays
  if (Array.isArray(node)) {
    for (const item of node) {
      chunks.push(...collectTextChunks(item, prefix));
    }
    return chunks;
  }

  // objects
  if (typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      const newPrefix = prefix ? `${prefix} > ${key}` : key;
      const subChunks = collectTextChunks(value, newPrefix);
      for (const c of subChunks) {
        chunks.push(`${newPrefix}: ${c}`);
      }
    }
    return chunks;
  }

  return chunks;
}

// Build flat chunks once if JSON parsed successfully
if (dalyData && typeof dalyData === "object") {
  dalyFlatChunks = collectTextChunks(dalyData);
  console.log(`📚 Dalydata flattened into ${dalyFlatChunks.length} chunks`);
} else if (typeof dalyData === "string") {
  // raw text fallback
  dalyFlatChunks = [dalyData];
}

// -----------------------------
// Very simple keyword search over chunks
// -----------------------------
function getContextForQuery(query: string, maxChunks = 20): string {
  if (!dalyFlatChunks.length) return "";

  const q = query.toLowerCase();
  const qWords = Array.from(
    new Set(
      q
        .split(/[^a-z0-9]+/i)
        .map((w) => w.trim())
        .filter(Boolean)
    )
  );

  type Scored = { score: number; text: string };

  const scored: Scored[] = [];

  for (const chunk of dalyFlatChunks) {
    const lower = chunk.toLowerCase();
    let score = 0;
    for (const w of qWords) {
      if (w.length < 2) continue;
      if (lower.includes(w)) score += 1;
    }
    if (score > 0) {
      scored.push({ score, text: chunk });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, maxChunks).map((s) => s.text);

  return top.join("\n\n---\n\n");
}

// -----------------------------
// Gemini setup
// -----------------------------
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY is NOT SET. Add it in .env or Render env vars.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `
You are "Daly College AI Assistant".

CRITICAL RULES (DO NOT BREAK):
1. You MUST use ONLY the information from the official Dalydata.json context that the system provides to you.
2. You are NOT allowed to invent, guess, or use any outside information (no internet knowledge, no assumptions).
3. If the user asks about anything that is NOT present in the context, reply EXACTLY with:

"I'm sorry, I can only answer questions about Daly College using the official Daly data. For more information, please contact Daly College directly at principal@dalycollege.org or call 0731-2719000."

4. For lists like:
   - First batch of Daly College students
   - Presidents of Daly College
   - Patrons, Original Donors
   - Principals of Daly College
   - Staff lists, houses, facilities, sports, campus overview, AFS, counselling, placement records, etc.
   you MUST use the names and spellings exactly as they appear in the context. Do not add extra names, do not remove names, do not reorder unless the question clearly asks for sorting.

5. Do NOT talk about any other school, organisation, city, or topic that is not part of Dalydata.json.

6. About greetings:
   - If the user says "hi", "hello", "hey", "good morning", etc., you may greet politely and then briefly explain what you can help with.
   - If the user directly asks a question without greeting, answer politely but do NOT start with an unnecessary greeting.

Your priority is 100% accuracy to the Dalydata.json content and 0% hallucination.
`,
});

// -----------------------------
// Routes
// -----------------------------
app.get("/", (_req: Request, res: Response) => {
  res.send("Daly College AI Assistant backend is running ✅");
});

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const message = req.body.message;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message' field" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
    }

    // Get relevant context from Dalydata.json
    const context = getContextForQuery(message);

    const prompt = `
You will answer a user question about Daly College using ONLY the official Dalydata.json context.

CONTEXT START
${context || "(No matching context found for this query)"}
CONTEXT END

IMPORTANT:
- If the answer is clearly present in the context, answer briefly but clearly, using the exact names and spellings.
- If the answer is NOT present or is unclear from the context, you MUST reply with:

"I'm sorry, I can only answer questions about Daly College using the official Daly data. For more information, please contact Daly College directly at principal@dalycollege.org or call 0731-2719000."

User question: ${message}
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const reply =
      (result as any)?.response?.text?.() ||
      "I'm sorry, I can only answer questions about Daly College using the official Daly data. For more information, please contact Daly College directly at principal@dalycollege.org or call 0731-2719000.";

    return res.json({ reply });
  } catch (e: any) {
    console.error("❌ Gemini / server error:", e);
    return res
      .status(500)
      .json({ error: "Gemini API error", details: e?.message || String(e) });
  }
});

// -----------------------------
// Start server
// -----------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
