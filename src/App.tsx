import { useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import Dashboard from '@/pages/Dashboard'
import LiveMonitoring from '@/pages/LiveMonitoring'
import Faults from '@/pages/Faults'
import Analytics from '@/pages/Analytics'
import DeviceInfo from '@/pages/DeviceInfo'
import Advanced from '@/pages/Advanced'
import { useDevices } from '@/hooks/useBmsData'

// ─── Device Context ────────────────────────────────────────────────────────

interface DeviceContextType {
  selectedDevice: string
  setSelectedDevice: (id: string) => void
}

const DeviceContext = createContext<DeviceContextType>({
  selectedDevice: '',
  setSelectedDevice: () => {},
})

export function useDeviceContext() {
  return useContext(DeviceContext)
}

// ─── App Shell ────────────────────────────────────────────────────────────

export default function App() {
  const { data: devices } = useDevices()
  const [selectedDevice, setSelectedDevice] = useState<string>('BMS_EV_001')

  // Default to first device once loaded
  if (devices && devices.length > 0 && !selectedDevice) {
    setSelectedDevice(devices[0].device_id)
  }

  return (
    <DeviceContext.Provider value={{ selectedDevice, setSelectedDevice }}>
      <BrowserRouter>
        <div className="flex h-screen bg-background overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/monitoring" element={<LiveMonitoring />} />
                <Route path="/faults" element={<Faults />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/device" element={<DeviceInfo />} />
                <Route path="/advanced" element={<Advanced />} />
              </Routes>
            </main>
          </div>
        </div>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(10, 15, 28, 0.95)',
              border: '1px solid rgba(255, 59, 59, 0.4)',
              color: '#fff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '13px',
            },
          }}
        />
      </BrowserRouter>
    </DeviceContext.Provider>
  )
}
