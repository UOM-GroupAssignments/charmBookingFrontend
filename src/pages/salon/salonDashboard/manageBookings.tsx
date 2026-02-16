import {
  faCalendar,
  faClock,
  faUser,
  faEnvelope,
  faPhone,
  faCheckCircle,
  faFilter,
  faEye,
  faEllipsisH,
  faCircleExclamation,
  faCircleXmark,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CustomDropdown } from '../../../components/Dropdown'
import { CustomTable } from '../../../components/Table'
import { CustomCard } from '../../../components/Cards/CustomCard'
import { Chip, Button, Input, toast, addToast } from '@heroui/react'
import { useState } from 'react'
import logger from '../../../utils/logger'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Booking, BookingStatus, PaymentStatus } from '../../../types/booking'
import {
  cancelConfirmedBookingSalon,
  getBookings,
  updateCompletedBookingStatus,
} from '../../../actions/bookingActions'
import useAuthUser from 'react-auth-kit/hooks/useAuthUser'
import { SalonAdmin } from '../../../types/salon'
import CommonModal from '../../../components/commonModal'
import BookingDetailsView from '../../../components/Booking/BookingDetailsView'
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader'

export function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const admin = useAuthUser<SalonAdmin>()
  const queryClient = useQueryClient()
  const [cancelConfirmation, setCancelConfirmation] = useState<string | null>(null)
  const authHeader = useAuthHeader()

  const { data: bookings, isPending: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: () => getBookings(admin!.salonId, authHeader!),
    enabled: !!admin?.salonId && !!authHeader,
  })

  const { mutate: cancelBooking, isPending: isCancelling } = useMutation({
    mutationFn: ({ bookingId }: { bookingId: string }) => cancelConfirmedBookingSalon(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      addToast({
        title: 'Booking cancelled successfully',
        description: 'The booking has been cancelled.',
        color: 'success',
      })
      setCancelConfirmation(null)
    },
    onError: error => {
      addToast({
        title: 'Error cancelling booking',
        description: 'Failed to cancel booking',
        color: 'danger',
      })
      logger.error('Error cancelling booking:', error)
    },
  })

  const { mutate: updateBookingStatus } = useMutation({
    mutationFn: (bookingId: string) => updateCompletedBookingStatus(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      addToast({
        title: 'Booking status updated successfully',
        description: 'The booking status has been updated.',
        color: 'success',
      })
    },
    onError: error => {
      addToast({
        title: 'Error updating booking status',
        description: 'Failed to update booking status',
        color: 'danger',
      })
      logger.error('Error updating booking status:', error)
    },
  })

  const { mutate: confirmBooking } = useMutation({
    mutationFn: (bookingId: string) => {
      // You'll need to implement this function in your bookingActions
      // For now, I'll use a placeholder that you can replace with your actual API call
      return fetch(`/api/bookings/${bookingId}/confirm`, { method: 'PUT' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      addToast({
        title: 'Booking confirmed successfully',
        description: 'The booking has been confirmed.',
        color: 'success',
      })
    },
    onError: error => {
      addToast({
        title: 'Error confirming booking',
        description: 'Failed to confirm booking',
        color: 'danger',
      })
      logger.error('Error confirming booking:', error)
    },
  })

  if (!bookings || bookingsLoading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-muted-foreground'>Loading bookings...</div>
      </div>
    )
  }
  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter
    return matchesSearch && matchesStatus && matchesPayment
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Chip className='bg-success/10 text-success border-success/20'>
            <FontAwesomeIcon icon={faCheckCircle} className='w-3 h-3 mr-1' />
            Confirmed
          </Chip>
        )
      case 'PENDING':
        return (
          <Chip className='bg-pending/10 text-pending border-pending/20'>
            <FontAwesomeIcon icon={faCircleExclamation} className='w-3 h-3 mr-1' />
            Pending
          </Chip>
        )
      case 'CANCELLED':
        return (
          <Chip className='bg-danger-50 text-cancelled border-cancelled/20'>
            <FontAwesomeIcon icon={faCircleXmark} className='w-3 h-3 mr-1' />
            Cancelled
          </Chip>
        )
      case 'COMPLETED':
        return (
          <Chip className='bg-primary text-quaternary border-accent/20'>
            <FontAwesomeIcon icon={faCheckCircle} className='w-3 h-3 mr-1' />
            Completed
          </Chip>
        )
      default:
        return <Chip variant='flat'>{status}</Chip>
    }
  }

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Chip className='bg-success/10 text-success border-success/20'>Paid</Chip>
      case 'unpaid':
        return <Chip className='bg-warning/10 text-warning border-warning/20'>Unpaid</Chip>
      case 'refunded':
        return <Chip className='bg-muted/10 text-muted-foreground border-muted/20'>Refunded</Chip>
      default:
        return <Chip variant='flat'>{paymentStatus}</Chip>
    }
  }

  const updatePaymentStatus = (bookingId: string, newPaymentStatus: Booking['paymentStatus']) => {}

  const tableHeaders = [
    { key: 'Booking ID', label: 'Booking ID' },
    { key: 'Customer', label: 'Customer' },
    { key: 'Service', label: 'Service' },
    { key: 'Date & Time', label: 'Date & Time' },
    { key: 'Status', label: 'Status' },
    { key: 'Worker', label: 'Worker' },
    { key: 'Amount', label: 'Amount' },
    { key: 'Actions', label: 'Actions' },
  ]

  const tableData = filteredBookings?.map(booking => ({
    key: booking.bookingId,
    'Booking ID': booking.id,
    Customer: (
      <div>
        <p className='font-medium'>{booking.customerName}</p>
        <p className='text-sm text-muted-foreground'>{booking.customerEmail}</p>
      </div>
    ),
    Service: booking.serviceName,
    'Date & Time': (
      <div>
        <div className='flex items-center gap-1'>
          <FontAwesomeIcon icon={faCalendar} className='w-4 h-4 text-muted-foreground' />
          <span>{booking.date}</span>
        </div>
        <div className='flex items-center gap-1'>
          <FontAwesomeIcon icon={faClock} className='w-4 h-4 text-muted-foreground' />
          <span>{booking.time}</span>
        </div>
      </div>
    ),
    Status: getStatusBadge(booking.status),
    Worker: booking.workerName,
    Payment: getPaymentBadge(booking.paymentStatus),
    Amount: `${booking.amount}`,
    Actions: (
      <div className='flex gap-2'>
        <Button variant='ghost' size='sm' onPress={() => setSelectedBooking(booking)}>
          <FontAwesomeIcon icon={faEye} className='w-4 h-4' />
        </Button>
        <CustomDropdown
          dropdownTrigger={
            <Button variant='ghost' size='sm'>
              <FontAwesomeIcon icon={faEllipsisH} className='w-4 h-4' />
            </Button>
          }
          dropdownItems={[
            ...(booking.status === 'PENDING'
              ? [{ label: 'Confirm Booking', value: 'Confirm Booking' }]
              : []),
            ...(booking.status === 'CONFIRMED'
              ? [{ label: 'Booking Completed', value: 'Booking Completed' }]
              : []),
            ...(booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED'
              ? [{ label: 'Cancel Booking', value: 'Cancel Booking' }]
              : []),
          ]}
          onItemSelect={item => {
            if (item === 'Confirm Booking') confirmBooking(booking.bookingId)
            if (item === 'Booking Completed') updateBookingStatus(booking.bookingId)
            if (item === 'Cancel Booking') setCancelConfirmation(booking.bookingId)
          }}
        />
      </div>
    ),
  }))

  // Statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
    totalRevenue: bookings
      .filter(b => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + b.amount, 0),
  }

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div>
        <h2 className='text-3xl font-bold text-foreground'>Bookings Management</h2>
        <p className='text-muted-foreground'>
          Manage your salon appointments and customer bookings
        </p>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4'>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCalendar} className='w-6 h-6 text-primary' />}
          title='Total Bookings'
          className='bg-foreground-50 text-primary'
        >
          {stats.total}
        </CustomCard>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCircleExclamation} className='w-6 h-6 text-warning' />}
          title='Pending'
          className='bg-warning/10 text-warning'
        >
          {stats.pending}
        </CustomCard>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCheckCircle} className='w-6 h-6 text-success' />}
          title='Confirmed'
          className='bg-success/10 text-success'
        >
          {stats.confirmed}
        </CustomCard>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCircleExclamation} className='w-6 h-6 text-pending' />}
          title='Completed'
          className='bg-primary text-quaternary'
        >
          {stats.completed}
        </CustomCard>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCircleXmark} className='w-6 h-6 text-cancelled' />}
          title='Cancelled'
          className='bg-danger-50 text-cancelled'
        >
          {stats.cancelled}
        </CustomCard>
      </div>

      {/* Filters Section */}
      {/* <Card>
        <CardBody className='p-6'> */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground'
            />
            <Input
              placeholder='Search by customer, service, or email...'
              className='pl-10'
              value={searchTerm}
              // onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className='flex gap-2'>
          <CustomDropdown
            dropdownTrigger={
              <Button variant='bordered' size='sm'>
                <FontAwesomeIcon icon={faFilter} className='w-4 h-4' />
                <span className='ml-2'>Filters</span>
              </Button>
            }
            dropdownItems={[
              { label: 'All Status', value: 'all' },
              { label: 'Pending', value: BookingStatus.PENDING },
              { label: 'Confirmed', value: BookingStatus.CONFIRMED },
              { label: 'Cancelled', value: BookingStatus.CANCELLED },
              { label: 'Completed', value: BookingStatus.COMPLETED },
            ]}
            onItemSelect={value => setStatusFilter(value)}
          />
          <CustomDropdown
            dropdownTrigger={
              <Button variant='bordered' size='sm'>
                <FontAwesomeIcon icon={faFilter} className='w-4 h-4' />
                <span className='ml-2'>Payment Status</span>
              </Button>
            }
            dropdownItems={[
              { label: 'All Payments', value: 'all' },
              { label: 'Paid', value: PaymentStatus.PAID },
              // { label: 'Pending', value: PaymentStatus.PENDING },
              { label: 'Refunded', value: PaymentStatus.REFUNDED },
            ]}
            onItemSelect={value => setPaymentFilter(value)}
          />
        </div>
      </div>
      {/* </CardBody>
      </Card> */}

      {/* Bookings Table */}
      {/* <Card>
        <CardBody className='p-0'> */}
      <CustomTable
        tableHeaders={tableHeaders}
        tableData={tableData}
        pagination
        aria-label='Bookings table'
      />

      {/* Booking Details Dialog */}

      <CommonModal
        isOpen={!!selectedBooking}
        onOpenChange={() => setSelectedBooking(null)}
        title='Booking Details'
        size='lg'
        footer={
          selectedBooking && (
            <div className='flex justify-between items-center w-full'>
              <div className='flex gap-2'>
                {getStatusBadge(selectedBooking.status)}
                {getPaymentBadge(selectedBooking.paymentStatus)}
              </div>
              <div className='flex gap-2'>
                {selectedBooking.status === 'PENDING' && (
                  <Button
                    color='success'
                    onPress={() => {
                      confirmBooking(selectedBooking.id)
                      setSelectedBooking(null)
                    }}
                  >
                    Confirm Booking
                  </Button>
                )}
                {selectedBooking.status === 'CONFIRMED' && (
                  <Button
                    color='primary'
                    onPress={() => {
                      updateBookingStatus(selectedBooking.id)
                      setSelectedBooking(null)
                    }}
                  >
                    Booking Completed
                  </Button>
                )}
                {selectedBooking.status !== 'CANCELLED' &&
                  selectedBooking.status !== 'COMPLETED' && (
                    <Button
                      color='danger'
                      variant='flat'
                      isDisabled={isCancelling}
                      onPress={() => {
                        cancelBooking({ bookingId: selectedBooking.id })
                        setSelectedBooking(null)
                      }}
                    >
                      Cancel Booking
                    </Button>
                  )}
              </div>
            </div>
          )
        }
      >
        {selectedBooking && (
          <BookingDetailsView
            booking={selectedBooking}
            // onStatusUpdate={updateBookingStatus}
            viewMode='salon'
          />
        )}
      </CommonModal>
      {/*Cancel confirmation modal*/}
      <CommonModal
        isOpen={cancelConfirmation !== null}
        onOpenChange={() => setCancelConfirmation(null)}
        title='Confirm Cancellation'
        size='sm'
      >
        <p>Are you sure you want to cancel this booking?</p>
        <div className='flex justify-end mt-4'>
          <Button variant='shadow' onPress={() => setCancelConfirmation(null)}>
            Cancel
          </Button>
          <Button
            variant='solid'
            color='danger'
            onPress={() => {
              logger.debug('Confirming cancellation for bookingId:', cancelConfirmation)
              if (cancelConfirmation) {
                cancelBooking({ bookingId: cancelConfirmation })
              }
            }}
            className='ml-2'
          >
            Confirm
          </Button>
        </div>
      </CommonModal>
    </div>
  )
}
