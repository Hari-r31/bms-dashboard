import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend,
} from 'recharts'
import { format } from 'date-fns'
import { useDeviceContext } from '@/App'
import { useHourlyStats } from '@/hooks/useBmsData'
import { ChartCard, SectionHeader, Skeleton } from '@/components/BmsComponents'
import type { TimeRange } from '@/types/supabase'

const RANGES: TimeRange[] = ['1H', '6H', '24H', '7D']

const tooltipStyle = {
  backgroundColor: 'rgba(10,15,28,0.97)',
  border: '1px solid rgba(0,255,136,0.2)',
  borderRadius: 8,
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
}

function formatHour(val: string) {
  try { return format(new Date(val), 'HH:mm') } catch { return val }
}

export default function LiveMonitoring() {
  const { selectedDevice } = useDeviceContext()
  const [range, setRange] = useState<TimeRange>('24H')
  const { data: stats, isLoading } = useHourlyStats(selectedDevice, range)

  const chartData = stats?.map(s => ({
    hour: s.hour,
    voltage: Number(s.avg_voltage),
    maxVoltage: Number(s.max_voltage),
    minVoltage: Number(s.min_voltage),
    current: Number(s.avg_current),
    temp: Number(s.avg_temp),
    maxTemp: Number(s.max_temp),
    soc: Number(s.avg_soc),
    soh: Number(s.avg_soh),
    faults: Number(s.fault_count),
    samples: Number(s.sample_count),
  })) ?? []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader
          title="Live Monitoring"
          subtitle={`${chartData.length} data points · ${range} window`}
        />
        {/* Range selector */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all ${
                range === r
                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : chartData.length === 0 ? (
        <div className="card-glass rounded-2xl p-12 text-center">
          <p className="font-mono text-muted-foreground">No data in selected range</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voltage Chart */}
          <ChartCard title="Pack Voltage" subtitle="Avg / Max / Min (V)">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="voltGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tickFormatter={formatHour} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(3)} V`]} labelFormatter={formatHour} />
                <Area type="monotone" dataKey="maxVoltage" stroke="#00E5FF" strokeWidth={1} strokeDasharray="4 2" fill="none" name="Max V" />
                <Area type="monotone" dataKey="voltage" stroke="#00E5FF" strokeWidth={2} fill="url(#voltGrad)" name="Avg V" />
                <Area type="monotone" dataKey="minVoltage" stroke="#00E5FF" strokeWidth={1} strokeDasharray="4 2" fill="none" name="Min V" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Current Chart */}
          <ChartCard title="Current" subtitle="Avg current flow (A)">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="currGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF88" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00FF88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tickFormatter={formatHour} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(3)} A`]} labelFormatter={formatHour} />
                <Area type="monotone" dataKey="current" stroke="#00FF88" strokeWidth={2} fill="url(#currGrad)" name="Current" />
                <Line type="monotone" dataKey="current" stroke="#00FF88" strokeWidth={0} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Temperature Chart */}
          <ChartCard title="Temperature" subtitle="Avg / Peak (°C)">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB800" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#FFB800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tickFormatter={formatHour} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)} °C`]} labelFormatter={formatHour} />
                <Area type="monotone" dataKey="maxTemp" stroke="#FF3B3B" strokeWidth={1} strokeDasharray="4 2" fill="none" name="Peak °C" />
                <Area type="monotone" dataKey="temp" stroke="#FFB800" strokeWidth={2} fill="url(#tempGrad)" name="Avg °C" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* SOC Chart */}
          <ChartCard title="State of Charge" subtitle="SOC % over time">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tickFormatter={formatHour} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)} %`]} labelFormatter={formatHour} />
                <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11 }} />
                <Line type="monotone" dataKey="soc" stroke="#00FF88" strokeWidth={2} dot={false} name="SOC %" />
                <Line type="monotone" dataKey="soh" stroke="#00E5FF" strokeWidth={2} dot={false} strokeDasharray="6 3" name="SOH %" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Fault count per hour */}
          <ChartCard title="Fault Events" subtitle="Count per hour" className="md:col-span-2">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="faultGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF3B3B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF3B3B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tickFormatter={formatHour} tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} faults`]} labelFormatter={formatHour} />
                <Area type="monotone" dataKey="faults" stroke="#FF3B3B" strokeWidth={2} fill="url(#faultGrad)" name="Faults" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </motion.div>
  )
}
