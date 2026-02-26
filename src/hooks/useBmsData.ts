import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { TimeRange, BmsTelemetry } from '@/types/supabase'
import {
  fetchDevices,
  fetchDeviceLatest,
  fetchHourlyStats,
  fetchActiveFaults,
  fetchFaultSummary,
  fetchRecentTelemetry,
  subscribeToTelemetry,
  fetchMaintenanceLogs,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
  fetchWarrantyInfo,
  createWarrantyInfo,
  updateWarrantyInfo,
  deleteWarrantyInfo,
  fetchGeofenceZones,
  createGeofenceZone,
  updateGeofenceZone,
  deleteGeofenceZone,
  fetchGeoAlerts,
  resolveGeoAlert,
  deleteGeoAlert,
} from '@/services/bmsService'
import { toast } from 'sonner'

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: fetchDevices,
    refetchInterval: 30_000,
  })
}

export function useDeviceLatest(deviceId?: string) {
  return useQuery({
    queryKey: ['device-latest', deviceId],
    queryFn: () => fetchDeviceLatest(deviceId),
    refetchInterval: 8_000,
  })
}

export function useHourlyStats(deviceId: string, range: TimeRange) {
  return useQuery({
    queryKey: ['hourly-stats', deviceId, range],
    queryFn: () => fetchHourlyStats(deviceId, range),
    enabled: !!deviceId,
    refetchInterval: 60_000,
  })
}

export function useActiveFaults(deviceId?: string) {
  return useQuery({
    queryKey: ['active-faults', deviceId],
    queryFn: () => fetchActiveFaults(deviceId),
    refetchInterval: 5_000,
  })
}

export function useFaultSummary(deviceId?: string) {
  return useQuery({
    queryKey: ['fault-summary', deviceId],
    queryFn: () => fetchFaultSummary(deviceId),
    refetchInterval: 30_000,
  })
}

export function useRecentTelemetry(deviceId: string, limit = 60) {
  return useQuery({
    queryKey: ['recent-telemetry', deviceId, limit],
    queryFn: () => fetchRecentTelemetry(deviceId, limit),
    enabled: !!deviceId,
    refetchInterval: 15_000,
  })
}

// ─── Maintenance Hooks ────────────────────────────────────────────────────

export function useMaintenanceLogs(deviceId: string) {
  return useQuery({
    queryKey: ['maintenance', deviceId],
    queryFn: () => fetchMaintenanceLogs(deviceId),
    enabled: !!deviceId,
  })
}

export function useCreateMaintenance(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createMaintenanceLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance', deviceId] })
      toast.success('Maintenance log created')
    },
    onError: () => toast.error('Failed to create maintenance log'),
  })
}

export function useUpdateMaintenance(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateMaintenanceLog>[1] }) =>
      updateMaintenanceLog(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance', deviceId] })
      toast.success('Maintenance log updated')
    },
    onError: () => toast.error('Failed to update maintenance log'),
  })
}

export function useDeleteMaintenance(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMaintenanceLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance', deviceId] })
      toast.success('Maintenance log deleted')
    },
    onError: () => toast.error('Failed to delete maintenance log'),
  })
}

// ─── Warranty Hooks ────────────────────────────────────────────────────────

export function useWarrantyInfo(deviceId: string) {
  return useQuery({
    queryKey: ['warranty', deviceId],
    queryFn: () => fetchWarrantyInfo(deviceId),
    enabled: !!deviceId,
  })
}

export function useCreateWarranty(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWarrantyInfo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warranty', deviceId] })
      toast.success('Warranty record created')
    },
    onError: () => toast.error('Failed to create warranty record'),
  })
}

export function useUpdateWarranty(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateWarrantyInfo>[1] }) =>
      updateWarrantyInfo(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warranty', deviceId] })
      toast.success('Warranty record updated')
    },
    onError: () => toast.error('Failed to update warranty record'),
  })
}

export function useDeleteWarranty(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWarrantyInfo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['warranty', deviceId] })
      toast.success('Warranty record deleted')
    },
    onError: () => toast.error('Failed to delete warranty record'),
  })
}

// ─── Geofence & Alert Hooks ────────────────────────────────────────────────

export function useGeofenceZones(deviceId: string) {
  return useQuery({
    queryKey: ['geofences', deviceId],
    queryFn: () => fetchGeofenceZones(deviceId),
    enabled: !!deviceId,
  })
}

export function useCreateGeofence(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createGeofenceZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofences', deviceId] })
      toast.success('Geofence zone created')
    },
    onError: () => toast.error('Failed to create geofence'),
  })
}

export function useUpdateGeofence(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateGeofenceZone>[1] }) =>
      updateGeofenceZone(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofences', deviceId] })
      toast.success('Geofence zone updated')
    },
    onError: () => toast.error('Failed to update geofence'),
  })
}

export function useDeleteGeofence(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteGeofenceZone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geofences', deviceId] })
      toast.success('Geofence zone deleted')
    },
    onError: () => toast.error('Failed to delete geofence'),
  })
}

export function useGeoAlerts(deviceId: string) {
  return useQuery({
    queryKey: ['geo-alerts', deviceId],
    queryFn: () => fetchGeoAlerts(deviceId),
    enabled: !!deviceId,
    refetchInterval: 30_000,
  })
}

export function useResolveGeoAlert(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: resolveGeoAlert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-alerts', deviceId] })
      toast.success('Alert marked as resolved')
    },
    onError: () => toast.error('Failed to resolve alert'),
  })
}

export function useDeleteGeoAlert(deviceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteGeoAlert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geo-alerts', deviceId] })
      toast.success('Alert deleted')
    },
    onError: () => toast.error('Failed to delete alert'),
  })
}

// ─── Real-time subscription hook ──────────────────────────────────────────

export function useRealtimeTelemetry(deviceId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!deviceId) return

    const channel = subscribeToTelemetry(deviceId, (row: BmsTelemetry) => {
      // Invalidate queries so they refetch
      queryClient.invalidateQueries({ queryKey: ['device-latest', deviceId] })
      queryClient.invalidateQueries({ queryKey: ['recent-telemetry', deviceId] })

      // Fault notifications
      if (row.fault && row.fault_message) {
        const severity = row.fault_message.includes('THERMAL') ||
                         row.fault_message.includes('OVER CURRENT') ||
                         row.fault_message.includes('OVER VOLTAGE') ? 4 : 3

        toast.error(`FAULT: ${row.fault_message}`, {
          description: `V:${row.pack_voltage.toFixed(2)}V  T:${row.temp_pack.toFixed(1)}°C  SOC:${row.soc.toFixed(1)}%`,
          duration: 8000,
        })

        // Play alert sound for severity 4
        if (severity === 4) {
          playAlertSound()
        }
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [deviceId, queryClient])

  return null
}

function playAlertSound() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.1)
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch (_) {
    // AudioContext not available
  }
}
