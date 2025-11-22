import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// Use your Gemini API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ⭐ CHOOSE YOUR MODEL HERE ⭐
// All these models work with the new API:
//
// gemini-2.0-flash
// gemini-2.0-flash-lite
// gemini-2.0-pro-exp
// gemini-1.5-pro
// gemini-1.5-flash
//
const MODEL_NAME = "gemini-2.0-pro-exp";

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: `
You are the Daly College AI Assistant. 
Always give accurate, helpful, polite responses.
Offer step-by-step clarity when needed.
`,
});

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Convert history into API structure
    const contents = history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: msg.parts.map((p: any) => ({ text: p.text })),
    }));

    // Add new user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Generate response
    const response = await model.generateContent({
      contents,
    });

    const reply = response.response?.text() || "";

    return res.json({ reply });
  } catch (err: any) {
    console.error("💥 Server Error:", err);
    res.status(500).json({ error: "Failed to connect to Gemini", details: err });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
