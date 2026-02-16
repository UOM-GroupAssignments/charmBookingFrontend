import { AvailableWorkersResponse, Booking, TimeSlotResponse } from '../types/booking'
import axiosInstance from './axiosInstance'
import logger from '../utils/logger'

export async function getBookings(salonId: string, authHeader: string): Promise<Booking[]> {
  const response = await axiosInstance.get(`/booking/${salonId}/bookings`, {
    headers: {
      Authorization: authHeader,
    },
  })
  return response.data
}

export async function getAvailableTimeSlots(
  salonId: string,
  serviceId: string,
  date: string,
): Promise<TimeSlotResponse> {
  const response = await axiosInstance.get(
    `/booking/${salonId}/getAvailableSlots?serviceId=${serviceId}&date=${date}`,
  )
  return response.data
}

export async function getAvailableWorkers(
  salonId: string,
  serviceId: string,
  date: string,
  startTime: string,
): Promise<AvailableWorkersResponse> {
  const response = await axiosInstance.get(
    `/booking/${salonId}/checkServiceTimeAvailability?serviceId=${serviceId}&date=${date}&startTime=${startTime}`,
  )
  return response.data
}

export async function bookSlot(data: {
  salonId: string
  userId: string
  serviceId: string
  date: string
  startTime: string
  workerId: string
}): Promise<Booking> {
  logger.debug('Booking appointment')
  const response = await axiosInstance.post(`/booking/${data.salonId}/book`, data)
  return response.data
}

//cancel pending bookings
export async function cancelBooking(bookingId: string, userId: string): Promise<void> {
  logger.debug('Cancelling booking:', bookingId)
  await axiosInstance.post(`/booking/cancel/${bookingId}`, { userId })
}

//cancel confirmed bookings - salon
export async function cancelConfirmedBookingSalon(
  bookingId: string,
): Promise<{ refund: boolean; refund_amount: number }> {
  logger.debug('Cancelling confirmed booking:', bookingId)
  const response = await axiosInstance.post(`/booking/salonCancel/${bookingId}`)
  return response.data
}

//cancel confirmed bookings - customer
export async function cancelConfirmedBookingCustomer(
  bookingId: string,
  userId: string,
): Promise<void> {
  logger.debug('Cancelling confirmed booking (customer):', bookingId)
  await axiosInstance.post(`/booking/userCancel/${bookingId}`, { userId })
}

export async function updateCompletedBookingStatus(bookingId: string): Promise<void> {
  logger.debug('Updating completed booking status:', bookingId)
  await axiosInstance.post(`/booking/updateCompletedBookingStatus/${bookingId}`)
}
