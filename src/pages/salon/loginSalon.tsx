import { Form, Input, Button } from '@heroui/react'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { loginSalon } from '../../actions/salonActions'
import { useNavigate } from 'react-router-dom'
import useSignIn from 'react-auth-kit/hooks/useSignIn'
import { SalonAdmin } from '../../types/salon'
import logger from '../../utils/logger'

const LoginSalon = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<Error | null>(null)
  const navigate = useNavigate()
  const signIn = useSignIn<SalonAdmin>()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const { mutate, isPending } = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginSalon(email, password),
    onSuccess: data => {
      logger.debug('Login successful')
      signIn({
        auth: {
          token: data.token,
          type: 'Bearer',
        },
        userState: data.salon,
      })
      navigate('/business/dashboard/account')
    },
    onError: error => {
      setError(error)
    },
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({ email: form.email, password: form.password })
  }

  if (isPending) {
    return <div>Loading...</div>
  }

  const handleReset = () => {
    setForm({ email: '', password: '' })
  }

  return (
    <div className='flex h-screen'>
      <div className=' flex flex-col w-1/2 h-full items-center justify-center font-sans'>
        <h1 className='text-4xl font-semibold mb-8 text-center'>Login to Your Salon</h1>
        <Form
          onSubmit={handleLogin}
          className=' bg-white w-2/3 p-10 rounded-xl shadow-md flex flex-col items-center'
        >
          <Input
            label='Email'
            name='email'
            type='email'
            placeholder='Enter your email'
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label='Password'
            name='password'
            type='password'
            placeholder='Enter your password'
            value={form.password}
            onChange={handleChange}
            required
          />
          {error && <div className='text-red-500 text-sm mb-2'>{error.message}</div>}
          <div className='flex justify-between gap-4 mt-8 w-full'>
            <Button color='primary' type='submit' className='flex-1'>
              Login
            </Button>
            <Button type='reset' variant='flat' onPress={handleReset} className='flex-1'>
              Reset
            </Button>
          </div>
        </Form>
      </div>
      <div className='w-1/2 h-full'>
        <img
          className='object-cover w-full h-full'
          src='/signup-drawing.avif'
          alt='Salon Login Illustration'
        />
      </div>
    </div>
  )
}

export default LoginSalon
