import { DayOfWeek, Salon } from '../types/salon'
import logger from './logger'

export const checkURLParam = (param: string | number | null | undefined) => {
  logger.debug('Checking param:', param)
  if (param === null || param === undefined || param === '' || param === 'null') {
    return false
  }
  return true
}

export const getSalonState = (salonData: Salon | null | undefined) => {
  if (!salonData || !salonData.weeklyHours) return 'unknown'

  const now = new Date()
  const dayOfWeek = now.getDay() // 0 (Sunday) - 6 (Saturday)
  const days: (
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
  )[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const todayName = days[dayOfWeek]
  const todayHours = salonData.weeklyHours.find(h => h.day_of_week === todayName)

  if (!todayHours || !todayHours.open_time || !todayHours.close_time) return 'closed'

  const [openHour, openMinute] = todayHours.open_time.split(':').map(Number)
  const [closeHour, closeMinute] = todayHours.close_time.split(':').map(Number)

  const openTime = new Date(now)
  openTime.setHours(openHour, openMinute, 0, 0)

  const closeTime = new Date(now)
  closeTime.setHours(closeHour, closeMinute, 0, 0)

  if (now >= openTime && now <= closeTime) {
    return 'open'
  }
  return 'closed'
}

export const getSalonNextOpenTime = (salonData: Salon | null | undefined) => {
  if (!salonData || !salonData.weeklyHours) return null

  const now = new Date()
  const dayOfWeek = now.getDay() // 0 (Sunday) - 6 (Saturday)
  const days: (
    | 'Sunday'
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
  )[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  for (let i = 0; i < 7; i++) {
    const checkDayIndex = (dayOfWeek + i) % 7
    const checkDayName = days[checkDayIndex]
    const dayHours = salonData.weeklyHours.find(h => h.day_of_week === checkDayName)

    if (dayHours && dayHours.open_time && dayHours.close_time) {
      const [openHour, openMinute] = dayHours.open_time.split(':').map(Number)
      const openTime = new Date(now)
      openTime.setDate(now.getDate() + i)
      openTime.setHours(openHour, openMinute, 0, 0)

      if (i > 0 || openTime > now) {
        return openTime
          .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          .toLowerCase()
      }
    }
  }
  return null
}

export const isTodayDayOfWeek = (dayOfWeek: DayOfWeek) => {
  const days: DayOfWeek[] = [
    DayOfWeek.Sunday,
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
    DayOfWeek.Saturday,
  ]
  const todayIndex = new Date().getDay()
  return days[todayIndex] === dayOfWeek
}

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const formattedHour = hour % 12 || 12
  return `${formattedHour}:${minutes} ${ampm}`
}
