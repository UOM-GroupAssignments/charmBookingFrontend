import { useState } from 'react'
import axios from 'axios'
import { Button, Input, Spinner } from '@heroui/react'

export default function SignUp() {
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [subLoading, setSubLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: new Date(),
    phone: '',
    email: '',
    password: '',
  })

  const handleSignUp = async () => {
    setSubLoading(true)
    setError('')
    try {
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.dateOfBirth ||
        !formData.phone ||
        !formData.email ||
        !formData.password
      ) {
        throw new Error('All fields are required')
      }
      if (formData.password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }
      const res = await axios.post('https://localhost:3000/user/register', formData)
      if (res.status === 201) {
        alert('User created successfully')
        // Reset form fields on successful signup
        setFormData({
          firstName: '',
          lastName: '',
          dateOfBirth: new Date(),
          phone: '',
          email: '',
          password: '',
        })
        setConfirmPassword('')

        window.location.href = '/login'
      }
    } catch (error: unknown) {
      // Handle Axios errors separately from other errors
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.error?.message || 'An error occurred'
        setError(backendMessage)
      } else if (error instanceof Error) {
        // Handle other errors
        setError(error.message)
      } else {
        // Fallback for any other unknown error types
        setError('An unknown error occurred')
      }
    } finally {
      setSubLoading(false) // Stop loading spinner
    }
  }

  return (
    <div className='flex h-screen'>
      <div className='w-1/2 h-full p-5 flex items-center justify-center'>
        <div className='w-5/6 text-center mx-50 my-10 bg-white shadow-xl rounded-3xl py-8 px-5'>
          <div className='text-center text-primary font-extrabold text-5xl mb-10'>
            <h1>Sign Up</h1>
          </div>
          <div className='flex flex-col gap-4 space-y-3 mr-6 ml-6'>
            <div className='flex justify-between gap-4'>
              <Input
                type='text'
                label='First Name'
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                type='text'
                label='Last Name'
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <Input
              type='date'
              label='Date of Birth'
              onChange={e => setFormData({ ...formData, dateOfBirth: new Date(e.target.value) })}
            />
            <Input
              type='tel'
              label='Phone Number'
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              type='email'
              label='Email'
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            <div className='flex justify-between gap-4'>
              <Input
                type='password'
                label='Password'
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <Input
                type='password'
                label='Confirm Password'
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className='text-red-600 font-light text-sm'>{error}</p>}
          </div>
          {subLoading ? (
            <Spinner color='primary' />
          ) : (
            <>
              <p className='mt-5 '>
                <a href='/login' className='text-blue-400 '>
                  Already have an Account?
                </a>
              </p>
              <Button
                onPress={handleSignUp}
                color='secondary'
                radius='lg'
                variant='shadow'
                className='mt-5 text-center'
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
      <div className='w-1/2 h-full'>
        <img className='object-cover w-full h-full' src='signup-drawing.avif'></img>
      </div>
    </div>
  )
}
