import { useState } from 'react'
import useSignIn from 'react-auth-kit/hooks/useSignIn'
import axios from 'axios'
import { addToast, Button, Input, Spinner } from '@heroui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { loginCustomer } from '../actions/customerActions'
import { LoginResponse } from '../types/customer'
import logger from '../utils/logger'

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [subLoading, setSubLoading] = useState(false)
  const signIn = useSignIn<LoginResponse>()

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await loginCustomer(email, password)
      logger.debug('logged in customer')
      return res
    },
    onSuccess: data => {
      signIn({
        auth: {
          token: data.token,
          type: 'Bearer',
        },
        userState: {
          customerId: data.customerId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          token: '',
        },
      })
      addToast({
        title: 'Login successful!',
        description: `Welcome back, ${data.firstName}!`,
        color: 'success',
      })
      // Handle navigation with return URL
      if (location.state?.returnUrl) {
        navigate(location.state.returnUrl, { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    },
    onError: error => {
      logger.error('Login failed:', error)
      setError('Login failed. Please try again.')
    },
  })

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutate(formData)
  }

  return (
    <div className='flex h-screen'>
      <div className='w-1/2 h-full p-5 flex items-center justify-center'>
        <div className='w-5/6 text-center mx-50 my-10 bg-white shadow-xl rounded-3xl py-8 px-5'>
          <div className='text-center text-primary font-extrabold text-5xl mb-10'>
            <h1>Login</h1>
          </div>

          <form onSubmit={handleLogin} className='flex flex-col gap-4 space-y-3 mr-6 ml-6'>
            <Input
              type='text'
              label='Email'
              name='email'
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              type='password'
              label='Password'
              name='password'
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
            <p className='mt-5'>
              <a href='/signup' className='text-blue-400'>
                Don't have an account? Sign Up
              </a>
            </p>
            {error && <p className='text-red-600 font-light text-sm'>{error}</p>}
            {subLoading ? (
              <Spinner color='primary' />
            ) : (
              <>
                <Button
                  type='submit'
                  color='secondary'
                  radius='lg'
                  variant='shadow'
                  className='mt-5 text-center w-full'
                >
                  Login
                </Button>
              </>
            )}
          </form>
        </div>
      </div>
      <div className='w-1/2 h-full'>
        <img
          className='object-cover w-full h-full'
          src='signup-drawing.avif'
          alt='Login Illustration'
        />
      </div>
    </div>
  )
}
