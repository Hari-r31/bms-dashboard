// ─── KPI Card ─────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface KPICardProps {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  color?: 'green' | 'cyan' | 'amber' | 'red' | 'white'
  trend?: 'up' | 'down' | 'stable'
  delay?: number
  children?: ReactNode
}

export function KPICard({ label, value, unit, icon, color = 'white', delay = 0, children }: KPICardProps) {
  const colorMap = {
    green: 'text-neon-green',
    cyan: 'text-neon-cyan',
    amber: 'text-amber-400',
    red: 'text-red-400',
    white: 'text-white',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card-glass rounded-2xl p-5 flex flex-col gap-3 hover:border-neon-green/20 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      {children ?? (
        <div className={`font-display font-bold ${colorMap[color]}`}>
          <span className="text-3xl">{value}</span>
          {unit && <span className="text-sm ml-1 font-mono text-muted-foreground">{unit}</span>}
        </div>
      )}
    </motion.div>
  )
}

// ─── Status Badge ──────────────────────────────────────────────────────────

interface StatusBadgeProps {
  label: string
  active: boolean
  colorOn?: string
  colorOff?: string
}

export function StatusBadge({ label, active, colorOn = 'text-neon-green bg-neon-green/10 border-neon-green/30', colorOff = 'text-muted-foreground bg-secondary border-border' }: StatusBadgeProps) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${active ? colorOn : colorOff}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-current' : 'bg-muted-foreground'} ${active ? 'shadow-[0_0_6px_currentColor]' : ''}`} />
      {label}
    </div>
  )
}

// ─── Signal Strength ───────────────────────────────────────────────────────

export function SignalStrengthIndicator({ level }: { level: number }) {
  const bars = [1, 2, 3, 4, 5]
  const colors = level >= 4 ? '#00FF88' : level >= 2 ? '#FFB800' : '#FF3B3B'

  return (
    <div className="flex items-end gap-0.5 h-5">
      {bars.map(b => (
        <div
          key={b}
          style={{
            height: `${b * 20}%`,
            backgroundColor: b <= level ? colors : 'rgba(255,255,255,0.1)',
            boxShadow: b <= level ? `0 0 4px ${colors}` : 'none',
            transition: 'all 0.3s ease',
          }}
          className="w-2 rounded-sm"
        />
      ))}
    </div>
  )
}

// ─── Radial Progress ──────────────────────────────────────────────────────

interface RadialProgressProps {
  value: number
  max?: number
  size?: number
  label: string
  unit?: string
  color?: string
}

export function RadialProgress({ value, max = 100, size = 120, label, unit = '%', color = '#00FF88' }: RadialProgressProps) {
  const r = 45
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const pct = Math.min(Math.max(value / max, 0), 1)
  const dashoffset = circumference * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress */}
          <motion.circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-xl" style={{ color }}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ─── Chart Card ────────────────────────────────────────────────────────────

interface ChartCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function ChartCard({ title, subtitle, children, className = '', action }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`card-glass rounded-2xl p-5 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground tracking-wide">{title}</h3>
          {subtitle && <p className="font-mono text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  )
}

// ─── Fault Card ────────────────────────────────────────────────────────────

interface FaultCardProps {
  faultType: string
  severity: number
  minutesActive: number
  voltage?: number | null
  temp?: number | null
  soc?: number | null
  startedAt: string
}

const severityConfig = {
  4: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', label: 'CRITICAL', animate: true },
  3: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'HIGH', animate: false },
  2: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'MEDIUM', animate: false },
  1: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'INFO', animate: false },
}

export function FaultCard({ faultType, severity, minutesActive, voltage, temp, soc, startedAt }: FaultCardProps) {
  const cfg = severityConfig[severity as keyof typeof severityConfig] ?? severityConfig[1]

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border} ${cfg.animate ? 'animate-[faultFlash_1.5s_ease-in-out_infinite]' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
              {cfg.label}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {Math.floor(minutesActive)}m active
            </span>
          </div>
          <p className={`font-display text-sm font-semibold ${cfg.color}`}>{faultType}</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Started {new Date(startedAt).toLocaleTimeString()}
          </p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          {voltage != null && (
            <p className="font-mono text-xs"><span className="text-muted-foreground">V:</span> <span className="text-white">{voltage.toFixed(2)}</span></p>
          )}
          {temp != null && (
            <p className="font-mono text-xs"><span className="text-muted-foreground">T:</span> <span className="text-white">{temp.toFixed(1)}°C</span></p>
          )}
          {soc != null && (
            <p className="font-mono text-xs"><span className="text-muted-foreground">SOC:</span> <span className="text-white">{soc.toFixed(1)}%</span></p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-secondary rounded-lg ${className}`} />
  )
}

// ─── Section Header ───────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-xl font-bold text-white tracking-wide">{title}</h1>
      {subtitle && <p className="font-mono text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}
