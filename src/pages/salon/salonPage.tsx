import { useState, useRef, useEffect } from 'react'
import ModalComponent from '../../components/Modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMapMarkerAlt,
  faChevronRight,
  faChevronLeft,
  faClock,
} from '@fortawesome/free-solid-svg-icons'
import StarRating from '../../components/StarRating'
import { useParams } from 'react-router-dom'
import ServiceField from '../../components/ServiceField'
import { Category, Salon } from '../../types/salon'
import { calculateRatingAverage } from '../../helpers'
import ReviewCard from '../../components/Cards/ReviewCard'
import {
  formatTime,
  getSalonNextOpenTime,
  getSalonState,
  isTodayDayOfWeek,
} from '../../utils/helper'
import { useQuery } from '@tanstack/react-query'
import { getSalonById } from '../../actions/customerActions'
import { CircularProgress, Divider } from '@heroui/react'
import { isValidImageUrl } from '../../utils/validateImage'

const SalonPage = () => {
  const { salonId } = useParams()
  console.log('Salon ID:', salonId)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const { data: salonData, isPending: loadingSalonData } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: () => getSalonById(salonId!),
    enabled: !!salonId,
  })

  const imageUrls = salonData?.images
  ?.map(img => img.url)
  .filter(url => isValidImageUrl(url)) || [];
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -100, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 100, behavior: 'smooth' })
  }

  if (loadingSalonData) return <CircularProgress />

  return (
    <div className='p-10'>
      <div className='grid grid-cols-2 grid-rows-2 gap-2 w-full h-96 bg-white p-4 rounded-xl shadow-md'>
        {salonData?.images && salonData.images.length > 0 ? (
          <>
            {/* First image spans both columns in the first row */}
            <div
              className={`${
                salonData.images.length == 1 ? 'col-span-2 row-span-2' : 'col-span-1row-span-2'
              } relative`}
            >
              <img
                src={imageUrls[0] || '/placeholder-image.avif'}
                alt={`${salonData.name} - Image 1`}
                className='w-full h-full object-cover rounded-xl'
                onError={e => {
                  e.currentTarget.src = '/placeholder-image.avif'
                }}
              />
            </div>
            {/* Second image in the first column of the second row */}
            {salonData.images[1] && (
              <div
                className={`col-span-1 ${
                  salonData.images.length > 2 ? 'row-span-1' : 'row-span-2'
                } relative`}
              >
                <img
                  src={imageUrls[1] || '/placeholder-image.avif'}
                  alt={`${salonData.name} - Image 2`}
                  className='w-full h-full object-cover rounded-xl'
                  onError={e => {
                    e.currentTarget.src = '/placeholder-image.avif'
                  }}
                />
              </div>
            )}
            {/* Third image in the second column of the second row */}
            <div className='col-span-1 row-span-1 relative'>
              {salonData.images[2] && (
                <>
                  <img
                    src={imageUrls[2] || '/placeholder-image.avif'}
                    alt={`${salonData.name} - Image 3`}
                    className='w-full h-full object-cover rounded-xl'
                    onError={e => {
                      e.currentTarget.src = '/placeholder-image.avif'
                    }}
                  />
                  {salonData.images.length > 3 && (
                    <div
                      className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white cursor-pointer rounded-xl'
                      onClick={handleOpen}
                    >
                      +{salonData.images.length - 3} More
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className='col-span-2 row-span-2 flex items-center justify-center bg-gray-100 rounded-xl'>
            <p className='text-gray-500'>No images available</p>
          </div>
        )}
      </div>
      <ModalComponent images={imageUrls} isOpen={isOpen} onClose={handleClose} />

      <div className='flex justify-between w-full mt-10 gap-8'>
        <div className='bg-white p-8 rounded-xl shadow-md'>
          <div className='font-instrumentSerif text-5xl font-bold mb-4'>{salonData?.name}</div>
          <div className='text-xl flex space-x-4 mb-2'>
            {salonData?.reviews && salonData.reviews.length > 0 ? (
              <>
                {/* <span>{calculateRatingAverage(salonData.reviews)}</span> */}
                <div className='flex items-center'>
                  <StarRating
                    name='read-only'
                    value={calculateRatingAverage(salonData.reviews)}
                    readOnly={true}
                    size='medium'
                  />
                </div>
                <span>
                  ({salonData.reviews.length}{' '}
                  {salonData.reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </>
            ) : (
              <span>No reviews yet</span>
            )}
          </div>
          <Divider className='m-4' />
          <div className='mb-2'>
            <FontAwesomeIcon icon={faClock} className='mr-2' />
            {getSalonState(salonData) === 'open' ? (
              <span className='text-green-500'>Open Now</span>
            ) : (
              <>
                <span className='text-red-500'>Closed</span>
                <span className='text-gray-500'> - Opens at {getSalonNextOpenTime(salonData)}</span>
              </>
            )}
          </div>
          <div className='text-md flex items-center'>
            <FontAwesomeIcon icon={faMapMarkerAlt} className='mr-2' />
            <span>{salonData?.location}</span>
          </div>
        </div>
        {/* Scrollable Category Bar */}
        <div className='bg-white p-8 rounded-xl shadow-md flex-1'>
          <div className='font-instrumentSerif text-5xl'>Services</div>
          <div className='flex flex-row w-full'>
            <div className='flex flex-col justify-center w-full'>
              <div className='relative flex items-center my-4'>
                <button
                  onClick={scrollLeft}
                  className='absolute left-0 z-10 p-2 bg-white shadow-lg rounded-full'
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <div
                  ref={scrollRef}
                  className='flex overflow-x-auto no-scrollbar w-full p-2 whitespace-nowrap mx-10 scrollbar-hide'
                >
                  {/* Add "All" button */}
                  <button
                    key='all-categories'
                    className={`px-4 py-2 mx-2 text-sm font-semibold rounded-lg hover:shadow-md hover:cursor-pointer transition-all duration-200 ${
                      !selectedCategory ? 'bg-secondary text-white' : 'bg-gray-100'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </button>
                  {[
                    ...new Map(
                      (salonData?.services || []).flatMap(service =>
                        service.categories.map(category => [category.categoryId, category]),
                      ),
                    ).values(),
                  ].map((category, index) => (
                    <button
                      key={category.categoryId || `category-${index}`}
                      className={`px-4 py-2 mx-2 text-sm font-semibold rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 ${
                        selectedCategory?.categoryId === category?.categoryId
                          ? 'bg-secondary text-white'
                          : 'bg-gray-100'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={scrollRight}
                  className='absolute right-0 z-10 p-2 bg-white shadow-lg rounded-full'
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
              {(salonData?.services || [])
                .filter(
                  service =>
                    !selectedCategory || // Show all services if no category selected
                    service.categories.some(
                      category => category.categoryId === selectedCategory.categoryId,
                    ),
                )
                .map(service => (
                  <ServiceField
                    salonId={salonData?.id}
                    serviceId={service.serviceId}
                    serviceName={service.name}
                    price={service.price}
                    time={service.duration?.toString() || '30'}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/*About us section */}
      <div className='flex flex-row gap-4 mt-10 '>
        <div className='flex flex-col w-1/2 bg-white p-8 rounded-xl shadow-md'>
          <div className='flex flex-row items-center gap-4 font-instrumentSerif text-5xl mb-4'>
            About Us
          </div>
          <div className='items-start mr-5 text-lg font-light mb-8'>
            {salonData?.description || 'No description available'}
          </div>
          <h3 className='font-instrumentSerif text-3xl mb-2'>Working Hours</h3>
          <div className='flex flex-col font-light'>
            {salonData?.weeklyHours &&
              salonData?.weeklyHours
                .sort((a, b) => {
                  const days = [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ]
                  return days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week)
                })
                .map(hours => (
                  <div
                    key={hours.id}
                    className={`flex justify-between h-10 border-b items-center p-4 rounded-md ${
                      isTodayDayOfWeek(hours.day_of_week)
                        ? 'font-medium text-primary border border-primary'
                        : ''
                    }`}
                  >
                    <span className='w-32'>{hours.day_of_week}</span>
                    <span>
                      {formatTime(hours.open_time)} - {formatTime(hours.close_time)}
                    </span>
                  </div>
                ))}
          </div>
        </div>
        <div className='flex flex-col w-1/2'>
          {salonData?.location && (
            <iframe
              width='100%'
              height='100%'
              className='rounded-xl shadow-md'
              loading='lazy'
              src={`https://maps.google.com/maps?&height=400&hl=en&q=${salonData.latitude},${salonData.longitude}&t=&z=14&ie=UTF8&iwloc=B&output=embed`}
            ></iframe>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {salonData?.reviews && salonData.reviews.length > 0 ? (
        <div className='m-4 mt-20'>
          <div className='flex flex-row items-center gap-4 font-instrumentSerif'>
            <div className='text-4xl'>Reviews</div>
            {/* <div className='mt-2 text-xl'>{calculateRatingAverage(salonData.reviews)}</div> */}
            <div className='mt-3'>
              <StarRating
                name='read-only'
                value={calculateRatingAverage(salonData.reviews)}
                readOnly={true}
              />
            </div>
          </div>
          <div className='flex flex-wrap gap-6 mt-4'>
            {salonData.reviews.map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))}
          </div>
        </div>
      ) : (
        <div className='m-4 mt-20'>
          <div className='flex flex-row items-center gap-4 font-instrumentSerif text-4xl'>
            Reviews
          </div>
          <div className='text-xl'>No reviews yet</div>
        </div>
      )}
    </div>
  )
}

export default SalonPage
