import { useQuery, useQueryClient } from '@tanstack/react-query'
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
