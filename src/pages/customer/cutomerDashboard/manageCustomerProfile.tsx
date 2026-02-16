import { useState } from 'react'
import logger from '../../../utils/logger'
import {
  faUser,
  faLock,
  faCreditCard,
  faPhone,
  faEnvelope,
  faCamera,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Input, Tabs, Tab, Avatar, Spinner } from '@heroui/react'
import { CustomCard } from '../../../components/Cards/CustomCard'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getCustomerProfile,
  updateCustomerByID,
  updateCustomerPassword,
} from '../../../actions/customerActions'
import useAuthUser from 'react-auth-kit/hooks/useAuthUser'
import { Customer, LoginResponse, UpdatePassword } from '../../../types/customer'
import useSignIn from 'react-auth-kit/hooks/useSignIn'
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader'

export function ManageCustomerProfile() {
  const [selected, setSelected] = useState('profile')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [editedFields, setEditedFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const customer = useAuthUser<Customer>()
  const queryClient = useQueryClient()
  const signIn = useSignIn()
  const authHeader = useAuthHeader()

  // Get customer profile data
  const { data: profile, isPending } = useQuery({
    queryKey: ['customerProfile', customer!.customerId],
    enabled: !!customer!.customerId,
    queryFn: () => getCustomerProfile(customer!.customerId!, authHeader!),
  })

  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: (profileData: Partial<LoginResponse>) =>
      updateCustomerByID(customer!.customerId!, profileData, authHeader!),
    onSuccess: data => {
      logger.info('Profile updated successfully')
      // Add toast notification here
    },
    onError: error => {
      logger.error('Error updating profile:', error)
      // Add error notification here
    },
  })

  //update password
  const { mutate: updatePassword, isPending: isPasswordUpdating } = useMutation({
    mutationFn: (passwordData: UpdatePassword) =>
      updateCustomerPassword(customer!.customerId!, passwordData, authHeader!),
    onSuccess: data => {
      logger.info('Password updated successfully')
      // Add toast notification here
    },
    onError: error => {
      logger.error('Error updating password:', error)
      // Add error notification here
    },
  })

  if (!profile || isPending || isUpdating || isPasswordUpdating) {
    return (
      <Spinner label='Loading profile...' className='flex items-center justify-center h-screen' />
    )
  }

  const commonInput = (
    label: string,
    value: string,
    fieldName: keyof typeof editedFields,
    type: string = 'text',
  ) => (
    <Input
      label={label}
      type={type}
      defaultValue={value}
      onChange={e => {
        const newValue = e.currentTarget.value
        setEditedFields(prev => ({
          ...prev,
          [fieldName]: newValue !== value ? newValue : '',
        }))
      }}
    />
  )

  return (
    <div className='space-y-6'>
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
            <CustomCard title='Personal Information' icon={<FontAwesomeIcon icon={faCamera} />}>
              <div className='flex justify-center mb-6'>
                <Avatar
                  name={`${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`}
                  size='lg'
                  className='w-24 h-24'
                />
              </div>
              {commonInput('First Name', profile.firstName, 'firstName')}
              {commonInput('Last Name', profile.lastName, 'lastName')}
              {commonInput('Email', profile.email, 'email', 'email')}
              {commonInput('Phone', profile.phone, 'phone')}
              <Button
                color='primary'
                className='mt-4 w-full'
                isDisabled={!Object.values(editedFields).some(Boolean)}
                onPress={() => {
                  const updatedFields = Object.fromEntries(
                    Object.entries(editedFields).filter(([_, value]) => value !== ''),
                  )
                  updateProfile(updatedFields as Partial<LoginResponse>)
                  setEditedFields({ firstName: '', lastName: '', email: '', phone: '' })
                }}
              >
                Update Profile
              </Button>
            </CustomCard>

            <CustomCard title='Change Password' icon={<FontAwesomeIcon icon={faLock} />}>
              <Input
                label='Current Password'
                type='password'
                value={passwordData.currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData(pd => ({ ...pd, currentPassword: e.currentTarget.value }))
                }
              />
              <Input
                label='New Password'
                type='password'
                value={passwordData.newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData(pd => ({ ...pd, newPassword: e.currentTarget.value }))
                }
              />
              <Input
                label='Confirm Password'
                type='password'
                value={passwordData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData(pd => ({ ...pd, confirmPassword: e.currentTarget.value }))
                }
              />
              <Button
                color='primary'
                className='mt-4 w-full'
                onPress={() => {
                  /* change password logic */
                }}
              >
                Change Password
              </Button>
            </CustomCard>
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}
