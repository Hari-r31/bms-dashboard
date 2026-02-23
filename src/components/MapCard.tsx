import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const pulseIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#00FF88;opacity:0.3;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#00FF88;box-shadow:0 0 12px #00FF88;"></div>
    </div>
    <style>@keyframes ping{75%,100%{transform:scale(2);opacity:0}}</style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

interface MapCardProps {
  latitude: number
  longitude: number
  deviceId: string
  fault?: boolean
}

export default function MapCard({ latitude, longitude, deviceId, fault }: MapCardProps) {
  const hasLocation = latitude !== 0 || longitude !== 0
  const center: [number, number] = hasLocation ? [latitude, longitude] : [0, 0]

  if (!hasLocation) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary rounded-xl">
        <div className="text-center">
          <p className="font-mono text-sm text-muted-foreground">No GPS fix</p>
          <p className="font-mono text-xs text-muted-foreground mt-1">Waiting for location...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={false}
      style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution=""
      />
      <Marker position={center} icon={fault ? L.Icon.Default.prototype : pulseIcon}>
        <Popup className="font-mono text-xs">
          <div className="bg-card text-foreground p-2 rounded">
            <p className="font-bold text-neon-green">{deviceId}</p>
            <p className="text-muted-foreground">{latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
