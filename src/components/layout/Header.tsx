import { useDeviceContext } from '@/App'
import { useDevices, useDeviceLatest } from '@/hooks/useBmsData'
import { formatDistanceToNow } from 'date-fns'
import { Wifi, WifiOff, RefreshCw, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header() {
  const { selectedDevice, setSelectedDevice } = useDeviceContext()
  const { data: devices } = useDevices()
  const { data: latest, dataUpdatedAt, isFetching } = useDeviceLatest(selectedDevice)
  const [open, setOpen] = useState(false)

  const device = latest?.[0]
  const now = Date.now()
  const lastSeen = device?.created_at ? new Date(device.created_at).getTime() : 0
  const isOnline = now - lastSeen < 30_000

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm shrink-0">
      {/* Device Selector */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 border border-border rounded-xl px-4 py-2 transition-colors"
        >
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-neon-green shadow-[0_0_8px_#00FF88]' : 'bg-red-500'}`} />
          <span className="font-mono text-sm font-medium">{selectedDevice}</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-card z-50 overflow-hidden"
            >
              {devices?.map(d => (
                <button
                  key={d.device_id}
                  onClick={() => { setSelectedDevice(d.device_id); setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors text-left ${
                    d.device_id === selectedDevice ? 'text-neon-green' : 'text-foreground'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    d.last_seen_at && (Date.now() - new Date(d.last_seen_at).getTime()) < 30_000
                      ? 'bg-neon-green' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-mono font-medium">{d.device_id}</p>
                    <p className="text-muted-foreground text-xs">{d.description ?? 'No description'}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right status */}
      <div className="flex items-center gap-4">
        {/* Last update */}
        {dataUpdatedAt > 0 && (
          <p className="font-mono text-xs text-muted-foreground hidden md:block">
            Updated {formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })}
          </p>
        )}

        {/* Sync indicator */}
        {isFetching && (
          <RefreshCw className="w-4 h-4 text-neon-green animate-spin" />
        )}

        {/* Online badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${
          isOnline
            ? 'bg-neon-green/10 border-neon-green/30 text-neon-green'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>
    </header>
  )
}
