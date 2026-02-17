/* eslint-disable @typescript-eslint/no-explicit-any */
import { Booking, PayHerePayload, SalonWorker } from '../../types/booking'
import { Service } from '../../types/salon'
import { useEffect, useState } from 'react'
import { bookSlot, cancelBooking } from '../../actions/bookingActions'
import { paymentInitiate } from '../../actions/paymentActions'
import { useMutation } from '@tanstack/react-query'
import useAuthUser from 'react-auth-kit/hooks/useAuthUser'
import { Customer } from '../../types/customer'
import { addToast, Button, Input, Spinner } from '@heroui/react'
import { useNavigate } from 'react-router-dom'
import logger from '../../utils/logger'

export function PaymentStep({
  salonId,
  service,
  date,
  startTime,
  worker,
}: {
  salonId: string
  service: Service
  date: Date
  startTime: string
  worker: SalonWorker
}) {
  const user = useAuthUser<Customer>()
  const navigate = useNavigate()
  const [billingInfo, setBillingInfo] = useState({
    address1: '',
    address2: '',
    city: '',
  })
  const [bookingResponse, setBookingResponse] = useState<Booking | null>(null)

  const bookSlotMutation = useMutation({
    mutationFn: (params: Parameters<typeof bookSlot>[0]) => bookSlot(params),
    onSuccess: data => {
      setBookingResponse(data)
      paymentMutation.mutate({
        bookingId: data!.id,
        address1: billingInfo.address1,
        address2: billingInfo.address2,
        city: billingInfo.city,
      })
    },
    onError: error => {
      addToast({
        title: 'Booking Error',
        description: 'This Booking is no longer available.',
        color: 'danger',
      })
      logger.error('Booking error:', error)
    },
  })

  const paymentMutation = useMutation({
    mutationFn: (params: Parameters<typeof paymentInitiate>[0]) => paymentInitiate(params),
    onSuccess: data => {
      const payhere = (window as any).payhere
      if (payhere) {
        const payHerePayload = {
          ...data,
          return_url: window.location.origin + '/payment/success',
          cancel_url: window.location.origin + '/payment/cancel',
        }
        payhere.startPayment(payHerePayload)
      } else {
        logger.error('PayHere SDK not loaded')
      }
    },
  })
  const cancelBookingMutation = useMutation({
    mutationFn: ({ bookingId, userId }: { bookingId: string; userId: string }) =>
      cancelBooking(bookingId, userId),
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).payhere) {
      const payhere = (window as any).payhere

      // Called when payment is completed successfully
      payhere.onCompleted = function onCompleted(orderId: string) {
        logger.info('Payment completed. OrderID:', orderId)
        navigate('/customer/bookings')
      }

      // Called when user closes the popup without paying
      payhere.onDismissed = function onDismissed() {
        if (bookingResponse && user?.customerId) {
          cancelBookingMutation.mutate({ bookingId: bookingResponse.id, userId: user.customerId })
        }
        addToast({
          title: 'Payment Cancelled',
          description: 'You have cancelled the payment.',
          color: 'warning',
        })
        logger.warn('Payment dismissed')
      }

      // Called if an error occurs
      payhere.onError = function onError(error: string) {
        if (bookingResponse && user?.customerId) {
          cancelBookingMutation.mutate({ bookingId: bookingResponse.id, userId: user.customerId })
        }
        addToast({
          title: 'Payment Error',
          description: 'An error occurred during payment.',
          color: 'danger',
        })
        logger.error('Payment error:', error)
      }
    }
  }, [bookingResponse, cancelBookingMutation, navigate, user?.customerId])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      addToast({
        title: 'Authentication Required',
        description: 'Please log in to book a slot.',
        color: 'warning',
      })
      return
    }
    bookSlotMutation.mutate({
      salonId: salonId,
      userId: user?.customerId,
      serviceId: service.serviceId,
      date: date.toLocaleDateString('en-CA'),
      startTime,
      workerId: worker.workerId,
    })
  }

  return (
    <div className='w-full flex flex-col items-center'>
      <h1 className='text-2xl font-semibold mb-6'>Payment</h1>
      {
        <form
          className='space-y-4 w-2/3 flex flex-col bg-white p-8 rounded-lg shadow'
          onSubmit={handleSubmit}
        >
          <div>
            <label className='block mb-1 font-medium'>Address Line 1</label>
            <Input
              type='text'
              label='Address Line 1'
              required
              value={billingInfo.address1}
              onChange={e => setBillingInfo(info => ({ ...info, address1: e.target.value }))}
            />
          </div>
          <div>
            <label className='block mb-1 font-medium'>Address Line 2</label>
            <Input
              type='text'
              label='Address Line 2'
              value={billingInfo.address2}
              onChange={e => setBillingInfo(info => ({ ...info, address2: e.target.value }))}
            />
          </div>
          <div>
            <label className='block mb-1 font-medium'>City</label>
            <Input
              type='text'
              label='City'
              required
              value={billingInfo.city}
              onChange={e => setBillingInfo(info => ({ ...info, city: e.target.value }))}
            />
          </div>
          <Button
            type='submit'
            radius='lg'
            size='lg'
            className='mt-4 w-full max-w-72 self-center bg-quaternary border border-blue-600 hover:shadow-lg transition-all duration-250'
            disabled={paymentMutation.isPending}
            isLoading={
              bookSlotMutation.isPending ||
              paymentMutation.isPending ||
              cancelBookingMutation.isPending
            }
          >
            Pay With
            <img
              src='https://payherestorage.blob.core.windows.net/payhere-resources/www/images/PayHere-Logo.png'
              alt='PayHere'
              className='h-full'
            />
          </Button>
        </form>
      }
    </div>
  )
}
