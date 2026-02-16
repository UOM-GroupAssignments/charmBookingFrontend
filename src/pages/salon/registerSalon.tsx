import { Form, Input, Button, Textarea } from '@heroui/react'
import ImageUpload from '../../components/ImageUpload'
import CustomLocationPicker from '../../components/Leaflet/CustomLocationPicker'
import React, { useCallback, useState } from 'react'
import { RegisterSalonDTO } from '../../types/salon'
import { registerSalon } from '../../actions/salonActions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import logger from '../../utils/logger'

const RegisterSalon = () => {
  const [step, setStep] = useState(1)
  const [salonImages, setSalonImages] = useState<File[]>([])
  const [gspCoordinates, setGSPCoordinates] = useState<[number, number]>()
  const [locationError, setLocationError] = useState<string>('')
  const [formData, setFormData] = useState<Partial<RegisterSalonDTO>>({})
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const navigate = useNavigate()

  const handleImageChange = useCallback((files: File[]) => {
    setSalonImages(files)
  }, [])

  const handleLocationChange = useCallback((newLocation: [number, number] | null) => {
    if (newLocation) {
      setGSPCoordinates(newLocation)
      setLocationError('') // Clear error when location is valid
    } else {
      setGSPCoordinates(undefined)
    }
  }, [])

  const handleFirstStepSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!gspCoordinates) {
      setLocationError('Location is required')
      return
    }
    const formElement = e.currentTarget
    const data = Object.fromEntries(new FormData(formElement))

    const stepOneData: Partial<RegisterSalonDTO> = {
      ...data,
      salonImages,
      latitude: gspCoordinates[0],
      longitude: gspCoordinates[1],
    }

    setFormData(stepOneData)
    setStep(2)
  }

  const handleSecondStepSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    // Create FormData for multipart submission
    const finalFormData = new FormData()

    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'salonImages') {
        finalFormData.append(key, value as string)
      }
    })

    // Add password
    finalFormData.append('password', password)

    //TODO:fix the multiple image sending
    // Add images
    if (salonImages.length > 0) {
      salonImages.forEach(file => {
        finalFormData.append('salonImages', file)
      })
    }

    mutate(finalFormData)
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) => registerSalon(formData),
    onSuccess: data => {
      logger.info('Salon registered successfully')
      navigate('/business/login-salon')
    },
    onError: error => {
      logger.error('Failed to register salon:', error)
      // Optionally show error message
    },
  })

  return (
    <div>
      <div className='flex flex-row ml-10 mt-10 gap-3 cursor-pointer' onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faChevronLeft} size='2x' className='self-center' />
        <div className='text-2xl font-medium'>For Register</div>
      </div>
      <div className='min-h-screen flex flex-col items-center justify-center px-6 py-10 font-sans'>
        <h1 className='text-4xl font-semibold mb-8 text-center'>REGISTER FORM</h1>
        {step === 1 && (
          <Form
            onSubmit={handleFirstStepSubmit}
            className='w-2/3 bg-white p-10 rounded-xl shadow-md items-end'
          >
            <div className='flex flex-row gap-6 w-full'>
              <div className='w-1/2 flex flex-col gap-6'>
                <Input
                  isRequired
                  label='Business Email'
                  labelPlacement='outside'
                  name='email'
                  placeholder='Enter your email'
                  type='email'
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  isRequired
                  label='Owner Name'
                  labelPlacement='outside'
                  name='ownerName'
                  placeholder="Enter the owner's name"
                  type='text'
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                />
                <Input
                  isRequired
                  label='Address'
                  labelPlacement='outside'
                  name='location'
                  placeholder='Enter the business Address'
                  type='text'
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
                <div className='text-base'>
                  Select the location <span className='text-red-500'>*</span>
                </div>
                <CustomLocationPicker initialLocation={null} onChange={handleLocationChange} />
                {locationError && <p className='text-red-500 text-sm mt-2'>{locationError}</p>}
              </div>

              <div className='w-1/2 flex flex-col gap-6'>
                <Input
                  isRequired
                  label='Business Name'
                  labelPlacement='outside'
                  name='name'
                  placeholder='Enter your business name'
                  type='text'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  isRequired
                  label='Business Phone No.'
                  labelPlacement='outside'
                  name='phone'
                  placeholder='Enter your business phone number'
                  type='tel'
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <Textarea
                  isRequired
                  label='Business Description'
                  labelPlacement='outside'
                  name='description'
                  placeholder='Enter a brief description of your business'
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
                <ImageUpload
                  label='Add photos of your Business'
                  name='salonImages'
                  multiple={true}
                  onChange={(files: File[]) => setSalonImages(files)}
                />
              </div>
            </div>

            <div className='flex justify-between gap-4 mt-8'>
              <Button color='primary' type='submit'>
                Submit
              </Button>
              <Button type='reset' variant='flat'>
                Reset
              </Button>
            </div>
          </Form>
        )}
        {step === 2 && (
          <Form
            onSubmit={handleSecondStepSubmit}
            className='w-1/3 bg-white p-10 rounded-xl shadow-md items-center'
          >
            <h2 className='text-2xl font-semibold mb-2 text-center'>Create Your Account</h2>
            <p className='text-gray-500 text-sm mb-4'>
              Set up a secure password for your salon account
            </p>
            <Input
              isRequired
              label='Password'
              labelPlacement='outside'
              name='password'
              type='password'
              placeholder='Enter a password'
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setPasswordError('')
              }}
            />
            <Input
              isRequired
              label='Confirm Password'
              labelPlacement='outside'
              name='confirmPassword'
              type='password'
              placeholder='Confirm your password'
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value)
                setPasswordError('')
              }}
            />
            {passwordError && <p className='text-red-500 text-sm mt-2'>{passwordError}</p>}
            <div className='flex justify-between gap-4 mt-8 w-full'>
              <Button type='button' variant='flat' onPress={() => setStep(1)}>
                Back
              </Button>
              <div className='flex gap-4'>
                <Button color='primary' type='submit'>
                  Submit
                </Button>
                <Button type='reset' variant='flat'>
                  Reset
                </Button>
              </div>
            </div>
          </Form>
        )}
      </div>
    </div>
  )
}

export default RegisterSalon
