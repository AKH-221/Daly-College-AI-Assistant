import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// CORS – for now allow everything (simple & safe enough for your use case)
// If you want to restrict later, we can switch to *.vercel.app-only logic.
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check route – just to see if backend is alive
app.get("/", (_req, res) => {
  res.send("Daly College backend is running ✅");
});

/**
 * MAIN ROUTE your frontend must call:
 *   POST /api/chat
 *   Body: { "message": "..." }
 */
app.post("/api/chat", (req, res) => {
  console.log("Received /api/chat request with body:", req.body);

  const { message } = req.body as { message?: string };

  if (!message) {
    return res
      .status(400)
      .json({ error: 'Message is required in request body under key "message"' });
  }

  // For now, just echo back so you can confirm everything works.
  // Later, you can call Gemini here instead.
  const reply = `Backend received: "${message}". Frontend ↔ backend connection works ✅`;

  return res.json({ reply });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
