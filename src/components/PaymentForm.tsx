'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, Input } from '@heroui/react'
import { Card, CardHeader, CardBody } from '@heroui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCreditCard, faLock, faUser } from '@fortawesome/free-solid-svg-icons'
import { paymentInitiate } from '../actions/paymentActions'

interface PaymentFormProps {
  selectedDate: Date | null
  selectedTime: string | null
  totalAmount: number
  onPaymentSubmit: (paymentData: unknown) => void
  loading?: boolean
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedDate,
  selectedTime,
  totalAmount,
  onPaymentSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    const data = await paymentInitiate({
      bookingId: '123',
      address1: 'N/A',
      address2: 'N/A',
      city: 'Colombo',
    })

    window.location.href = data.payment_url
  } catch (error) {
    console.error('Payment initiation failed', error)
  }
}


  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className='space-y-6'>
      {/* Heading */}
      <div className='flex items-center space-x-2'>
        <FontAwesomeIcon icon={faCreditCard} className='w-5 h-5 text-booking-primary' />
        <h3 className='text-lg font-semibold'>Payment Details</h3>
      </div>

      {/* Booking Summary */}
      <Card className='booking-card'>
        <CardHeader className='text-base'>Booking Summary</CardHeader>
        <CardBody className='space-y-2'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Date:</span>
            <span className='font-medium'>{formatDate(selectedDate)}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>Time:</span>
            <span className='font-medium'>{selectedTime}</span>
          </div>
          <div className='flex justify-between border-t pt-2'>
            <span className='font-semibold'>Total:</span>
            <span className='font-bold text-booking-primary'>${totalAmount}</span>
          </div>
        </CardBody>
      </Card>

      {/* Payment Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className='space-y-4'
      >
        {/* Personal Information */}
        <Card className='booking-card'>
          <CardHeader className='text-base flex items-center space-x-2'>
            <FontAwesomeIcon icon={faUser} className='w-4 h-4' />
            <span>Personal Information</span>
          </CardHeader>
          <CardBody className='space-y-4'>
            <div>
              <Input
                id='name'
                label='Full Name'
                type='text'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className='mt-1'
                required
              />
            </div>
            <div>
              <Input
                id='email'
                label='Email Address'
                type='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className='mt-1'
                required
              />
            </div>
            <div>
              +{' '}
              <Input
                id='phone'
                label='Phone Number'
                type='tel'
                value={formData.phone}
                onChange={e => handleInputChange('phone', e.target.value)}
                className='mt-1'
                required
              />
            </div>
          </CardBody>
        </Card>

        {/* Security Notice */}
        <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
          <FontAwesomeIcon icon={faLock} className='w-4 h-4' />
          <span>Your payment information is encrypted and secure</span>
        </div>

        {/* Submit Button */}
        <Button
          type='submit'
          className='w-full bg-booking-primary hover:bg-booking-primary/90 text-white font-semibold py-3'
          disabled={loading}
        >
          {loading ? 'Processing...' : `Pay $${totalAmount} Now`}
        </Button>
      </motion.form>
    </div>
  )
}

export default PaymentForm
