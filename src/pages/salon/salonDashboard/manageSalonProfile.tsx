import { useState } from 'react'
import {
  faUser,
  faLock,
  faCreditCard,
  faImage,
  faClock,
  faGear,
  faCamera,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Input, Tabs, Tab, Avatar, Badge, Spinner, Textarea, Checkbox } from '@heroui/react'
import { CustomCard } from '../../../components/Cards/CustomCard'
import { BaseSalon, DaysOfWeek, SalonAdmin, WeeklyHours } from '../../../types/salon'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getSalonPaymentMethod,
  getSalonProfile,
  getSalonWeeklyHours,
  updateSalonProfile,
  updateSalonWeeklyHours,
} from '../../../actions/salonActions'
import CustomUpload from '../../../components/ImageUpload'
import useAuthUser from 'react-auth-kit/hooks/useAuthUser'
import { SalonSubmitDetails } from './salonSubmitDetails'
import { VerificationStatus } from '../../../types/superAdmin'
import logger from '../../../utils/logger'

export function AccountPage() {
  const [selected, setSelected] = useState('profile')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const admin = useAuthUser<SalonAdmin>()

  //salon profile
  const { data: profile, isPending } = useQuery({
    queryKey: ['salonProfile'],
    enabled: !!admin?.salonId,
    queryFn: () => getSalonProfile(admin!.salonId),
  })
  const { mutate, isPending: isUpdating } = useMutation({
    mutationFn: (profileData: Partial<BaseSalon>) =>
      updateSalonProfile(admin!.salonId, profileData),
    onSuccess: data => {
      // Handle success, e.g., show a toast or update state
      logger.info('Profile updated successfully')
    },
    onError: error => {
      // Handle error, e.g., show an error message
      logger.error('Error updating profile:', error)
    },
  })

  //weeklyHours
  const { data: weeklyHours, isPending: hoursLoading } = useQuery({
    queryKey: ['salonWeeklyHours', admin?.salonId],
    enabled: !!admin?.salonId,
    queryFn: () => getSalonWeeklyHours(admin!.salonId),
  })

  logger.debug('weekly hours', weeklyHours)

  const { mutate: updateWeeklyHours } = useMutation({
    mutationFn: (weeklyHours: WeeklyHours[]) => updateSalonWeeklyHours(admin!.salonId, weeklyHours),
    onSuccess: data => {
      // Handle success, e.g., show a toast or update state
      logger.info('Weekly hours updated successfully')
    },
    onError: error => {
      // Handle error, e.g., show an error message
      logger.error('Error updating weekly hours:', error)
    },
  })

  //payment
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['salonPaymentMethods'],
    queryFn: () => getSalonPaymentMethod('1'),
  })

  if (!profile || isPending || isUpdating) {
    return (
      <Spinner label='Loading profile...' className='flex items-center justify-center h-screen' />
    )
  }

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ]
  const commonInput = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    type: string = 'text',
  ) => (
    <Input
      label={label}
      type={type}
      value={value}
      onChange={e => onChange(e.currentTarget.value)}
    />
  )

  // const updateDayHours = (day: keyof WeeklyHours, updates: Partial<WeeklyHours[keyof WeeklyHours]>) => {
  //   if (!weeklyHours) return
  //   saveWeeklyHours({
  //     ...weeklyHours,
  //     [day]: { ...weeklyHours[day], ...updates },
  //   })
  // }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-3xl font-bold text-foreground'>Salon Profile Management</h2>
        <p className='text-muted-foreground'>Manage your salon details</p>
      </div>
      <Tabs selectedKey={selected} onSelectionChange={k => setSelected(String(k))}>
        <Tab
          key='profile'
          title={
            <span className='flex items-center gap-2'>
              <FontAwesomeIcon icon={faUser} /> Profile
            </span>
          }
        >
          <div className='grid lg:grid-cols-2 gap-6'>
            <CustomCard title='Salon Profile' icon={<FontAwesomeIcon icon={faCamera} />}>
              {commonInput('Salon Name', profile.name, () => {})}
              {commonInput('Owner Name', profile.ownerName, () => {})}
              {commonInput('Email', profile.email, () => {}, 'email')}
              {commonInput('Phone', profile.phone, () => {})}
              <Textarea
                label='Description'
                rows={3}
                value={profile.description}
                onChange={() => {}}
              />
              <Button
                onPress={() => {
                  /* update logic */
                }}
                className='mt-4'
              >
                Update Profile
              </Button>
            </CustomCard>

            <CustomCard title='Change Password' icon={<FontAwesomeIcon icon={faLock} />}>
              {commonInput(
                'Current Password',
                passwordData.currentPassword,
                val => setPasswordData(pd => ({ ...pd, currentPassword: val })),
                'password',
              )}
              {commonInput(
                'New Password',
                passwordData.newPassword,
                val => setPasswordData(pd => ({ ...pd, newPassword: val })),
                'password',
              )}
              {commonInput(
                'Confirm Password',
                passwordData.confirmPassword,
                val => setPasswordData(pd => ({ ...pd, confirmPassword: val })),
                'password',
              )}
              <Button
                onPress={() => {
                  /* change pass logic */
                }}
                className='mt-4'
              >
                Change Password
              </Button>
            </CustomCard>
          </div>
        </Tab>

        <Tab
          key='payments'
          title={
            <span className='flex items-center gap-2'>
              <FontAwesomeIcon icon={faCreditCard} /> Payments
            </span>
          }
        >
          <div className='space-y-6'>
            <CustomCard
              title='Payment Methods'
              icon={<FontAwesomeIcon icon={faCreditCard} />}
              footer={
                <Button variant='solid'>
                  <FontAwesomeIcon icon={faGear} /> Settings
                </Button>
              }
            >
              {paymentMethodsData?.map((m, idx) => (
                <div
                  key={m.id ?? idx}
                  className='flex items-center justify-between px-4 py-2 border rounded-lg'
                >
                  <div>
                    <p className='font-medium'>{m.name}</p>
                    <p className='text-sm'>{m.identifier}</p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge
                    // variant={
                    //   m.status === 'connected'
                    //     ? 'solid'
                    //     : m.status === 'pending'
                    //     ? 'flat'
                    //     : undefined
                    // }
                    >
                      {m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : ''}
                    </Badge>
                    {m.isDefault && <Badge variant='flat'>Default</Badge>}
                  </div>
                </div>
              ))}
            </CustomCard>

            <CustomCard title='Payout Settings' icon={<FontAwesomeIcon icon={faGear} />}>
              {/* Add payout details */}
            </CustomCard>

            <CustomCard title='Recent Payments' icon={<FontAwesomeIcon icon={faCreditCard} />}>
              {/* Payment history UI */}
            </CustomCard>
          </div>
        </Tab>
        <Tab
          key='weeklyHours'
          title={
            <span className='flex items-center gap-2'>
              <FontAwesomeIcon icon={faClock} /> Weekly Hours
            </span>
          }
        >
          <div className='space-y-6'>
            <CustomCard title='Weekly Hours' icon={<FontAwesomeIcon icon={faClock} />}>
              {hoursLoading || !weeklyHours ? (
                <Spinner label='Loading weekly hours...' />
              ) : (
                <div className='grid gap-4'>
                  {days.map(({ key, label }) => {
                    const dayHours = weeklyHours.find(
                      wh => wh.day_of_week.toLowerCase() === label.toLowerCase(),
                    )

                    const isOpen = !!(dayHours && dayHours.open_time && dayHours.close_time)

                    return (
                      <div
                        key={key}
                        className={`p-4 border rounded-lg ${!isOpen ? 'bg-gray-100' : 'bg-white'}`}
                      >
                        <div className='flex items-center justify-between mb-3'>
                          <h4 className='font-medium'>{label}</h4>
                          <Checkbox
                            isSelected={isOpen}
                            onValueChange={val => {
                              const updated = weeklyHours.map(wh =>
                                wh.day_of_week === label
                                  ? {
                                      ...wh,
                                      open_time: val ? wh.open_time || '09:00' : '',
                                      close_time: val ? wh.close_time || '17:00' : '',
                                    }
                                  : wh,
                              )
                              updateWeeklyHours(updated)
                            }}
                          >
                            Open
                          </Checkbox>
                        </div>

                        {isOpen ? (
                          <div className='grid grid-cols-2 gap-4'>
                            <Input
                              type='time'
                              label='Opening'
                              value={dayHours?.open_time || ''}
                              onChange={e => {
                                const updated = weeklyHours.map(wh =>
                                  wh.day_of_week === label
                                    ? { ...wh, open_time: e.target.value }
                                    : wh,
                                )
                                updateWeeklyHours(updated)
                              }}
                            />
                            <Input
                              type='time'
                              label='Closing'
                              value={dayHours?.close_time || ''}
                              onChange={e => {
                                const updated = weeklyHours.map(wh =>
                                  wh.day_of_week === label
                                    ? { ...wh, closeTime: e.target.value }
                                    : wh,
                                )
                                updateWeeklyHours(updated)
                              }}
                            />
                          </div>
                        ) : (
                          <p className='text-gray-400 text-sm'>Closed</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              <Button
                className='mt-6 w-full'
                color='primary'
                onPress={() => weeklyHours && updateWeeklyHours(weeklyHours)}
              >
                Save Weekly Hours
              </Button>
            </CustomCard>
          </div>
        </Tab>
        <Tab
          key='gallery'
          title={
            <span className='flex items-center gap-2'>
              <FontAwesomeIcon icon={faImage} /> Gallery
            </span>
          }
        >
          <CustomCard title='Salon Gallery' icon={<FontAwesomeIcon icon={faImage} />}>
            <CustomUpload />
          </CustomCard>
        </Tab>
        <Tab
          key='submit-details'
          title={
            <span
              className={`flex items-center gap-2 ${
                profile.verificationStatus === VerificationStatus.PENDING
                  ? 'text-yellow-800 animate-blink'
                  : profile.verificationStatus === VerificationStatus.VERIFIED
                  ? ''
                  : ''
              }`}
            >
              <FontAwesomeIcon icon={faPaperPlane} /> Get Verified
            </span>
          }
        >
          {profile.verificationStatus === VerificationStatus.VERIFIED ? (
            <div className='p-6 text-green-600 font-semibold text-center'>
              You are already verified.
            </div>
          ) : (
            <SalonSubmitDetails salonId={profile.id} />
          )}
        </Tab>
      </Tabs>
    </div>
  )
}
