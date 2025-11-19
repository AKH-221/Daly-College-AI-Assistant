import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the current mode (development / production)
  // This reads from .env, .env.local, .env.production, etc.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 5173,          // default Vite port; change if you want
      host: '0.0.0.0'
    },
    plugins: [react()],
    define: {
      // 👇 These lines inline your GEMINI_API_KEY at build time
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // (optional alias, in case some old code uses API_KEY name)
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        // If you import like "@/components/..." you can choose:
        // '@': path.resolve(__dirname, 'src'),
        // but your earlier project used '.' as root, so I keep that:
        '@': path.resolve(__dirname, '.')
      }
    }
  };
});
