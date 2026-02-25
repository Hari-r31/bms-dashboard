import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, Battery, Activity, TrendingUp,
} from 'lucide-react'
import { useDeviceContext } from '@/App'
import {
  useDeviceLatest,
  useActiveFaults,
  useRealtimeTelemetry,
} from '@/hooks/useBmsData'
import {
  KPICard,
  StatusBadge,
  SignalStrengthIndicator,
  RadialProgress,
  FaultCard,
  SectionHeader,
  Skeleton,
} from '@/components/BmsComponents'

const MapCard = lazy(() => import('@/components/MapCard'))

export default function Dashboard() {
  const { selectedDevice } = useDeviceContext()
  const { data: latestArr, isLoading } = useDeviceLatest(selectedDevice)
  const { data: faults } = useActiveFaults(selectedDevice)

  // Real-time subscription
  useRealtimeTelemetry(selectedDevice)

  const d = latestArr?.[0]

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Dashboard" subtitle="Loading device data..." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  if (!d) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="font-mono text-muted-foreground">No data available for {selectedDevice}</p>
        <p className="font-mono text-xs text-muted-foreground">Waiting for telemetry...</p>
      </div>
    )
  }

  const socColor = d.soc < 20 ? '#FF3B3B' : d.soc < 40 ? '#FFB800' : '#00FF88'
  const sohColor = d.soh < 70 ? '#FF3B3B' : d.soh < 85 ? '#FFB800' : '#00E5FF'
  const tempColor = d.temp_pack > 50 ? '#FF3B3B' : d.temp_pack > 40 ? '#FFB800' : '#00E5FF'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <SectionHeader
        title="Dashboard"
        subtitle={`Device ${selectedDevice} · Last update ${new Date(d.created_at).toLocaleTimeString()}`}
      />

      {/* Radial KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-glass rounded-2xl p-6 flex flex-wrap justify-around gap-6"
      >
        <RadialProgress value={d.soc} label="SOC" color={socColor} />
        <RadialProgress value={d.soh} label="SOH" color={sohColor} />
        <RadialProgress value={d.temp_pack} max={80} label="Temperature" unit="°C" color={tempColor} />
        <RadialProgress value={d.connection_quality} max={5} label="Signal" unit="/5" color="#00E5FF" />
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Pack Voltage" unit="V" color="cyan" delay={0.05}
          icon={<Zap className="w-4 h-4" />}
          value={d.pack_voltage.toFixed(2)}
        />
        <KPICard label="Current" unit="A" color={d.current < 0 ? 'green' : 'amber'} delay={0.1}
          icon={<Activity className="w-4 h-4" />}
          value={d.current.toFixed(2)}
        />
        <KPICard label="Power" unit="W" color="white" delay={0.15}
          icon={<TrendingUp className="w-4 h-4" />}
          value={d.power.toFixed(1)}
        />
        <KPICard label="RUL" unit="cycles" color="cyan" delay={0.2}
          icon={<Battery className="w-4 h-4" />}
          value={d.rul_cycles}
        />
      </div>

      {/* Status Badges + Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status panel */}
        <div className="card-glass rounded-2xl p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold tracking-wide text-foreground">System Status</h3>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="CHARGING" active={d.is_charging} colorOn="text-neon-green bg-neon-green/10 border-neon-green/30" />
            <StatusBadge label="DISCHARGING" active={d.is_discharging} colorOn="text-cyan-400 bg-cyan-400/10 border-cyan-400/30" />
            <StatusBadge label="COOLING" active={(d.fan_on ?? false) || (d.cooling_active ?? false)} colorOn="text-blue-400 bg-blue-400/10 border-blue-400/30" />
            <StatusBadge label="MOTOR LOAD" active={d.motor_load_on ?? false} colorOn="text-amber-400 bg-amber-400/10 border-amber-400/30" />
            <StatusBadge label="FAULT" active={d.fault} colorOn="text-red-400 bg-red-500/10 border-red-500/40" />
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">Signal Quality</span>
            <SignalStrengthIndicator level={d.connection_quality} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Uptime</p>
              <p className="font-mono text-sm text-white">{Math.floor(d.soh)}%</p>
            </div>
            <div>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Firmware</p>
              <p className="font-mono text-sm text-neon-green">{d.firmware_version}</p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2 card-glass rounded-2xl p-1 overflow-hidden" style={{ minHeight: 240 }}>
          <Suspense fallback={<Skeleton className="w-full h-full rounded-xl" />}>
            <MapCard
              latitude={d.latitude}
              longitude={d.longitude}
              deviceId={selectedDevice}
              fault={d.fault}
            />
          </Suspense>
        </div>
      </div>

      {/* Active Faults */}
      {faults && faults.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold tracking-wide text-red-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400 shadow-neon-red animate-pulse" />
            Active Faults ({faults.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faults.map(f => (
              <FaultCard
                key={f.id}
                faultType={f.fault_type}
                severity={f.fault_severity}
                minutesActive={f.minutes_active}
                voltage={f.pack_voltage}
                temp={f.temp_pack}
                soc={f.soc}
                startedAt={f.fault_started_at}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
