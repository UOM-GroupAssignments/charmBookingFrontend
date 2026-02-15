import { useEffect, useState } from 'react'
import { format, addDays, startOfToday } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getAvailableTimeSlots, getAvailableWorkers } from '../../actions/bookingActions'
import { AvailableWorkersResponse, SalonWorker, TimeSlotResponse } from '../../types/booking'
import { today, getLocalTimeZone, CalendarDate } from '@internationalized/date'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getServiceById } from '../../actions/salonActions'
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated'
import { LoginPromptModal } from '../../components/loginPromptModalProps'
import { DateTimeStep } from './DateTimeStep'
import { WorkerStep } from './WorkerStep'
import { AppointmentSidebar } from './AppointmentSidebar'
import { BookingConfirmationStep } from './ConfirmationStep'
import { PaymentStep } from './PaymentStep'

// --- Main Page ---
export const BookTimeAndDate = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const salonId = searchParams.get('salonId') || undefined
  const serviceId = searchParams.get('serviceId') || undefined
  const dateParam = searchParams.get('date') || undefined
  const timeParam = searchParams.get('time') || undefined
  const [selectedStep, setSelectedStep] = useState(0)
  const [selectedWorker, setSelectedWorker] = useState<SalonWorker | null>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://www.payhere.lk/lib/payhere.js'
    script.type = 'text/javascript'
    script.crossOrigin = 'anonymous'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Redirect to home if salonId or serviceId is missing
  useEffect(() => {
    if (!salonId || !serviceId) navigate('/')
    // eslint-disable-next-line
  }, [salonId, serviceId])

  const jsToday = startOfToday()
  const [selectedDate, setSelectedDate] = useState<Date>(dateParam ? new Date(dateParam) : jsToday)
  const tz = getLocalTimeZone()
  const [calendarValue, setCalendarValue] = useState(today(tz))
  const [selectedTime, setSelectedTime] = useState<string | null>(timeParam || null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const dates = Array.from({ length: 7 }, (_, i) => addDays(jsToday, i))

  const {
    data: availableSlots,
    isPending: isTimeSlotsFetching,
    refetch: refetchTimeSlots,
  } = useQuery<TimeSlotResponse>({
    queryKey: ['availableSlots', salonId, serviceId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => getAvailableTimeSlots(salonId!, serviceId!, format(selectedDate, 'yyyy-MM-dd')),
    enabled: !!salonId && !!serviceId,
  })

  const { data: availableWorkers, isPending: isWorkersPending } =
    useQuery<AvailableWorkersResponse>({
      queryKey: [
        'availableWorkers',
        salonId,
        serviceId,
        format(selectedDate, 'yyyy-MM-dd'),
        selectedTime,
      ],
      queryFn: () =>
        getAvailableWorkers(
          salonId!,
          serviceId!,
          format(selectedDate, 'yyyy-MM-dd'),
          selectedTime!,
        ),
      enabled: !!salonId && !!serviceId && !!selectedTime,
    })

  const { data: serviceData } = useQuery({
    queryKey: ['serviceData', salonId, serviceId],
    queryFn: () => getServiceById(serviceId!),
    enabled: !!serviceId,
  })

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setSelectedWorker(null)
    setCalendarValue(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()))
    refetchTimeSlots()
  }

  const handleContinue = () => {
    switch (selectedStep) {
      case 0:
        if (selectedTime) setSelectedStep(1)
        break
      case 1:
        if (selectedWorker) setSelectedStep(2)
        break
      case 2:
        setSelectedStep(3)
        break
      default:
        break
    }
  }

  return (
    <div className='flex h-fit'>
      <div className='flex flex-col flex-1 items-center px-10 py-8'>
        {selectedStep === 0 && (
          <DateTimeStep
            dates={dates}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            isCalendarOpen={isCalendarOpen}
            setIsCalendarOpen={setIsCalendarOpen}
            calendarValue={calendarValue}
            setCalendarValue={setCalendarValue}
            tz={tz}
            availableSlots={availableSlots}
            isTimeSlotsFetching={isTimeSlotsFetching}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            setSelectedWorker={setSelectedWorker}
          />
        )}
        {selectedStep === 1 && (
          <WorkerStep
            availableWorkers={availableWorkers}
            isWorkersPending={isWorkersPending}
            selectedWorker={selectedWorker}
            setSelectedWorker={setSelectedWorker}
          />
        )}
        {selectedStep === 2 && serviceData && (
          <BookingConfirmationStep
            serviceData={serviceData}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedWorker={selectedWorker}
            salonId={salonId}
          />
        )}
        {selectedStep === 3 &&
          salonId &&
          serviceData &&
          selectedDate &&
          selectedTime &&
          selectedWorker && (
            <PaymentStep
              salonId={salonId}
              service={serviceData}
              date={selectedDate}
              startTime={selectedTime}
              worker={selectedWorker}
            />
          )}
      </div>
      <AppointmentSidebar
        serviceData={serviceData}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedWorker={selectedWorker}
        selectedStep={selectedStep}
        setSelectedStep={setSelectedStep}
        handleContinue={handleContinue}
      />
    </div>
  )
}

export default BookTimeAndDate
