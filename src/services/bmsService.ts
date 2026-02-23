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
