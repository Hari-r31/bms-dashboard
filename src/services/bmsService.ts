import { supabase } from '@/lib/supabase'
import type {
  DeviceLatest,
  HourlyStat,
  ActiveFault,
  FaultSummary,
  BmsDevice,
  BmsTelemetry,
  TimeRange,
} from '@/types/supabase'
import { subHours, subDays } from 'date-fns'

// ─── Devices ───────────────────────────────────────────────────────────────

export async function fetchDevices(): Promise<BmsDevice[]> {
  const { data, error } = await supabase
    .from('bms_devices')
    .select('*')
    .order('last_seen_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ─── Latest snapshot per device ───────────────────────────────────────────

export async function fetchDeviceLatest(deviceId?: string): Promise<DeviceLatest[]> {
  let query = supabase.from('vw_device_latest').select('*')
  if (deviceId) query = query.eq('device_id', deviceId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ─── Hourly stats with time range ─────────────────────────────────────────

export async function fetchHourlyStats(deviceId: string, range: TimeRange): Promise<HourlyStat[]> {
  const now = new Date()
  let from: Date

  switch (range) {
    case '1H':  from = subHours(now, 1);  break
    case '6H':  from = subHours(now, 6);  break
    case '24H': from = subHours(now, 24); break
    case '7D':  from = subDays(now, 7);   break
  }

  const { data, error } = await supabase
    .from('vw_hourly_stats')
    .select('*')
    .eq('device_id', deviceId)
    .gte('hour', from.toISOString())
    .order('hour', { ascending: true })

  if (error) throw error
  return data ?? []
}

// ─── Active faults ─────────────────────────────────────────────────────────

export async function fetchActiveFaults(deviceId?: string): Promise<ActiveFault[]> {
  let query = supabase.from('vw_active_faults').select('*').order('fault_severity', { ascending: false })
  if (deviceId) query = query.eq('device_id', deviceId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ─── Fault summary ─────────────────────────────────────────────────────────

export async function fetchFaultSummary(deviceId?: string): Promise<FaultSummary[]> {
  let query = supabase
    .from('vw_fault_summary')
    .select('*')
    .order('total_occurrences', { ascending: false })
  if (deviceId) query = query.eq('device_id', deviceId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ─── Raw telemetry for sparklines ─────────────────────────────────────────

export async function fetchRecentTelemetry(deviceId: string, limit = 60): Promise<BmsTelemetry[]> {
  const { data, error } = await supabase
    .from('bms_telemetry')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).reverse()
}

// ─── Maintenance Tracking ────────────────────────────────────────────────────

export async function fetchMaintenanceLogs(deviceId: string) {
  const { data, error } = await supabase
    .from('bms_maintenance_logs')
    .select('*')
    .eq('device_id', deviceId)
    .order('performed_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createMaintenanceLog(payload: Omit<import('@/types/supabase').MaintenanceLog, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('bms_maintenance_logs').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateMaintenanceLog(id: string, payload: Partial<import('@/types/supabase').MaintenanceLog>) {
  const { data, error } = await supabase.from('bms_maintenance_logs').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteMaintenanceLog(id: string) {
  const { error } = await supabase.from('bms_maintenance_logs').delete().eq('id', id)
  if (error) throw error
}

// ─── Warranty Management ──────────────────────────────────────────────────────

export async function fetchWarrantyInfo(deviceId: string) {
  const { data, error } = await supabase
    .from('bms_warranty_info')
    .select('*')
    .eq('device_id', deviceId)
    .order('start_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createWarrantyInfo(payload: Omit<import('@/types/supabase').WarrantyInfo, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('bms_warranty_info').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateWarrantyInfo(id: string, payload: Partial<import('@/types/supabase').WarrantyInfo>) {
  const { data, error } = await supabase.from('bms_warranty_info').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteWarrantyInfo(id: string) {
  const { error } = await supabase.from('bms_warranty_info').delete().eq('id', id)
  if (error) throw error
}

// ─── Geofence Zones ──────────────────────────────────────────────────────────

export async function fetchGeofenceZones(deviceId: string) {
  const { data, error } = await supabase
    .from('bms_geofence_zones')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createGeofenceZone(payload: Omit<import('@/types/supabase').GeofenceZone, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('bms_geofence_zones').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateGeofenceZone(id: string, payload: Partial<import('@/types/supabase').GeofenceZone>) {
  const { data, error } = await supabase.from('bms_geofence_zones').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteGeofenceZone(id: string) {
  const { error } = await supabase.from('bms_geofence_zones').delete().eq('id', id)
  if (error) throw error
}

// ─── Geo Alerts ───────────────────────────────────────────────────────────────

export async function fetchGeoAlerts(deviceId: string) {
  const { data, error } = await supabase
    .from('bms_geo_alerts')
    .select('*')
    .eq('device_id', deviceId)
    .order('triggered_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}

export async function resolveGeoAlert(id: string) {
  const { data, error } = await supabase
    .from('bms_geo_alerts')
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGeoAlert(id: string) {
  const { error } = await supabase.from('bms_geo_alerts').delete().eq('id', id)
  if (error) throw error
}

// ─── Real-time subscription ────────────────────────────────────────────────

export function subscribeToTelemetry(
  deviceId: string,
  onInsert: (row: BmsTelemetry) => void
) {
  return supabase
    .channel(`telemetry:${deviceId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bms_telemetry',
        filter: `device_id=eq.${deviceId}`,
      },
      (payload) => onInsert(payload.new as BmsTelemetry)
    )
    .subscribe()
}
