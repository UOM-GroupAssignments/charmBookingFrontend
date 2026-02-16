import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { LatLngBounds, LatLngExpression } from 'leaflet'
import { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import L from 'leaflet'
import { Salon } from '../../types/salon'
import { calculateRatingAverage } from '../../helpers'
import logger from '../../utils/logger'

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface CustomMapContainerProps {
  salons: Salon[]
  hoverId: string | undefined
  scrollWheelZoom?: boolean
  userLocation: LatLngExpression
}

const FitBounds = ({ bounds, center }: { bounds: LatLngBounds; center?: LatLngExpression }) => {
  const map = useMap()

  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, bounds])

  useEffect(() => {
    if (center) {
      map.setView(center)
    }
  }, [map, center])

  return null
}

export default function CustomMapContainer({
  salons,
  hoverId,
  scrollWheelZoom = false,
  userLocation,
}: CustomMapContainerProps) {
  const bounds = new LatLngBounds([
    userLocation,
    ...salons.map(salon => [Number(salon.latitude), Number(salon.longitude)] as [number, number]),
  ])
  const [center, setCenter] = useState<LatLngExpression>(bounds.getCenter())

  useEffect(() => {
    if (hoverId) {
      const salon = salons.find(salon => salon.id === hoverId)
      logger.debug('Hovered salon:', salon)
      if (salon) {
        setCenter([Number(salon.latitude), Number(salon.longitude)])
      }
    }
  }, [hoverId, salons])

  return (
    <MapContainer minZoom={5} scrollWheelZoom={scrollWheelZoom}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {salons.map(salon => (
        <Marker
          icon={defaultIcon}
          key={salon.id}
          position={[Number(salon.latitude), Number(salon.longitude)]}
        >
          <Tooltip direction='top' offset={[1, -30]} permanent>
            <div className='flex items-center p-2 gap-2'>
              <div className='font-poppins font-semibold'>{salon.name}</div>
              <div className='flex items-center justify-center gap-1 bg-primary rounded-full text-white px-2'>
                <span className='text-tertiary text-base'>★</span>
                <span className='font-poppins mt-[2px]'>
                  {calculateRatingAverage(salon.reviews).toFixed(1)}
                </span>
              </div>
            </div>
          </Tooltip>
        </Marker>
      ))}
      {userLocation && (
        <Marker position={userLocation} icon={defaultIcon}>
          <Tooltip direction='top' offset={[1, -30]} permanent>
            <div className='font-poppins font-semibold p-2'>Your Location</div>
          </Tooltip>
        </Marker>
      )}
      <FitBounds bounds={bounds} center={center} />
    </MapContainer>
  )
}
