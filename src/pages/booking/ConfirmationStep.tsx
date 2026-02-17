import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import useAuthUser from 'react-auth-kit/hooks/useAuthUser'
import { getSalonProfile } from '../../actions/salonActions'
import { SalonWorker } from '../../types/booking'
import { Customer } from '../../types/customer'
import { Service } from '../../types/salon'
import { formatTime } from '../../utils/helper'
import { Button, Divider, Input } from '@heroui/react'

// --- Step 2: Booking Confirmation ---
export function BookingConfirmationStep({
  serviceData,
  selectedDate,
  selectedTime,
  selectedWorker,
  salonId,
}: {
  serviceData: Service
  selectedDate: Date
  selectedTime: string | null
  selectedWorker: SalonWorker | null
  salonId: string | undefined
}) {
  const user = useAuthUser<Customer>()
  const { data: salon } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: () => getSalonProfile(salonId!),
    enabled: !!salonId,
  })

  return (
    <div className='w-2/3 flex flex-col items-center'>
      <h1 className='text-3xl font-bold mb-8 text-center text-primary'>Confirm Your Booking</h1>
      <div className='bg-white rounded-xl shadow-lg p-8 space-y-6 max-w-2xl w-full'>
        <div>
          <div className='flex gap-4 mb-4'>
            {/* Date Block */}
            <div className='flex-1 border border-primary rounded-lg p-4 flex flex-col items-center shadow-lg'>
              <span className='text-4xl font-bold text-primary'>
                {format(selectedDate, 'd')}
                <sup className='text-base align-super ml-0.5'>
                  {format(selectedDate, 'do').replace(/\d+/, '').toLowerCase()}
                </sup>
              </span>
              <span className='text-base text-gray-700'>{format(selectedDate, 'MMMM yyyy')}</span>
              <span className='text-sm text-gray-500 mt-1'>{format(selectedDate, 'EEEE')}</span>
            </div>
            {/* Time Block */}
            <div className='flex-1 border border-primary rounded-lg p-4 flex flex-col items-center justify-center shadow-lg'>
              <span className='text-3xl font-bold text-primary'>
                {selectedTime ? formatTime(selectedTime) : 'Not selected'}
              </span>
              <span className='text-base text-gray-700 mt-2'>Time</span>
            </div>
          </div>
          <h2 className='font-bold text-large'>{salon?.name}</h2>
          <small className='text-default-700'>{salon?.location || 'Location not specified'}</small>
          <Divider className='my-4' />
          <p className='font-medium text-lg'>{serviceData.name}</p>
          <p className='text-primary font-semibold'>
            {serviceData.price.toLocaleString('en-LK', {
              style: 'currency',
              currency: 'LKR',
              minimumFractionDigits: 2,
            })}
          </p>
          <p className='text-sm text-gray-500'>
            Duration: {(serviceData.duration ?? 0) + (serviceData.bufferTime ?? 0)} minutes
          </p>
          <p className='text-sm text-gray-500'>
            <span className='text-sm text-gray-500'>Staff:</span>{' '}
            {selectedWorker ? selectedWorker.name : 'No preference'}
          </p>
          <Divider className='my-4' />
          <h3 className='font-semibold text-lg mb-2'>Your Information</h3>
          <p className='text-gray-700'>
            <span className='font-semibold'>Name:</span> {user?.firstName} {user?.lastName}
          </p>
          <p className='text-gray-700'>
            <span className='font-semibold'>Email:</span> {user?.email}
          </p>
        </div>
      </div>
      <p className='mt-6 text-center text-gray-500 text-base'>
        <span className='text-xs text-primary italic'>
          Please review your booking details carefully before proceeding.
        </span>
      </p>
    </div>
  )
}
