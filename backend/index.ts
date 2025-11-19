import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

/**
 * CORS – allow:
 *  - Any Vercel deployment (*.vercel.app)
 *  - Localhost (for local testing)
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // No origin (like curl, Postman, mobile apps) → allow
      if (!origin) {
        return callback(null, true);
      }

      // ✅ Allow all Vercel frontend URLs
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // ✅ Allow localhost for development
      if (origin.includes('localhost')) {
        return callback(null, true);
      }

      // ❌ Block everything else
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false
  })
);

// Parse JSON request bodies
app.use(express.json());

/**
 * Simple health-check route
 * Open in browser: GET /
 */
app.get('/', (_req, res) => {
  res.send('Daly College backend is running and accepts all Vercel URLs ✅');
});

/**
 * Main API route that your frontend should call
 * POST /api/chat
 * Body: { "message": "..." }
 */
app.post('/api/chat', (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message) {
    return res.status(400).json({ error: 'Message is required in request body' });
  }

  // 👉 Here you can later call Gemini or other logic.
  // For now just echo back a response so you can test the connection.
  const reply = `Backend received: "${message}". Frontend ↔ backend connection works ✅`;

  return res.json({ reply });
});

// Use PORT from env (for hosting) or 3000 locally
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
