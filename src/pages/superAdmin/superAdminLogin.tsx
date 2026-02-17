import { useState, useEffect, useRef } from 'react'
import useSignIn from 'react-auth-kit/hooks/useSignIn'
import axios from 'axios'
import { Button, Input, Spinner } from '@heroui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { loginSuperAdmin } from '../../actions/superAdminActions'
import { SuperAdminLoginResponse } from '../../types/superAdmin'
import logger from '../../utils/logger'

export default function SuperAdminLogin() {
  const location = useLocation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState('')
  const [subLoading, setSubLoading] = useState(false)
  const signIn = useSignIn<SuperAdminLoginResponse>()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!lockedUntil) {
      setCountdown('')
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const tick = () => {
      const now = new Date()
      const diff = lockedUntil.getTime() - now.getTime()
      if (diff <= 0) {
        setLockedUntil(null)
        setCountdown('')
        setError('')
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setCountdown(
        mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`,
      )
    }

    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lockedUntil])

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await loginSuperAdmin(username, password)
      logger.debug('logged in super admin')
      return res
    },
    onSuccess: data => {
      signIn({
        auth: {
          token: data.token,
          type: 'Bearer',
        },
        userState: {
          username: data.username,
        },
      })
      // Handle navigation with return URL
      if (location.state?.returnUrl) {
        navigate(location.state.returnUrl, { replace: true })
      } else {
        navigate('/super-admin/dashboard', { replace: true })
      }
    },
    onError: (error: unknown) => {
      logger.error('Login failed:', error)
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const data = error.response.data
        const message = data?.message || 'Account is temporarily locked.'
        setError(message)
        if (data?.lockedUntil) {
          setLockedUntil(new Date(data.lockedUntil))
        }
      } else {
        setLockedUntil(null)
        setError('Login failed. Please try again.')
      }
    },
  })

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    mutate(formData)
  }

  return (
    <div className='h-full p-5 flex items-center justify-center'>
      <div className=' text-center mx-50 my-10 bg-white shadow-xl rounded-3xl p-10'>
        <div className='text-center text-primary font-semibold text-5xl mb-10'>
          <h1>Super Admin Login</h1>
        </div>

        <form onSubmit={handleLogin} className='flex flex-col gap-4 space-y-3 mr-6 ml-6'>
          <Input
            type='text'
            label='Username'
            name='username'
            onChange={e => setFormData({ ...formData, username: e.target.value })}
          />
          <Input
            type='password'
            label='Password'
            name='password'
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />

          {error && (
            <div className={`rounded-lg p-3 text-sm ${lockedUntil ? 'bg-amber-50 border border-amber-300 text-amber-800' : 'text-red-600'}`}>
              <p className='font-medium'>{error}</p>
              {lockedUntil && countdown && (
                <p className='mt-1 text-xs'>
                Try again in <span className='font-semibold'>{countdown}</span>
                </p>
              )}
            </div>
          )}
          {subLoading ? (
            <Spinner color='primary' />
          ) : (
            <>
              <Button
                type='submit'
                color='secondary'
                radius='lg'
                variant='shadow'
                isDisabled={!!lockedUntil}
                className='mt-5 text-center w-full'
              >
                Login
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
