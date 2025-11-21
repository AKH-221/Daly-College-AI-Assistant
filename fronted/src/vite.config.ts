import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig(({ mode }) => {
  // Load env vars for the current mode (development / production)
  // This reads from .env, .env.local, .env.production, etc.
  const env = loadEnv(mode, process.cwd(), '');

  const geminiKey = env.VITE_GEMINI_API_KEY;

  return {
    server: {
      port: 5173,   // your frontend runs here
      host: '0.0.0.0'
    },
    plugins: [react()],
    define: {
      // 👇 This is what geminiService.ts reads
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      // Optional alias if anything else uses API_KEY
      'process.env.API_KEY': JSON.stringify(geminiKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    }
  };
});
