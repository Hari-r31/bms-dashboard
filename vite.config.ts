import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env vars so we can read VITE_SUPABASE_URL at config time
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL ?? ''

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      // Bind to all IPv6 interfaces (dual-stack covers IPv4 too)
      host: '::',
      port: 5173,

      proxy: supabaseUrl
        ? {
            // ── REST API ──────────────────────────────────────────────────
            // Browser hits /supabase/rest/... → Vite Node.js proxies to
            // Supabase. Node resolves DNS on the server side, not in the
            // browser, so IPv4 addresses are reachable even on IPv6-only networks.
            '/supabase/rest': {
              target: supabaseUrl,
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/supabase\/rest/, '/rest'),
              secure: true,
            },
            // ── Auth ──────────────────────────────────────────────────────
            '/supabase/auth': {
              target: supabaseUrl,
              changeOrigin: true,
              rewrite: (p) => p.replace(/^\/supabase\/auth/, '/auth'),
              secure: true,
            },
            // ── Realtime WebSocket ─────────────────────────────────────────
            '/supabase/realtime': {
              target: supabaseUrl.replace('https://', 'wss://'),
              changeOrigin: true,
              ws: true,
              rewrite: (p) => p.replace(/^\/supabase\/realtime/, '/realtime'),
              secure: true,
            },
          }
        : {},
    },

    preview: {
      host: '::',
      port: 4173,
    },
  }
})
