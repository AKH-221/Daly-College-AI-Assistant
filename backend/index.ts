import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS — allow ALL Vercel domains + localhost
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // mobile apps, curl, etc.

      // Allow any Vercel deployment
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      // Allow localhost for development
      if (origin.includes('localhost')) {
        return callback(null, true);
      }

      // Block everything else
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false
  })
);

// Parse JSON
app.use(express.json());

// Root test route
app.get('/', (_req, res) => {
  res.send('Backend is running and accepts all Vercel URLs ✅');
});

// Main API route for frontend
app.post('/api/chat', (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const reply = `Backend received: "${message}"`;
  res.json({ reply });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT} 🚀`));
