import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { useDeviceContext } from '@/App'
import { useFaultSummary, useDeviceLatest, useHourlyStats } from '@/hooks/useBmsData'
import { KPICard, ChartCard, SectionHeader, Skeleton } from '@/components/BmsComponents'
import { Upload, AlertTriangle, RefreshCw, Activity } from 'lucide-react'
import { useDevices } from '@/hooks/useBmsData'

const COLORS = ['#FF3B3B', '#FFB800', '#00E5FF', '#00FF88', '#a855f7', '#f97316']

const tooltipStyle = {
  backgroundColor: 'rgba(10,15,28,0.97)',
  border: '1px solid rgba(0,255,136,0.2)',
  borderRadius: 8,
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
}

export default function Analytics() {
  const { selectedDevice } = useDeviceContext()
  const { data: devices } = useDevices()
  const { data: latestArr } = useDeviceLatest(selectedDevice)
  const { data: faultSummary, isLoading: loadingFaults } = useFaultSummary(selectedDevice)
  const { data: hourlyStats } = useHourlyStats(selectedDevice, '24H')

  const d = latestArr?.[0]
  const device = devices?.find(dev => dev.device_id === selectedDevice)

  // Fault frequency pie data
  const pieData = faultSummary?.map(f => ({
    name: f.fault_type.replace(/ /g, '\n'),
    value: f.total_occurrences,
    severity: f.fault_severity,
  })) ?? []

  // Voltage range bar data from hourly stats
  const voltageBarData = hourlyStats?.slice(-12).map(s => ({
    time: new Date(s.hour).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    max: Number(s.max_voltage),
    avg: Number(s.avg_voltage),
    min: Number(s.min_voltage),
  })) ?? []

  // Temp bar data
  const tempBarData = hourlyStats?.slice(-12).map(s => ({
    time: new Date(s.hour).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    avg: Number(s.avg_temp),
    peak: Number(s.max_temp),
  })) ?? []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <SectionHeader title="Analytics" subtitle="Battery health statistics and performance analysis" />

      {/* Summary KPIs from device registry */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Uploads" color="cyan" delay={0.05} icon={<Upload className="w-4 h-4" />}
          value={device?.total_uploads?.toLocaleString() ?? '—'} />
        <KPICard label="Total Faults" color="red" delay={0.1} icon={<AlertTriangle className="w-4 h-4" />}
          value={device?.total_faults?.toLocaleString() ?? '—'} />
        <KPICard label="Charge Cycles" color="green" delay={0.15} icon={<RefreshCw className="w-4 h-4" />}
          value={device?.total_cycles?.toLocaleString() ?? '—'} />
        <KPICard label="RUL Cycles" color="amber" delay={0.2} icon={<Activity className="w-4 h-4" />}
          value={d?.rul_cycles?.toLocaleString() ?? '—'} />
      </div>

      {/* SOH / SOC health indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'State of Charge', value: d?.soc ?? 0, color: d?.soc && d.soc < 20 ? '#FF3B3B' : '#00FF88', unit: '%' },
          { label: 'State of Health', value: d?.soh ?? 0, color: d?.soh && d.soh < 70 ? '#FF3B3B' : '#00E5FF', unit: '%' },
          { label: 'Pack Voltage', value: d?.pack_voltage ?? 0, max: 15, color: '#FFB800', unit: 'V' },
        ].map(({ label, value, color, unit, max = 100 }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card-glass rounded-2xl p-5 space-y-3"
          >
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
            <div className="flex items-end gap-1">
              <span className="font-display text-4xl font-bold" style={{ color }}>
                {typeof value === 'number' ? value.toFixed(1) : value}
              </span>
              <span className="font-mono text-sm text-muted-foreground mb-1">{unit}</span>
            </div>
            {/* Mini progress bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(value / max) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 + i * 0.1 }}
                className="h-full rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fault frequency pie */}
        <ChartCard title="Fault Frequency" subtitle="Distribution by fault type">
          {loadingFaults ? (
            <Skeleton className="h-52" />
          ) : pieData.length === 0 ? (
            <div className="h-52 flex items-center justify-center">
              <p className="font-mono text-sm text-muted-foreground">No faults recorded</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  paddingAngle={3} dataKey="value" nameKey="name"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]}
                      style={{ filter: `drop-shadow(0 0 6px ${COLORS[idx % COLORS.length]})` }}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [v, name.replace('\n', ' ')]} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          {pieData.length > 0 && (
            <div className="grid grid-cols-1 gap-1 mt-2">
              {pieData.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-mono text-[11px] text-muted-foreground truncate">{entry.name.replace('\n', ' ')}</span>
                  <span className="font-mono text-[11px] text-white ml-auto">{entry.value}x</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Voltage range bar */}
        <ChartCard title="Voltage Range" subtitle="Max / Avg / Min over last 12h">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={voltageBarData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(3)} V`]} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
              <Bar dataKey="max" fill="#FF3B3B" name="Max V" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avg" fill="#00E5FF" name="Avg V" radius={[4, 4, 0, 0]} />
              <Bar dataKey="min" fill="#00FF88" name="Min V" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Temperature bar */}
        <ChartCard title="Temperature Analysis" subtitle="Avg vs peak temperature last 12h" className="md:col-span-2">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={tempBarData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} unit="°" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)} °C`]} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 10 }} />
              <Bar dataKey="avg" fill="#FFB800" name="Avg °C" radius={[4, 4, 0, 0]}
                style={{ filter: 'drop-shadow(0 0 4px #FFB800)' }}
              />
              <Bar dataKey="peak" fill="#FF3B3B" name="Peak °C" radius={[4, 4, 0, 0]}
                style={{ filter: 'drop-shadow(0 0 4px #FF3B3B)' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.div>
  )
}
