import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTranslation } from 'react-i18next'

const defaultIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

interface MapPickerProps {
  lat: number
  lon: number
  onChange: (lat: number, lon: number) => void
  height?: number
  interactive?: boolean
}

export default function MapPicker({ lat, lon, onChange, height = 300, interactive = true }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 12,
      scrollWheelZoom: interactive,
      dragging: interactive,
    })
    map.addLayer(L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }))
    const marker = L.marker([lat, lon]).addTo(map)
    mapRef.current = map
    markerRef.current = marker

    if (interactive) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: la, lng: lo } = e.latlng
        marker.setLatLng([la, lo])
        onChange(la, lo)
      })
    }

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (map && marker) {
      marker.setLatLng([lat, lon])
      if (!interactive) {
        map.setView([lat, lon], map.getZoom())
      }
    }
  }, [lat, lon, interactive])

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border-2 border-gray-200"
      role="application"
      aria-label={t('onboarding.farmLocation')}
    />
  )
}
