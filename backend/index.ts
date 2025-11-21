import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS – currently allow everything
// You can restrict origins later if needed.
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Optional: keep your system prompt in an env variable so you don't
// have to hard-code it here.
// Example in .env:
// SYSTEM_PROMPT="Your existing system prompt text here"
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || "";

// Health check route – just to see if backend is alive
app.get("/", (_req: Request, res: Response) => {
  res.send("Backend is up ✅");
});

// Shared handler for all chat routes
async function handleChat(req: Request, res: Response) {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({
          error:
            'Message is required in request body under key "message" as a string',
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // If key is missing, at least respond gracefully so frontend knows.
      return res.status(500).json({
        error:
          "GEMINI_API_KEY is not set on the server. Please add it to your .env file.",
      });
    }

    // Build Gemini API request body
    // We support optional `history` from frontend if you send it
    const contents: any[] = [];

    if (Array.isArray(history)) {
      for (const msg of history) {
        if (!msg || !msg.role || !msg.content) continue;

        const role =
          msg.role === "user" || msg.role === "model" ? msg.role : "user";

        contents.push({
          role,
          parts: [{ text: String(msg.content) }],
        });
      }
    }

    // Current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Build request body for Gemini
    const body: any = {
      contents,
    };

    // Attach system prompt if you have one
    if (SYSTEM_PROMPT && SYSTEM_PROMPT.trim().length > 0) {
      body.system_instruction = {
        role: "system",
        parts: [{ text: SYSTEM_PROMPT }],
      };
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Gemini API error:", response.status, errorText);
      return res.status(500).json({
        error: "Gemini API request failed",
        status: response.status,
        details: errorText,
      });
    }

    const data: any = await response.json();

    const replyText =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || "")
        .join("") || "Sorry, I couldn't generate a response.";

    return res.json({ reply: replyText });
  } catch (err: any) {
    console.error("Backend error:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err?.message || String(err),
    });
  }
}

// Main chat endpoint – likely what your frontend calls
app.post("/api/chat", handleChat);

// Extra aliases in case your frontend uses a different path
app.post("/api/message", handleChat);
app.post("/api/gemini", handleChat);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
