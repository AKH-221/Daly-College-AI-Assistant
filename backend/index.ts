import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS
app.use(cors());
app.use(express.json());

// =========================
// 🔥 SYSTEM PROMPT (YOUR ORIGINAL SYSTEM PROMPT HERE)
// =========================
const SYSTEM_PROMPT = `
You are the Daly College AI Assistant.
You must always answer politely, give accurate information, help students,
and follow school policies. 
You must not give harmful, illegal, or unethical instructions.
Always respond in a helpful, friendly, and respectful tone.
`;

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (_req: Request, res: Response) => {
  res.send("Backend Working ✅");
});

// ===============================
// MAIN CHAT REQUEST HANDLER
// ===============================
async function handleChat(req: Request, res: Response) {
  try {
    const { message, history } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: "Missing 'message' in request body" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY not found in backend environment",
      });
    }

    // ========== Build Gemini Messages ==========
    const contents: any[] = [];

    // Chat history
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (!msg.role || !msg.content) continue;
        contents.push({
          role: msg.role === "user" || msg.role === "model" ? msg.role : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Current user input
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Request body
    const requestBody = {
      contents,
      system_instruction: {
        role: "system",
        parts: [{ text: SYSTEM_PROMPT }],
      },
    };

    // ========== GEMINI API CALL ==========
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      apiKey;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API ERROR:", errorText);
      return res.status(500).json({
        error: "Gemini API request failed",
        details: errorText,
      });
    }

    const data: any = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || "")
        .join("") || "No response from Gemini.";

    return res.json({ reply });
  } catch (err: any) {
    console.error("Server Error:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      details: err.message || String(err),
    });
  }
}

// ===============================
// ENDPOINTS
// ===============================
app.post("/api/chat", handleChat);
app.post("/api/message", handleChat);
app.post("/api/gemini", handleChat);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
