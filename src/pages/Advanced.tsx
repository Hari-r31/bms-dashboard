import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench, Shield, MapPin, Plus, Pencil, Trash2, CheckCircle,
  X, AlertTriangle, Calendar, DollarSign, Phone, Mail,
  Navigation, Radio, Clock,
} from 'lucide-react'
import { useDeviceContext } from '@/App'
import { SectionHeader, Skeleton } from '@/components/BmsComponents'
import {
  useMaintenanceLogs, useCreateMaintenance, useUpdateMaintenance, useDeleteMaintenance,
  useWarrantyInfo, useCreateWarranty, useUpdateWarranty, useDeleteWarranty,
  useGeofenceZones, useCreateGeofence, useUpdateGeofence, useDeleteGeofence,
  useGeoAlerts, useResolveGeoAlert, useDeleteGeoAlert,
} from '@/hooks/useBmsData'
import type {
  MaintenanceLog, MaintenanceType,
  WarrantyInfo, WarrantyCoverageType,
  GeofenceZone, GeoAlert,
} from '@/types/supabase'

// ─── Tab Types ─────────────────────────────────────────────────────────────

type Tab = 'maintenance' | 'warranty' | 'geolocation'

// ─── Shared Modal Shell ────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg card-glass rounded-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold tracking-wider text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-neon-green/50 transition-colors'
const selectCls = `${inputCls} cursor-pointer`
const btnPrimary = 'flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 text-neon-green rounded-lg font-mono text-xs hover:bg-neon-green/20 transition-colors'
const btnDanger = 'flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg font-mono text-xs hover:bg-red-500/20 transition-colors'
const btnGhost = 'flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border text-muted-foreground rounded-lg font-mono text-xs hover:text-foreground transition-colors'

// ─────────────────────────────────────────────────────────────────────────────
// MAINTENANCE TAB
// ─────────────────────────────────────────────────────────────────────────────

const MAINTENANCE_TYPES: MaintenanceType[] = [
  'CELL_INSPECTION', 'BMS_CALIBRATION', 'COOLING_SERVICE',
  'CONNECTOR_CHECK', 'FIRMWARE_UPDATE', 'FULL_SERVICE', 'OTHER',
]

type MaintForm = Omit<MaintenanceLog, 'id' | 'created_at'>

function defaultMaintForm(deviceId: string): MaintForm {
  return {
    device_id: deviceId,
    maintenance_type: 'CELL_INSPECTION',
    description: '',
    performed_by: '',
    performed_at: new Date().toISOString().slice(0, 16),
    next_due_at: null,
    cost: null,
    notes: null,
  }
}

function MaintenanceModal({
  deviceId,
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  deviceId: string
  initial?: MaintForm
  onClose: () => void
  onSave: (f: MaintForm) => void
  isSaving: boolean
}) {
  const [form, setForm] = useState<MaintForm>(initial ?? defaultMaintForm(deviceId))
  const set = (k: keyof MaintForm, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  return (
    <Modal title={initial ? 'Edit Maintenance Log' : 'Add Maintenance Log'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Type">
          <select className={selectCls} value={form.maintenance_type}
            onChange={e => set('maintenance_type', e.target.value as MaintenanceType)}>
            {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </Field>
        <Field label="Description">
          <textarea className={inputCls} rows={2} value={form.description}
            onChange={e => set('description', e.target.value)} placeholder="What was done..." />
        </Field>
        <Field label="Performed By">
          <input className={inputCls} value={form.performed_by}
            onChange={e => set('performed_by', e.target.value)} placeholder="Technician name / ID" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Performed At">
            <input type="datetime-local" className={inputCls} value={form.performed_at.slice(0, 16)}
              onChange={e => set('performed_at', e.target.value)} />
          </Field>
          <Field label="Next Due (optional)">
            <input type="datetime-local" className={inputCls} value={form.next_due_at?.slice(0, 16) ?? ''}
              onChange={e => set('next_due_at', e.target.value || null)} />
          </Field>
        </div>
        <Field label="Cost (optional)">
          <input type="number" className={inputCls} value={form.cost ?? ''}
            onChange={e => set('cost', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0.00" />
        </Field>
        <Field label="Notes (optional)">
          <textarea className={inputCls} rows={2} value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value || null)} placeholder="Additional notes..." />
        </Field>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={() => onSave(form)} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

function MaintenanceTab({ deviceId }: { deviceId: string }) {
  const { data: logs, isLoading } = useMaintenanceLogs(deviceId)
  const create = useCreateMaintenance(deviceId)
  const update = useUpdateMaintenance(deviceId)
  const del = useDeleteMaintenance(deviceId)

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; log?: MaintenanceLog } | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)

  function handleSave(form: MaintForm) {
    if (modal?.mode === 'create') {
      create.mutate(form, { onSuccess: () => setModal(null) })
    } else if (modal?.log) {
      update.mutate({ id: modal.log.id, payload: form }, { onSuccess: () => setModal(null) })
    }
  }

  const severityBadge: Record<MaintenanceType, string> = {
    FULL_SERVICE: 'text-neon-green bg-neon-green/10 border-neon-green/30',
    BMS_CALIBRATION: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
    CELL_INSPECTION: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    COOLING_SERVICE: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
    FIRMWARE_UPDATE: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
    CONNECTOR_CHECK: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    OTHER: 'text-muted-foreground bg-secondary/50 border-border',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">{logs?.length ?? 0} records</p>
        <button className={btnPrimary} onClick={() => setModal({ mode: 'create' })}>
          <Plus className="w-3.5 h-3.5" /> Add Log
        </button>
      </div>

      {isLoading && <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}

      {!isLoading && (!logs || logs.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Wrench className="w-10 h-10 opacity-30" />
          <p className="font-mono text-sm">No maintenance logs yet</p>
        </div>
      )}

      <div className="space-y-3">
        {logs?.map(log => (
          <motion.div key={log.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="card-glass rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wider ${severityBadge[log.maintenance_type as MaintenanceType]}`}>
                  {log.maintenance_type.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-sm text-foreground">{log.description}</span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setModal({ mode: 'edit', log })}>
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  onClick={() => setDelConfirm(log.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(log.performed_at).toLocaleDateString()} by <span className="text-cyan-400">{log.performed_by}</span>
              </span>
              {log.next_due_at && (
                <span className="font-mono text-[11px] text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Due: {new Date(log.next_due_at).toLocaleDateString()}
                </span>
              )}
              {log.cost != null && (
                <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> {log.cost.toFixed(2)}
                </span>
              )}
            </div>
            {log.notes && <p className="font-mono text-[11px] text-muted-foreground italic">{log.notes}</p>}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {modal && (
          <MaintenanceModal
            deviceId={deviceId}
            initial={modal.log ? {
              device_id: modal.log.device_id,
              maintenance_type: modal.log.maintenance_type,
              description: modal.log.description,
              performed_by: modal.log.performed_by,
              performed_at: modal.log.performed_at,
              next_due_at: modal.log.next_due_at,
              cost: modal.log.cost,
              notes: modal.log.notes,
            } : undefined}
            onClose={() => setModal(null)}
            onSave={handleSave}
            isSaving={create.isPending || update.isPending}
          />
        )}
        {delConfirm && (
          <Modal title="Delete Maintenance Log?" onClose={() => setDelConfirm(null)}>
            <p className="font-mono text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button className={btnGhost} onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className={btnDanger} onClick={() => del.mutate(delConfirm, { onSuccess: () => setDelConfirm(null) })}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WARRANTY TAB
// ─────────────────────────────────────────────────────────────────────────────

const COVERAGE_TYPES: WarrantyCoverageType[] = [
  'FULL', 'LIMITED', 'CELL_ONLY', 'ELECTRONICS_ONLY', 'LABOR_ONLY',
]

type WarrForm = Omit<WarrantyInfo, 'id' | 'created_at' | 'updated_at'>

function defaultWarrForm(deviceId: string): WarrForm {
  const today = new Date().toISOString().slice(0, 10)
  const nextYear = new Date(Date.now() + 365 * 24 * 3600_000).toISOString().slice(0, 10)
  return {
    device_id: deviceId,
    warranty_provider: '',
    warranty_number: null,
    start_date: today,
    end_date: nextYear,
    coverage_type: 'FULL',
    max_claim_amount: null,
    contact_email: null,
    contact_phone: null,
    notes: null,
  }
}

function WarrantyModal({
  deviceId,
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  deviceId: string
  initial?: WarrForm
  onClose: () => void
  onSave: (f: WarrForm) => void
  isSaving: boolean
}) {
  const [form, setForm] = useState<WarrForm>(initial ?? defaultWarrForm(deviceId))
  const set = (k: keyof WarrForm, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  return (
    <Modal title={initial ? 'Edit Warranty' : 'Add Warranty'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Provider">
          <input className={inputCls} value={form.warranty_provider}
            onChange={e => set('warranty_provider', e.target.value)} placeholder="Provider name" />
        </Field>
        <Field label="Warranty Number (optional)">
          <input className={inputCls} value={form.warranty_number ?? ''}
            onChange={e => set('warranty_number', e.target.value || null)} placeholder="WR-00000" />
        </Field>
        <Field label="Coverage Type">
          <select className={selectCls} value={form.coverage_type}
            onChange={e => set('coverage_type', e.target.value as WarrantyCoverageType)}>
            {COVERAGE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date">
            <input type="date" className={inputCls} value={form.start_date}
              onChange={e => set('start_date', e.target.value)} />
          </Field>
          <Field label="End Date">
            <input type="date" className={inputCls} value={form.end_date}
              onChange={e => set('end_date', e.target.value)} />
          </Field>
        </div>
        <Field label="Max Claim Amount (optional)">
          <input type="number" className={inputCls} value={form.max_claim_amount ?? ''}
            onChange={e => set('max_claim_amount', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0.00" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact Email">
            <input className={inputCls} value={form.contact_email ?? ''}
              onChange={e => set('contact_email', e.target.value || null)} placeholder="support@..." />
          </Field>
          <Field label="Contact Phone">
            <input className={inputCls} value={form.contact_phone ?? ''}
              onChange={e => set('contact_phone', e.target.value || null)} placeholder="+91..." />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea className={inputCls} rows={2} value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value || null)} />
        </Field>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={() => onSave(form)} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

function WarrantyTab({ deviceId }: { deviceId: string }) {
  const { data: warranties, isLoading } = useWarrantyInfo(deviceId)
  const create = useCreateWarranty(deviceId)
  const update = useUpdateWarranty(deviceId)
  const del = useDeleteWarranty(deviceId)

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; w?: WarrantyInfo } | null>(null)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)

  function handleSave(form: WarrForm) {
    if (modal?.mode === 'create') {
      create.mutate(form, { onSuccess: () => setModal(null) })
    } else if (modal?.w) {
      update.mutate({ id: modal.w.id, payload: form }, { onSuccess: () => setModal(null) })
    }
  }

  function warrantyStatus(endDate: string) {
    const diff = new Date(endDate).getTime() - Date.now()
    const days = Math.floor(diff / 86_400_000)
    if (days < 0) return { label: 'EXPIRED', cls: 'text-red-400 bg-red-500/10 border-red-500/30' }
    if (days <= 30) return { label: `${days}d left`, cls: 'text-amber-400 bg-amber-400/10 border-amber-400/30' }
    return { label: 'ACTIVE', cls: 'text-neon-green bg-neon-green/10 border-neon-green/30' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">{warranties?.length ?? 0} records</p>
        <button className={btnPrimary} onClick={() => setModal({ mode: 'create' })}>
          <Plus className="w-3.5 h-3.5" /> Add Warranty
        </button>
      </div>

      {isLoading && <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>}

      {!isLoading && (!warranties || warranties.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Shield className="w-10 h-10 opacity-30" />
          <p className="font-mono text-sm">No warranty records yet</p>
        </div>
      )}

      <div className="space-y-3">
        {warranties?.map(w => {
          const status = warrantyStatus(w.end_date)
          return (
            <motion.div key={w.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="card-glass rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold text-foreground">{w.warranty_provider}</span>
                    <span className={`px-2 py-0.5 rounded-full border font-mono text-[10px] ${status.cls}`}>{status.label}</span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">{w.coverage_type.replace(/_/g, ' ')} coverage</p>
                </div>
                <div className="flex gap-1.5">
                  <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setModal({ mode: 'edit', w })}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                    onClick={() => setDelConfirm(w.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border">
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Start</p>
                  <p className="font-mono text-xs text-foreground">{new Date(w.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">End</p>
                  <p className="font-mono text-xs text-foreground">{new Date(w.end_date).toLocaleDateString()}</p>
                </div>
                {w.max_claim_amount != null && (
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Max Claim</p>
                    <p className="font-mono text-xs text-foreground">₹{w.max_claim_amount.toLocaleString()}</p>
                  </div>
                )}
                {w.warranty_number && (
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Ref No.</p>
                    <p className="font-mono text-xs text-cyan-400">{w.warranty_number}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {w.contact_email && (
                  <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {w.contact_email}
                  </span>
                )}
                {w.contact_phone && (
                  <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {w.contact_phone}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {modal && (
          <WarrantyModal
            deviceId={deviceId}
            initial={modal.w ? {
              device_id: modal.w.device_id,
              warranty_provider: modal.w.warranty_provider,
              warranty_number: modal.w.warranty_number,
              start_date: modal.w.start_date,
              end_date: modal.w.end_date,
              coverage_type: modal.w.coverage_type,
              max_claim_amount: modal.w.max_claim_amount,
              contact_email: modal.w.contact_email,
              contact_phone: modal.w.contact_phone,
              notes: modal.w.notes,
            } : undefined}
            onClose={() => setModal(null)}
            onSave={handleSave}
            isSaving={create.isPending || update.isPending}
          />
        )}
        {delConfirm && (
          <Modal title="Delete Warranty?" onClose={() => setDelConfirm(null)}>
            <p className="font-mono text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button className={btnGhost} onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className={btnDanger} onClick={() => del.mutate(delConfirm, { onSuccess: () => setDelConfirm(null) })}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GEO-LOCATION TAB
// ─────────────────────────────────────────────────────────────────────────────

type GeoMode = 'zones' | 'alerts'

type ZoneForm = Omit<GeofenceZone, 'id' | 'created_at'>

function defaultZoneForm(deviceId: string): ZoneForm {
  return {
    device_id: deviceId,
    name: '',
    center_lat: 17.385,
    center_lng: 78.4867,
    radius_meters: 500,
    is_active: true,
  }
}

function GeofenceModal({
  deviceId,
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  deviceId: string
  initial?: ZoneForm
  onClose: () => void
  onSave: (f: ZoneForm) => void
  isSaving: boolean
}) {
  const [form, setForm] = useState<ZoneForm>(initial ?? defaultZoneForm(deviceId))
  const set = (k: keyof ZoneForm, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  return (
    <Modal title={initial ? 'Edit Geofence Zone' : 'Add Geofence Zone'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Zone Name">
          <input className={inputCls} value={form.name}
            onChange={e => set('name', e.target.value)} placeholder="e.g. Warehouse, Depot A" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Center Latitude">
            <input type="number" step="any" className={inputCls} value={form.center_lat}
              onChange={e => set('center_lat', parseFloat(e.target.value))} />
          </Field>
          <Field label="Center Longitude">
            <input type="number" step="any" className={inputCls} value={form.center_lng}
              onChange={e => set('center_lng', parseFloat(e.target.value))} />
          </Field>
        </div>
        <Field label="Radius (meters)">
          <input type="number" className={inputCls} value={form.radius_meters}
            onChange={e => set('radius_meters', parseInt(e.target.value))} />
        </Field>
        <div className="flex items-center gap-3 pt-1">
          <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Active</label>
          <button
            onClick={() => set('is_active', !form.is_active)}
            className={`relative w-10 h-5 rounded-full border transition-colors ${form.is_active ? 'bg-neon-green/20 border-neon-green/40' : 'bg-secondary border-border'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${form.is_active ? 'left-5 bg-neon-green' : 'left-0.5 bg-muted-foreground'}`} />
          </button>
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={() => onSave(form)} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  )
}

const ALERT_TYPE_COLORS: Record<string, string> = {
  GEOFENCE_EXIT: 'text-red-400 bg-red-500/10 border-red-500/30',
  GEOFENCE_ENTRY: 'text-neon-green bg-neon-green/10 border-neon-green/30',
  UNUSUAL_MOVEMENT: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  RAPID_DISPLACEMENT: 'text-red-400 bg-red-500/10 border-red-500/30',
  STATIONARY_TIMEOUT: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
}

function GeoLocationTab({ deviceId }: { deviceId: string }) {
  const [geoMode, setGeoMode] = useState<GeoMode>('alerts')

  const { data: zones, isLoading: zonesLoading } = useGeofenceZones(deviceId)
  const { data: alerts, isLoading: alertsLoading } = useGeoAlerts(deviceId)
  const createZone = useCreateGeofence(deviceId)
  const updateZone = useUpdateGeofence(deviceId)
  const deleteZone = useDeleteGeofence(deviceId)
  const resolveAlert = useResolveGeoAlert(deviceId)
  const deleteAlert = useDeleteGeoAlert(deviceId)

  const [zoneModal, setZoneModal] = useState<{ mode: 'create' | 'edit'; zone?: GeofenceZone } | null>(null)
  const [delZone, setDelZone] = useState<string | null>(null)
  const [delAlert, setDelAlert] = useState<string | null>(null)

  function handleSaveZone(form: ZoneForm) {
    if (zoneModal?.mode === 'create') {
      createZone.mutate(form, { onSuccess: () => setZoneModal(null) })
    } else if (zoneModal?.zone) {
      updateZone.mutate({ id: zoneModal.zone.id, payload: form }, { onSuccess: () => setZoneModal(null) })
    }
  }

  const unresolvedCount = alerts?.filter(a => !a.is_resolved).length ?? 0

  return (
    <div className="space-y-4">
      {/* Sub-tab */}
      <div className="flex gap-1 p-1 bg-secondary/30 rounded-xl w-fit">
        {(['alerts', 'zones'] as GeoMode[]).map(m => (
          <button key={m} onClick={() => setGeoMode(m)}
            className={`px-4 py-1.5 rounded-lg font-mono text-xs capitalize transition-all ${geoMode === m ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'text-muted-foreground hover:text-foreground'}`}>
            {m === 'alerts' ? `Alerts${unresolvedCount ? ` (${unresolvedCount})` : ''}` : 'Zones'}
          </button>
        ))}
      </div>

      {/* Zones */}
      {geoMode === 'zones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">{zones?.length ?? 0} zones configured</p>
            <button className={btnPrimary} onClick={() => setZoneModal({ mode: 'create' })}>
              <Plus className="w-3.5 h-3.5" /> Add Zone
            </button>
          </div>
          {zonesLoading && <Skeleton className="h-24" />}
          {!zonesLoading && (!zones || zones.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Navigation className="w-10 h-10 opacity-30" />
              <p className="font-mono text-sm">No geofence zones defined</p>
              <p className="font-mono text-xs opacity-60">Add zones to enable theft detection alerts</p>
            </div>
          )}
          <div className="space-y-3">
            {zones?.map(z => (
              <motion.div key={z.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card-glass rounded-xl p-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${z.is_active ? 'bg-neon-green/10 border border-neon-green/30' : 'bg-secondary border border-border'}`}>
                  <Radio className={`w-4 h-4 ${z.is_active ? 'text-neon-green' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold text-foreground truncate">{z.name}</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${z.is_active ? 'text-neon-green' : 'text-muted-foreground'}`}>
                      {z.is_active ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {z.center_lat.toFixed(4)}, {z.center_lng.toFixed(4)} · r={z.radius_meters}m
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setZoneModal({ mode: 'edit', zone: z })}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                    onClick={() => setDelZone(z.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {geoMode === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              {unresolvedCount} unresolved · {alerts?.length ?? 0} total
            </p>
          </div>
          {alertsLoading && <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>}
          {!alertsLoading && (!alerts || alerts.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <MapPin className="w-10 h-10 opacity-30" />
              <p className="font-mono text-sm">No geo-alerts recorded</p>
            </div>
          )}
          <div className="space-y-3">
            {alerts?.map((a: GeoAlert) => {
              const colorCls = ALERT_TYPE_COLORS[a.alert_type] ?? 'text-muted-foreground bg-secondary/50 border-border'
              return (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`card-glass rounded-xl p-4 space-y-2 ${a.is_resolved ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!a.is_resolved && <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />}
                      <span className={`px-2 py-0.5 rounded-full border font-mono text-[10px] uppercase tracking-wider ${colorCls}`}>
                        {a.alert_type.replace(/_/g, ' ')}
                      </span>
                      {a.is_resolved && <span className="font-mono text-[10px] text-neon-green flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</span>}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {!a.is_resolved && (
                        <button className="p-1.5 rounded-lg hover:bg-neon-green/10 text-muted-foreground hover:text-neon-green transition-colors"
                          title="Mark Resolved"
                          onClick={() => resolveAlert.mutate(a.id)}>
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                        onClick={() => setDelAlert(a.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {a.latitude.toFixed(5)}, {a.longitude.toFixed(5)}
                    </span>
                    {a.speed_kmh != null && (
                      <span className="font-mono text-[11px] text-amber-400 flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> {a.speed_kmh.toFixed(1)} km/h
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(a.triggered_at).toLocaleString()}
                    </span>
                    {a.geofence_zone_name && (
                      <span className="font-mono text-[11px] text-cyan-400 flex items-center gap-1">
                        <Radio className="w-3 h-3" /> {a.geofence_zone_name}
                      </span>
                    )}
                  </div>
                  {a.notes && <p className="font-mono text-[11px] text-muted-foreground italic">{a.notes}</p>}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {zoneModal && (
          <GeofenceModal
            deviceId={deviceId}
            initial={zoneModal.zone ? {
              device_id: zoneModal.zone.device_id,
              name: zoneModal.zone.name,
              center_lat: zoneModal.zone.center_lat,
              center_lng: zoneModal.zone.center_lng,
              radius_meters: zoneModal.zone.radius_meters,
              is_active: zoneModal.zone.is_active,
            } : undefined}
            onClose={() => setZoneModal(null)}
            onSave={handleSaveZone}
            isSaving={createZone.isPending || updateZone.isPending}
          />
        )}
        {delZone && (
          <Modal title="Delete Geofence Zone?" onClose={() => setDelZone(null)}>
            <p className="font-mono text-sm text-muted-foreground">All associated alerts will remain but zone link will be lost.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button className={btnGhost} onClick={() => setDelZone(null)}>Cancel</button>
              <button className={btnDanger} onClick={() => deleteZone.mutate(delZone, { onSuccess: () => setDelZone(null) })}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </Modal>
        )}
        {delAlert && (
          <Modal title="Delete Geo Alert?" onClose={() => setDelAlert(null)}>
            <p className="font-mono text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button className={btnGhost} onClick={() => setDelAlert(null)}>Cancel</button>
              <button className={btnDanger} onClick={() => deleteAlert.mutate(delAlert, { onSuccess: () => setDelAlert(null) })}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT PAGE
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, desc: 'Service logs & schedules' },
  { id: 'warranty',   label: 'Warranty',    icon: Shield, desc: 'Coverage & expiry tracking' },
  { id: 'geolocation',label: 'Geo & Theft', icon: MapPin, desc: 'Geofencing & alerts' },
]

export default function Advanced() {
  const { selectedDevice } = useDeviceContext()
  const [tab, setTab] = useState<Tab>('maintenance')
  const Active = TABS.find(t => t.id === tab)!

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl">
      <SectionHeader
        title="Advanced Features"
        subtitle={`Device ${selectedDevice} · Maintenance, Warranty & Geo-Security`}
      />

      {/* Tab nav */}
      <div className="grid grid-cols-3 gap-3">
        {TABS.map(({ id, label, icon: Icon, desc }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`card-glass rounded-xl p-4 text-left transition-all border ${tab === id ? 'border-neon-green/30 bg-neon-green/5' : 'border-transparent hover:border-border'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${tab === id ? 'text-neon-green' : 'text-muted-foreground'}`} />
              <span className={`font-display text-sm font-semibold ${tab === id ? 'text-neon-green' : 'text-foreground'}`}>{label}</span>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground hidden sm:block">{desc}</p>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card-glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Active.icon className="w-4 h-4 text-neon-green" />
          <span className="font-display text-sm font-semibold text-foreground">{Active.label}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
            {tab === 'maintenance'  && <MaintenanceTab  deviceId={selectedDevice} />}
            {tab === 'warranty'     && <WarrantyTab     deviceId={selectedDevice} />}
            {tab === 'geolocation'  && <GeoLocationTab  deviceId={selectedDevice} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
