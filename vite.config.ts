import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl  = env.VITE_SUPABASE_URL      ?? ''
  const supabaseKey  = env.VITE_SUPABASE_ANON_KEY ?? ''

  // Headers that must reach Supabase on every proxied request.
  // The Vite proxy runs in Node.js so these are injected server-side —
  // they never get stripped by CORS preflight or browser security policies.
  const supabaseHeaders = supabaseKey
    ? {
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    : {}

  return {
    plugins: [react()],

    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },

    server: {
      host: '::',   // all IPv6 interfaces (dual-stack includes IPv4)
      port: 5173,

      proxy: supabaseUrl
        ? {
            // ── REST API ─────────────────────────────────────────────────
            '/supabase/rest': {
              target:       supabaseUrl,
              changeOrigin: true,
              secure:       true,
              rewrite:      (p) => p.replace(/^\/supabase\/rest/, '/rest'),
              headers:      supabaseHeaders,   // ← inject apikey here
            },
            // ── Auth ─────────────────────────────────────────────────────
            '/supabase/auth': {
              target:       supabaseUrl,
              changeOrigin: true,
              secure:       true,
              rewrite:      (p) => p.replace(/^\/supabase\/auth/, '/auth'),
              headers:      supabaseHeaders,
            },
            // ── Realtime WebSocket ────────────────────────────────────────
            '/supabase/realtime': {
              target:       supabaseUrl.replace('https://', 'wss://'),
              changeOrigin: true,
              secure:       true,
              ws:           true,
              rewrite:      (p) => p.replace(/^\/supabase\/realtime/, '/realtime'),
              headers:      supabaseHeaders,
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
