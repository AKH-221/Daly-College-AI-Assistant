import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

/**
 * 🌐 CORS configuration
 * - Allow ALL Vercel URLs: anything that ends with `.vercel.app`
 *   e.g.
 *   https://daly-college-ai-assistant.vercel.app
 *   https://daly-college-ai-assistant-git-main-username.vercel.app
 *   https://some-preview-randomhash.vercel.app
 *
 * - Allow localhost (for local dev)
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, Postman, etc.) with no Origin header
      if (!origin) {
        return callback(null, true);
      }

      // Log origin for debugging
      console.log('[CORS] Incoming origin:', origin);

      // ⭐ Allow all Vercel domains
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // ⭐ Allow localhost dev
      if (origin.includes('localhost')) {
        return callback(null, true);
      }

      // ❌ Block everything else
      return callback(new Error('Not allowed by CORS: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false
  })
);

// Parse JSON bodies
app.use(express.json());

/**
 * Simple health route
 * You can open this in browser to check if backend is alive.
 */
app.get('/', (_req, res) => {
  res.send('Daly College backend is running and accepts all *.vercel.app origins ✅');
});

/**
 * Main API route your frontend calls
 * POST /api/chat
 * Body: { "message": "..." }
 */
app.post('/api/chat', (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message) {
    return res.status(400).json({ error: 'Message is required in request body' });
  }

  // 👉 Here you can plug in Gemini or any other logic.
  // For now, just echo back so you can confirm connection.
  const reply = `Backend received: "${message}". Frontend ↔ backend connection works ✅`;

  return res.json({ reply });
});

// Use PORT from env (hosting) or 3000 locally
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Daly College backend running on port ${PORT}`);
});
