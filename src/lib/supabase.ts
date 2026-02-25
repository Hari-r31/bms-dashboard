import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example → .env and fill in your keys.'
  )
}

// ─── IPv6 / Proxy strategy ────────────────────────────────────────────────
//
// Problem: browser on IPv6-only network → Supabase returns only A records
//          (IPv4) → ERR_CONNECTION_TIMED_OUT.
//
// Solution: In development, Vite proxies all Supabase traffic through the
// Node.js process. Node resolves DNS separately and can reach IPv4 addresses
// even when the browser network interface is IPv6-only.
//
// How it works:
//   Browser fetch("https://xxx.supabase.co/rest/v1/...")
//     → intercepted by proxyFetch below
//     → rewritten to  fetch("/supabase/rest/v1/...")   (same origin)
//     → Vite dev server forwards to xxx.supabase.co    (Node DNS, works!)
//
// Realtime WS similarly connects to /supabase/realtime/v1 which Vite
// proxies (ws: true) to wss://xxx.supabase.co/realtime/v1.
//
// In production: set VITE_USE_PROXY=false and handle IPv6 via your CDN/
// reverse proxy, or enable IPv6 in Supabase Dashboard > Settings > Database.

const isDev = import.meta.env.DEV

// Build a custom fetch that rewrites Supabase URLs to local proxy paths
function makeProxyFetch(realSupabaseUrl: string): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    if (url.startsWith(realSupabaseUrl)) {
      // Replace https://xxx.supabase.co/rest/...     → /supabase/rest/...
      // Replace https://xxx.supabase.co/auth/...     → /supabase/auth/...
      // (Realtime WebSocket is handled separately via the Vite ws proxy)
      const relativePath = url.slice(realSupabaseUrl.length)  // e.g. "/rest/v1/bms_devices?..."
      const proxied = `/supabase${relativePath}`

      if (typeof input === 'string') {
        return fetch(proxied, init)
      } else if (input instanceof URL) {
        return fetch(new URL(proxied, window.location.origin), init)
      } else {
        // Request object
        return fetch(new Request(proxied, input), init)
      }
    }

    // Non-Supabase URLs pass through unchanged
    return fetch(input, init)
  }
}

// Local WebSocket URL for Realtime through the Vite proxy
// e.g. ws://[::1]:5173/supabase/realtime/v1
const localWsBase = isDev
  ? `${window.location.origin.replace('http', 'ws')}/supabase/realtime/v1`
  : undefined

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    // In dev: rewrite all REST/Auth fetches through Vite proxy
    fetch: isDev ? makeProxyFetch(supabaseUrl) : undefined,
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
    // In dev: connect Realtime WS through Vite's ws proxy
    ...(localWsBase ? { url: localWsBase } : {}),
  },
})

// ─── Dev connection test ──────────────────────────────────────────────────
if (isDev) {
  supabase
    .from('bms_devices')
    .select('device_id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('[Supabase] ❌ Connection failed:', error.message)
        console.info('[Supabase] Check your .env keys and that the Vite dev server is running')
      } else {
        console.log(
          `[Supabase] ✅ Connected via Vite proxy (IPv6-safe). Devices: ${data?.length ?? 0}`
        )
      }
    })
}
