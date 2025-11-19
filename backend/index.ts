import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ✅ Your Vercel frontend domain
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || 'https://daly-college-ai-assistant.vercel.app';

// CORS: allow only your frontend
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false
  })
);

// Parse JSON body
app.use(express.json());

// Health check
app.get('/', (_req, res) => {
  res.send('Daly College backend is running ✅');
});

// ⭐ MAIN ROUTE that your frontend will call
app.post('/api/chat', (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message) {
    return res.status(400).json({ error: 'Missing "message" in request body' });
  }

  // 👉 Here you can later call Gemini or your own logic.
  // For now just echo back something so you can test.
  const reply = `Backend received: "${message}". Frontend ↔ backend connection works ✅`;

  return res.json({ reply });
});

// Port for local dev or hosting (Render/Railway/etc. use process.env.PORT)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
