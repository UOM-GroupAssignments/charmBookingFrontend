import { useState } from 'react'
import logger from '../../../utils/logger'
import {
  faCalendar,
  faClock,
  faScissors,
  faStore,
  faFilter,
  faEye,
  faCircleCheck,
  faCircleXmark,
  faCircleExclamation,
  faMagnifyingGlass,
  faStar,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CustomCard } from '../../../components/Cards/CustomCard'
import { CustomTable } from '../../../components/Table'
import { addToast, Badge, Button, Chip, Input } from '@heroui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import useAuthUser from 'react-auth-kit/hooks/useAuthUser'
import { CreateReview, Customer } from '../../../types/customer'
import CommonModal from '../../../components/commonModal'
import BookingDetailsView from '../../../components/Booking/BookingDetailsView'
import { createReview, getCustomerBookingsById } from '../../../actions/customerActions'
import { CustomerBooking, BookingStatus } from '../../../types/booking'
import { cancelConfirmedBookingCustomer } from '../../../actions/bookingActions'
import StarRating from '../../../components/StarRating'
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader'

export function CustomerBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<CustomerBooking | null>(null)
  const customer = useAuthUser<Customer>()
  const queryClient = useQueryClient()
  const [cancelConfirmation, setCancelConfirmation] = useState<string | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<CustomerBooking | null>(
    null,
  )
  const authHeader = useAuthHeader()

  // Fetch customer bookings
  const { data: bookings, isPending } = useQuery<CustomerBooking[]>({
    queryKey: ['customerBookings', customer!.customerId],
    enabled: !!customer!.customerId && !!authHeader,
    queryFn: () => getCustomerBookingsById(customer!.customerId, authHeader!),
  })

  // Add cancel booking mutation
  const { mutate: cancelBooking, isPending: isCancelling } = useMutation({
    mutationFn: (bookingId: string) =>
      cancelConfirmedBookingCustomer(bookingId, customer!.customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerBookings'] })
      addToast({
        title: 'Booking cancelled successfully',
        description: 'Your booking has been cancelled.',
        color: 'success',
      })
      setCancelConfirmation(null)
    },
    onError: error => {
      addToast({
        title: 'Error cancelling booking',
        description: 'Failed to cancel booking. Please try again.',
        color: 'danger',
      })
      logger.error('Error cancelling booking:', error)
    },
  })

  //Add review to completed bookings
  const { mutate: addReview, isPending: addingReview } = useMutation({
    mutationFn: ({
      bookingId,
      userId,
      data,
    }: {
      bookingId: string
      userId: string
      data: CreateReview
    }) => createReview(bookingId, userId, data, authHeader!),
    onSuccess: () => {
      addToast({
        title: 'Review added successfully',
        description: 'Your review has been added.',
        color: 'success',
      })
    },
    onError: error => {
      addToast({
        title: 'Error adding review',
        description: 'Failed to add review. Please try again.',
        color: 'danger',
      })
    },
  })

  const calculateCanCancel = (booking: CustomerBooking): boolean => {
    if (!booking) return false
    // Can't cancel if already cancelled or completed
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return false
    }
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`)
    const now = new Date()
    const hoursDifference = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursDifference > 24
  }

  if (!bookings || isPending) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-muted-foreground'>Loading your bookings...</div>
      </div>
    )
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.salonName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Chip className='bg-success/10 text-success border-success/20'>
            <FontAwesomeIcon icon={faCircleCheck} className='w-3 h-3 mr-1' />
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
          <Chip className='bg-cancelled/10 text-cancelled border-cancelled/20'>
            <FontAwesomeIcon icon={faCircleXmark} className='w-3 h-3 mr-1' />
            Cancelled
          </Chip>
        )
      default:
        return <Chip variant='flat'>{status}</Chip>
    }
  }

  // Statistics for customer
  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => ['CONFIRMED', 'PENDING'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'COMPLETED').length,
    cancelled: bookings.filter(b => b.status === 'CANCELLED').length,
  }

  const tableHeaders = [
    { key: 'Salon', label: 'Salon' },
    { key: 'Service', label: 'Service' },
    { key: 'Date & Time', label: 'Date & Time' },
    { key: 'Booking Status', label: 'Status' },
    { key: 'Amount', label: 'Amount' },
    { key: 'Actions', label: 'Actions' },
  ]

  const tableData = filteredBookings.map(booking => ({
    key: booking.id,
    Salon: (
      <div>
        <p className='font-medium'>{booking.salonName}</p>
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
    'Booking Status': getStatusBadge(booking.status),
    Amount: `LKR ${booking.amount}`,
    Actions: (
      <div className='flex gap-2'>
        <Button variant='ghost' size='sm' onPress={() => setSelectedBooking(booking)}>
          <FontAwesomeIcon icon={faEye} className='w-4 h-4' />
        </Button>
        {calculateCanCancel(booking) && (
          <Button
            variant='ghost'
            size='sm'
            color='danger'
            isDisabled={isCancelling}
            onPress={() => {
              logger.debug('Initiating cancellation for bookingId:', booking.id)
              setCancelConfirmation(booking.id)
            }}
          >
            <FontAwesomeIcon icon={faCircleXmark} className='w-4 h-4' />
          </Button>
        )}
        {booking.status === 'COMPLETED' && (
          <Button
            variant='ghost'
            size='sm'
            color='primary'
            isDisabled={addingReview}
            onPress={() => {
              setSelectedBookingForReview(booking)
              setReviewModalOpen(true)
            }}
          >
            <FontAwesomeIcon icon={faStar} className='w-4 h-4' />
          </Button>
        )}
      </div>
    ),
  }))

  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div>
        <h2 className='text-3xl font-bold text-foreground'>My Bookings</h2>
        <p className='text-muted-foreground'>View and manage your salon appointments</p>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCalendar} className='w-6 h-6 text-primary' />}
          title='Total Bookings'
          className='bg-primary/10 text-primary'
        >
          {stats.total}
        </CustomCard>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCircleCheck} className='w-6 h-6 text-success' />}
          title='Upcoming'
          className='bg-success/10 text-success'
        >
          {stats.upcoming}
        </CustomCard>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCircleCheck} className='w-6 h-6 text-accent' />}
          title='Completed'
          className='bg-accent/10 text-accent'
        >
          {stats.completed}
        </CustomCard>
        <CustomCard
          icon={<FontAwesomeIcon icon={faCircleXmark} className='w-6 h-6 text-cancelled' />}
          title='Cancelled'
          className='bg-cancelled/10 text-cancelled'
        >
          {stats.cancelled}
        </CustomCard>
      </div>

      {/* Filters Section */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='flex-1'>
          <div className='relative'>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground'
            />
            <Input
              placeholder='Search by salon or service...'
              className='pl-10'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button
          variant='bordered'
          size='sm'
          onPress={() => setStatusFilter(prev => (prev === 'all' ? 'upcoming' : 'all'))}
        >
          <FontAwesomeIcon icon={faFilter} className='w-4 h-4 mr-2' />
          {statusFilter === 'all' ? 'Show Upcoming' : 'Show All'}
        </Button>
      </div>

      {/* Bookings Table */}
      {!tableData.length ? (
        <p className='text-muted-foreground'>No bookings found</p>
      ) : (
        <CustomTable tableHeaders={tableHeaders} tableData={tableData} pagination />
      )}

      {/* Booking Details Modal */}
      <CommonModal
        isOpen={!!selectedBooking}
        onOpenChange={() => setSelectedBooking(null)}
        title='Booking Details'
        size='lg'
      >
        {selectedBooking && (
          <BookingDetailsView
            booking={{
              ...selectedBooking,
              status: selectedBooking.status.toUpperCase() as
                | BookingStatus.PENDING
                | BookingStatus.CONFIRMED
                | BookingStatus.CANCELLED
                | BookingStatus.COMPLETED,
            }}
            viewMode='customer'
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
                cancelBooking(cancelConfirmation)
              }
            }}
            className='ml-2'
          >
            Confirm
          </Button>
        </div>
      </CommonModal>

      {/* Add Review Modal */}
      <CommonModal
        isOpen={reviewModalOpen}
        onOpenChange={open => {
          if (!open) {
            setReviewModalOpen(false)
            setReviewComment('')
            setReviewRating(0)
            setSelectedBookingForReview(null)
          }
        }}
        title='Add Review'
        size='sm'
      >
        {selectedBookingForReview && (
          <div className='space-y-6'>
            <div className='bg-gray-50 p-3 rounded-lg'>
              <p className='font-medium'>{selectedBookingForReview.salonName}</p>
              <p className='text-sm text-gray-500'>{selectedBookingForReview.serviceName}</p>
            </div>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>Rating</label>
                <StarRating
                  name='booking-rating'
                  value={reviewRating}
                  onChange={(_, value) => setReviewRating(value || 0)}
                  size='large'
                />
              </div>

              <div>
                <label className='block text-sm font-medium mb-2'>Comment</label>
                <Input
                  placeholder='Share your experience...'
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className='w-full'
                />
              </div>
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                variant='flat'
                onPress={() => {
                  setReviewModalOpen(false)
                  setReviewComment('')
                  setReviewRating(0)
                  setSelectedBookingForReview(null)
                }}
              >
                Cancel
              </Button>
              <Button
                color='primary'
                isDisabled={!reviewRating || !reviewComment.trim() || addingReview}
                onPress={() => {
                  if (selectedBookingForReview) {
                    addReview({
                      bookingId: selectedBookingForReview.id,
                      userId: customer!.customerId,
                      data: {
                        rating: reviewRating,
                        comment: reviewComment,
                        salonId: selectedBookingForReview.salon_id,
                      },
                    })
                    setReviewModalOpen(false)
                    setReviewComment('')
                    setReviewRating(0)
                    setSelectedBookingForReview(null)
                  }
                }}
              >
                {addingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        )}
      </CommonModal>
    </div>
  )
}
