import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getSalonsRanked } from '../../actions/salonActions'
import CustomMapContainer from '../../components/Leaflet/CustomMapContainer'
import SalonGrid from '../../components/SalonGrid'
import { ScrollShadow, Spinner, Link } from '@heroui/react'
import SearchBar from '../../components/SearchBar'
import { checkURLParam } from '../../utils/helper'
import logger from '../../utils/logger'

const SearchSalons = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const category = searchParams.get('category')
  const location = searchParams.get('location')
  const latitude = searchParams.get('latitude')
  const longitude = searchParams.get('longitude')
  const date = searchParams.get('date')
  const time = searchParams.get('time')

  const [hoveredSalon, setHoveredSalon] = useState<string | undefined>(undefined)

  useEffect(() => {
    logger.debug('Search params:', { category, location, latitude, longitude, date, time })
    if (
      !checkURLParam(category) ||
      !checkURLParam(location) ||
      !checkURLParam(latitude) ||
      !checkURLParam(longitude) ||
      !checkURLParam(date) ||
      !checkURLParam(time)
    ) {
      navigate('/')
    }
  }, [category, location, latitude, longitude, date, time, navigate])

  const { data: salons, isLoading } = useQuery({
    queryKey: ['salons', { category, location, latitude, longitude, date, time }],
    queryFn: () =>
      getSalonsRanked({
        categoryId: Number(category),
        latitude: Number(latitude),
        longitude: Number(longitude),
        date: date!,
        time: time!,
      }),
  })
  logger.debug('Fetched salons:', salons)
  return (
    <div className='flex flex-col items-center'>
      <div className='w-full flex justify-between px-8 py-2 bg-white shadow-md'>
        <Link href='/'>
          <p className='font-birthstone text-5xl'>CharmBooking</p>
        </Link>
        <SearchBar
          categoryId={category!}
          initialLocation={location!}
          initialDate={date!}
          initialTime={time!}
        />
      </div>
      <div className='flex h-[calc(100vh-64px-40px)]'>
        {isLoading && !salons ? (
          <Spinner />
        ) : (
          <>
            <ScrollShadow className='flex-1 p-2 w-full h-full' hideScrollBar>
              <SalonGrid
                salons={salons!}
                categoryId={category!}
                date={date!}
                time={time!}
                setHoveredSalon={setHoveredSalon}
              />
            </ScrollShadow>
            <div className='w-[70vw]'>
              {salons && (
                <CustomMapContainer
                  salons={salons}
                  hoverId={hoveredSalon}
                  userLocation={[Number(latitude), Number(longitude)]}
                  scrollWheelZoom={true}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SearchSalons
