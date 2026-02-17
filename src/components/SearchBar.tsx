import {
  Button,
  DatePicker,
  Select,
  SelectItem,
  TimeInput,
  Autocomplete,
  AutocompleteItem,
  addToast,
} from '@heroui/react'
import logger from '../utils/logger'
import { Key, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllCategories } from '../actions/salonActions'
import { Category } from '../types/salon'
import { getLocalTimeZone, today, CalendarDate, Time } from '@internationalized/date'
import cities from '../data/lk.json'
import { useNavigate } from 'react-router-dom'

const SearchBar = ({
  categoryId,
  initialLocation,
  initialDate,
  initialTime,
}: {
  categoryId?: string
  initialLocation?: string
  initialDate?: string
  initialTime?: string
}) => {
  const navigate = useNavigate()
  const [category, setCategory] = useState<string>(categoryId ? categoryId : '')
  const [location, setLocation] = useState<Key | null | undefined>(initialLocation)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [date, setDate] = useState<CalendarDate | null | undefined>(
    initialDate
      ? (() => {
          const [year, month, day] = initialDate.split('-').map(Number)
          return new CalendarDate(year, month, day)
        })()
      : undefined,
  )
  const [time, setTime] = useState<Time | null | undefined>(
    initialTime
      ? (() => {
          const [hour, minute] = initialTime.split(':').map(Number)
          return new Time(hour, minute)
        })()
      : undefined,
  )

  // Error states
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [timeError, setTimeError] = useState<string | null>(null)

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getAllCategories,
  })

  useEffect(() => {
    if (initialLocation) {
      if (initialLocation === 'current-location') {
        navigator.geolocation.getCurrentPosition(
          position => {
            setLatitude(position.coords.latitude)
            setLongitude(position.coords.longitude)
          },
          error => {
            logger.error('Error getting location:', error)
          },
        )
      } else {
        // Find the city in cities data
        const selectedCity = cities.find(city => city.city === initialLocation)
        if (selectedCity) {
          setLatitude(Number(selectedCity.lat))
          setLongitude(Number(selectedCity.lng))
        }
      }
    }
  }, [initialLocation])

  useEffect(() => {
    if (isError)
      addToast({
        title: 'Error fetching categories',
        description: 'There was an error fetching the categories. Please try again later.',
        color: 'warning',
      })
  }, [isError])

  const handleSearch = (): void => {
    let hasError = false

    if (!category) {
      setCategoryError('Please select a category')
      hasError = true
    } else {
      setCategoryError(null)
    }

    if (!location) {
      setLocationError('Please select a location')
      hasError = true
    } else {
      setLocationError(null)
    }

    if (!date) {
      setDateError('Please select a date')
      hasError = true
    } else {
      setDateError(null)
    }

    if (!time) {
      setTimeError('Please select a time')
      hasError = true
    } else {
      setTimeError(null)
    }

    if (hasError) return
    logger.debug('Navigating to search with params:', {
      category,
      latitude,
      longitude,
      date,
      time,
    })
    navigate({
      pathname: '/salon/search',
      search: `?category=${category}&location=${location}&latitude=${latitude}&longitude=${longitude}&date=${date}&time=${time}`,
    })
  }

  const handleLocationSelect = (key: Key | null) => {
    setLocation(key)
    setLocationError(null)
    if (key === 'current-location') {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
        },
        error => {
          logger.error('Error getting location:', error)
        },
      )
    } else {
      // Find the city in cities data
      const selectedCity = cities.find(city => city.city === key)
      if (selectedCity) {
        setLatitude(Number(selectedCity.lat))
        setLongitude(Number(selectedCity.lng))
      }
    }
  }

  return (
    <div className='flex justify-center items-center w-2/3 p-4 bg-orange-100/50 backdrop-blur-lg border-0 shadow-md space-x-4 rounded-xl'>
      <Select
        className='max-w-sm'
        label='Select a category'
        placeholder='Select a category'
        isLoading={isLoading}
        defaultSelectedKeys={[category]}
        onSelectionChange={key => {
          logger.debug('Selected category:', key.currentKey)
          setCategory(key.currentKey as string)
          setCategoryError(null)
        }}
        isInvalid={!!categoryError}
        errorMessage={categoryError}
      >
        {(categories ?? []).map(category => (
          <SelectItem key={category.categoryId}>{category.name}</SelectItem>
        ))}
      </Select>

      <Autocomplete
        className='max-w-sm'
        label='Select your location'
        placeholder='Select your location'
        allowsCustomValue={false}
        defaultItems={[
          { key: 'current-location', label: 'Current Location' },
          ...cities.map(city => ({ key: city.city, label: city.city })),
        ]}
        defaultSelectedKey={initialLocation}
        onSelectionChange={handleLocationSelect}
        isInvalid={!!locationError}
        errorMessage={locationError}
      >
        {item => <AutocompleteItem key={item.key}>{item.label}</AutocompleteItem>}
      </Autocomplete>

      <DatePicker
        className='max-w-sm'
        label='Select a date'
        minValue={today(getLocalTimeZone())}
        value={date}
        onChange={d => {
          setDate(d)
          setDateError(null)
        }}
        isInvalid={!!dateError}
        errorMessage={dateError}
      />

      <TimeInput
        className='max-w-sm'
        label='Select a time'
        granularity='minute'
        value={time}
        onChange={t => {
          setTime(t)
          setTimeError(null)
        }}
        isInvalid={!!timeError}
        errorMessage={timeError}
      />

      <Button size='lg' color='secondary' radius='lg' variant='shadow' onPress={handleSearch}>
        Search
      </Button>
    </div>
  )
}

export default SearchBar
