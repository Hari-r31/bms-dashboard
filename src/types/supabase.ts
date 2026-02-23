// ─── Supabase Database Types ───────────────────────────────────────────────

export interface BmsDevice {
  device_id: string
  firmware_version: string
  description: string | null
  created_at: string
  last_seen_at: string | null
  total_uploads: number
  total_faults: number
  total_cycles: number
}

export interface BmsTelemetry {
  id: number
  device_id: string
  created_at: string
  device_uptime_ms: number
  pack_voltage: number
  current: number
  power: number
  temp_pack: number
  soc: number
  soh: number
  rul_cycles: number
  fault: boolean
  fault_message: string
  latitude: number
  longitude: number
  impact_count: number
  shock_count: number
  connection_quality: number
  is_charging: boolean
  is_discharging: boolean
  charger_relay_on: boolean
  motor_load_on: boolean
  fan_on: boolean
  cooling_active: boolean
}

export interface BmsFaultEvent {
  id: number
  device_id: string
  created_at: string
  fault_type: string
  fault_severity: number
  pack_voltage: number | null
  current: number | null
  temp_pack: number | null
  soc: number | null
  soh: number | null
  latitude: number | null
  longitude: number | null
  resolved_at: string | null
  auto_resolved: boolean
  telemetry_id: number | null
}

// ─── View Types ────────────────────────────────────────────────────────────

export interface DeviceLatest {
  device_id: string
  created_at: string
  pack_voltage: number
  current: number
  power: number
  temp_pack: number
  soc: number
  soh: number
  rul_cycles: number
  fault: boolean
  fault_message: string
  is_charging: boolean
  is_discharging: boolean
  fan_on: boolean
  latitude: number
  longitude: number
  connection_quality: number
  device_label: string | null
  firmware_version: string
  charger_relay_on?: boolean
  motor_load_on?: boolean
  cooling_active?: boolean
}

export interface HourlyStat {
  device_id: string
  hour: string
  avg_voltage: number
  avg_current: number
  avg_power: number
  avg_temp: number
  avg_soc: number
  avg_soh: number
  max_voltage: number
  min_voltage: number
  max_temp: number
  sample_count: number
  fault_count: number
}

export interface ActiveFault {
  id: number
  device_id: string
  device_label: string | null
  fault_started_at: string
  fault_type: string
  fault_severity: number
  pack_voltage: number | null
  temp_pack: number | null
  soc: number | null
  latitude: number | null
  longitude: number | null
  minutes_active: number
}

export interface FaultSummary {
  device_id: string
  fault_type: string
  fault_severity: number
  total_occurrences: number
  currently_active: number
  last_occurred_at: string
  avg_duration_minutes: number
}

// ─── UI Helper Types ───────────────────────────────────────────────────────

export type TimeRange = '1H' | '6H' | '24H' | '7D'

export type SeverityLevel = 1 | 2 | 3 | 4

export interface ChartDataPoint {
  time: string
  value: number
  label?: string
}
