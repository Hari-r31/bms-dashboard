import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Clock, Zap, Thermometer, Battery } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useDeviceContext } from '@/App'
import { useActiveFaults, useFaultSummary } from '@/hooks/useBmsData'
import { SectionHeader, FaultCard, Skeleton } from '@/components/BmsComponents'

const severityLabel: Record<number, { label: string; color: string; bg: string; border: string }> = {
  4: { label: 'CRITICAL', color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/30' },
  3: { label: 'HIGH',     color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  2: { label: 'MEDIUM',   color: 'text-yellow-400',bg: 'bg-yellow-500/10',border: 'border-yellow-500/30' },
  1: { label: 'INFO',     color: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/30' },
}

export default function Faults() {
  const { selectedDevice } = useDeviceContext()
  const { data: activeFaults, isLoading: loadingActive } = useActiveFaults(selectedDevice)
  const { data: summary, isLoading: loadingSummary } = useFaultSummary(selectedDevice)
  const [severityFilter, setSeverityFilter] = useState<number | null>(null)

  const filteredActive = severityFilter
    ? activeFaults?.filter(f => f.fault_severity === severityFilter)
    : activeFaults

  const filteredSummary = severityFilter
    ? summary?.filter(f => f.fault_severity === severityFilter)
    : summary

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader title="Fault Management" subtitle="Active faults and historical fault analysis" />

        {/* Severity Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setSeverityFilter(null)}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all border ${
              severityFilter === null
                ? 'bg-neon-green/10 text-neon-green border-neon-green/30'
                : 'text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            ALL
          </button>
          {[4, 3, 2, 1].map(s => {
            const cfg = severityLabel[s]
            return (
              <button
                key={s}
                onClick={() => setSeverityFilter(severityFilter === s ? null : s)}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all border ${
                  severityFilter === s
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : 'text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Faults */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-neon-red" />
          <h2 className="font-display text-sm font-bold text-red-400 tracking-wide uppercase">
            Active Faults
          </h2>
          {activeFaults && (
            <span className="font-mono text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
              {activeFaults.length}
            </span>
          )}
        </div>

        {loadingActive ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : filteredActive && filteredActive.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredActive.map(f => (
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
        ) : (
          <div className="card-glass rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-neon-green/10 border border-neon-green/20 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5 text-neon-green" />
            </div>
            <p className="font-mono text-sm text-muted-foreground">No active faults</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">All systems operating normally</p>
          </div>
        )}
      </section>

      {/* Fault History Summary Table */}
      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold text-muted-foreground tracking-wide uppercase">
          Fault History
        </h2>

        {loadingSummary ? (
          <Skeleton className="h-48" />
        ) : filteredSummary && filteredSummary.length > 0 ? (
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Fault Type', 'Severity', 'Occurrences', 'Active', 'Avg Duration', 'Last Seen'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.map((f, i) => {
                    const cfg = severityLabel[f.fault_severity] ?? severityLabel[1]
                    return (
                      <motion.tr
                        key={`${f.fault_type}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-foreground">{f.fault_type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs px-2 py-0.5 rounded border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-display font-bold text-white">{f.total_occurrences}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-sm ${f.currently_active > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {f.currently_active}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-muted-foreground">
                            {f.avg_duration_minutes != null ? `${f.avg_duration_minutes.toFixed(1)}m` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-mono text-xs text-foreground">
                              {format(new Date(f.last_occurred_at), 'MMM d, HH:mm')}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(f.last_occurred_at), { addSuffix: true })}
                            </p>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card-glass rounded-xl p-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">No fault history found</p>
          </div>
        )}
      </section>
    </motion.div>
  )
}
