import { motion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import { Cpu, Clock, Upload, AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useDeviceContext } from '@/App'
import { useDevices, useDeviceLatest } from '@/hooks/useBmsData'
import { SectionHeader, Skeleton, StatusBadge } from '@/components/BmsComponents'

function InfoRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`font-mono text-sm font-medium ${accent ? 'text-neon-green' : 'text-foreground'}`}>{value}</span>
    </div>
  )
}

export default function DeviceInfo() {
  const { selectedDevice } = useDeviceContext()
  const { data: devices, isLoading } = useDevices()
  const { data: latestArr } = useDeviceLatest(selectedDevice)

  const device = devices?.find(d => d.device_id === selectedDevice)
  const latest = latestArr?.[0]

  const now = Date.now()
  const lastSeenMs = device?.last_seen_at ? new Date(device.last_seen_at).getTime() : 0
  const isOnline = now - lastSeenMs < 30_000

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Device Info" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="font-mono text-muted-foreground">Device not found: {selectedDevice}</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <SectionHeader title="Device Info" subtitle={`Registry information for ${selectedDevice}`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device identity card */}
        <div className="card-glass rounded-2xl p-6 space-y-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">{device.device_id}</h2>
              <p className="font-mono text-xs text-muted-foreground">{device.description ?? 'No description'}</p>
              <div className="mt-1">
                <StatusBadge
                  label={isOnline ? 'ONLINE' : 'OFFLINE'}
                  active={isOnline}
                  colorOn="text-neon-green bg-neon-green/10 border-neon-green/30"
                  colorOff="text-red-400 bg-red-500/10 border-red-500/30"
                />
              </div>
            </div>
          </div>

          <InfoRow label="Device ID" value={device.device_id} accent />
          <InfoRow label="Firmware Version" value={device.firmware_version} accent />
          <InfoRow label="Created At" value={format(new Date(device.created_at), 'PPP')} />
          <InfoRow
            label="Last Seen"
            value={device.last_seen_at
              ? formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })
              : 'Never'
            }
          />
          <InfoRow
            label="Last Seen At"
            value={device.last_seen_at
              ? format(new Date(device.last_seen_at), 'MMM d, HH:mm:ss')
              : '—'
            }
          />
        </div>

        {/* Statistics card */}
        <div className="card-glass rounded-2xl p-6">
          <h3 className="font-display text-sm font-semibold tracking-wide text-foreground mb-4">Statistics</h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: Upload, label: 'Uploads', value: device.total_uploads.toLocaleString(), color: 'text-neon-cyan' },
              { icon: AlertTriangle, label: 'Faults', value: device.total_faults.toLocaleString(), color: 'text-red-400' },
              { icon: RefreshCw, label: 'Cycles', value: device.total_cycles.toLocaleString(), color: 'text-neon-green' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-secondary/50 rounded-xl p-4 text-center">
                <Icon className={`w-4 h-4 ${color} mx-auto mb-2`} />
                <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
                <p className="font-mono text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {latest && (
            <>
              <h3 className="font-display text-sm font-semibold tracking-wide text-foreground mb-3">Latest Reading</h3>
              <InfoRow label="Pack Voltage" value={`${latest.pack_voltage.toFixed(3)} V`} />
              <InfoRow label="Current" value={`${latest.current.toFixed(3)} A`} />
              <InfoRow label="Temperature" value={`${latest.temp_pack.toFixed(1)} °C`} />
              <InfoRow label="SOC" value={`${latest.soc.toFixed(1)} %`} accent />
              <InfoRow label="SOH" value={`${latest.soh.toFixed(1)} %`} accent />
              <InfoRow label="RUL" value={`${latest.rul_cycles} cycles`} />
              <InfoRow label="Fault Status" value={latest.fault ? `⚠ ${latest.fault_message}` : '✓ Normal'} />
              <InfoRow
                label="Reading Time"
                value={format(new Date(latest.created_at), 'MMM d, HH:mm:ss')}
              />
            </>
          )}
        </div>

        {/* Connection details */}
        <div className="card-glass rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold tracking-wide text-foreground mb-4">
            Connection & Sensors
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'WiFi', value: isOnline ? 'Connected' : 'Disconnected', ok: isOnline, Icon: isOnline ? Wifi : WifiOff },
              { label: 'Signal Quality', value: latest ? `${latest.connection_quality}/5` : '—', ok: (latest?.connection_quality ?? 0) >= 3, Icon: Wifi },
              { label: 'Charging', value: latest?.is_charging ? 'Active' : 'Inactive', ok: !!latest?.is_charging, Icon: RefreshCw },
              { label: 'Fan', value: latest?.fan_on ? 'Running' : 'Stopped', ok: false, Icon: Clock },
            ].map(({ label, value, ok, Icon }) => (
              <div key={label} className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <Icon className={`w-3.5 h-3.5 ${ok ? 'text-neon-green' : 'text-muted-foreground'}`} />
                </div>
                <p className={`font-mono text-sm font-medium ${ok ? 'text-neon-green' : 'text-foreground'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
