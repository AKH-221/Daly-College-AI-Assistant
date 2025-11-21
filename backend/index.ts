import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

// ================== CONFIG ==================
const FRONTEND_ORIGIN = "http://localhost:5173"; // Vite frontend
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not set in .env file");
}

// ======= (OPTIONAL) SYSTEM PROMPT ===========
// 👉 IMPORTANT: paste your EXISTING system prompt text here,
// so behaviour stays exactly the same as before.
const SYSTEM_PROMPT = `
You are Daly College AI Assistant. Answer clearly and helpfully...
(Replace this text with your original system prompt)
`;

// ================ MIDDLEWARE ================
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// ================ GEMINI SETUP ==============
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

// ================ ROUTES ====================

// Simple health-check so you can test backend directly
app.get("/", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    message: "Backend is running ✅",
  });
});

// Main chat endpoint your frontend should call
// e.g. POST http://localhost:8080/api/chat
// body: { message: string, history?: {role: string, content: string}[] }
app.post(
  "/api/chat",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, history } = req.body as {
        message?: string;
        history?: { role: string; content: string }[];
      };

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing 'message' in body" });
      }

      // Build conversation context using system prompt + history + user message
      const conversationParts = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        ...(history || []).map((h) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      const result = await model.generateContent({
        contents: conversationParts,
      });

      const responseText =
        result.response
          ?.candidates?.[0]
          ?.content?.parts?.map((p) => (p as any).text || "")
          .join("") || "";

      if (!responseText) {
        return res.status(500).json({
          error: "Empty response from Gemini",
        });
      }

      return res.json({
        reply: responseText,
      });
    } catch (err) {
      console.error("💥 Error in /api/chat:", err);
      return next(err);
    }
  }
);

// =========== GLOBAL ERROR HANDLER ===========
app.use(
  (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("💥 Server Error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err?.message || String(err),
    });
  }
);

// ================ START SERVER =================
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
