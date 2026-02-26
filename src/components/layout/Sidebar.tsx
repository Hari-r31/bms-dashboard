import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  BarChart3,
  Cpu,
  Zap,
  Layers,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/monitoring', icon: Activity,        label: 'Live Monitor' },
  { to: '/faults',     icon: AlertTriangle,   label: 'Faults' },
  { to: '/analytics',  icon: BarChart3,       label: 'Analytics' },
  { to: '/device',     icon: Cpu,             label: 'Device Info' },
  { to: '/advanced',   icon: Layers,          label: 'Advanced' },
]

export default function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -64, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-16 lg:w-60 flex flex-col bg-card border-r border-border shrink-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-neon-green" />
          </div>
          <div className="hidden lg:block">
            <p className="font-display text-xs font-bold text-neon-green tracking-widest uppercase">BMS</p>
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider">Control Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-neon-green/10 text-neon-green border border-neon-green/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-neon-green rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-neon-green' : ''}`} />
                <span className="hidden lg:block text-sm font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border hidden lg:block">
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">System</p>
          <p className="font-mono text-xs text-neon-green mt-0.5">● Online</p>
        </div>
      </div>
    </motion.aside>
  )
}
