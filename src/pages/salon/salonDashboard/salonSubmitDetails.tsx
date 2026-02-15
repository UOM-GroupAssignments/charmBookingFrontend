import React, { useState } from 'react'
import { Form, Input, Button, addToast } from '@heroui/react'
import { submitSalonDetails } from '../../../actions/salonActions'
import { useMutation } from '@tanstack/react-query'
import { SalonDocumentType } from '../../../types/superAdmin'
import { useNavigate } from 'react-router-dom'

export const SalonSubmitDetails = ({ salonId }: { salonId: string }) => {
  const navigate = useNavigate()
  const [details, setDetails] = useState({
    owner_nic: '',
    bank_account_full_name: '',
    bank_account_number: '',
    bank_name: '',
    bank_branch: '',
  })
  const [documents, setDocuments] = useState<{
    [SalonDocumentType.ID_PROOF]?: File
    [SalonDocumentType.BANKING_PROOF]?: File
    [SalonDocumentType.COMPANY_REGISTRATION]?: File
  }>({})

  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) => submitSalonDetails(formData),
    onSuccess: () => {
      addToast({
        title: 'Success',
        description: 'Salon details submitted successfully!',
        color: 'success',
      })
      navigate('/business/dashboard')
    },
    onError: error => {
      addToast({
        title: 'Error',
        description: 'Failed to submit salon details.',
        color: 'danger',
      })
      console.error(error)
    },
  })

  // Enhanced file validation function
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' }
    }

    // Minimum file size (prevents empty files)
    if (file.size < 1024) {
      return { isValid: false, error: 'File appears to be empty or corrupted' }
    }

    // Strict MIME type validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Only PDF, JPG, and PNG files are allowed. Detected: ${file.type}`,
      }
    }

    // File extension validation
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png']
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: 'Invalid file extension. Only .pdf, .jpg, .jpeg, .png files are allowed.',
      }
    }

    // Extension-MIME type consistency check
    const extensionMimeMap: { [key: string]: string[] } = {
      pdf: ['application/pdf'],
      jpg: ['image/jpeg', 'image/jpg'],
      jpeg: ['image/jpeg', 'image/jpg'],
      png: ['image/png'],
    }

    if (!extensionMimeMap[extension]?.includes(file.type)) {
      return { isValid: false, error: 'File extension does not match file type' }
    }

    return { isValid: true }
  }

  const handleFileChange = (type: SalonDocumentType, file: File | null) => {
    if (!file) {
      setDocuments(prev => ({
        ...prev,
        [type]: undefined,
      }))
      return
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      addToast({
        title: 'Invalid File',
        description: validation.error,
        color: 'danger',
      })
      return
    }

    addToast({
      title: 'File Valid',
      description: `${file.name} has been validated successfully`,
      color: 'success',
    })

    setDocuments(prev => ({
      ...prev,
      [type]: file,
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('salonId', salonId)
    Object.entries(details).forEach(([key, value]) => {
      formData.append(key, value)
    })
    Object.entries(documents).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file)
      }
    })
    mutate(formData)
  }

  return (
    <div className='max-w-xl mx-auto mt-0 bg-white p-8 rounded shadow'>
      <h2 className='text-2xl font-semibold mb-6'>Submit Salon Details</h2>
      <Form onSubmit={handleSubmit} className='flex flex-col gap-5'>
        <Input
          isRequired
          label='Owner NIC'
          name='owner_nic'
          pattern='[0-9]{9,12}[v,V]?'
          errorMessage='Please enter a valid NIC number'
          value={details.owner_nic}
          onChange={handleChange}
        />
        <Input
          isRequired
          label="Account Holder's Full Name"
          name='bank_account_full_name'
          value={details.bank_account_full_name}
          onChange={handleChange}
        />
        <Input
          isRequired
          label='Bank Account Number'
          name='bank_account_number'
          pattern='[0-9]{10,12}'
          errorMessage='Please enter a valid bank account number'
          value={details.bank_account_number}
          onChange={handleChange}
        />
        <Input
          isRequired
          label='Bank Name'
          name='bank_name'
          value={details.bank_name}
          onChange={handleChange}
        />
        <Input
          isRequired
          label='Bank Branch'
          name='bank_branch'
          value={details.bank_branch}
          onChange={handleChange}
        />
        <div>
          <label className='block mb-1 font-medium'>ID Proof (NIC/Passport)</label>
          <Input
            type='file'
            accept='.pdf,.jpg,.jpeg,.png'
            required
            onChange={e => {
              const file = e.target.files && e.target.files[0] ? e.target.files[0] : null
              handleFileChange(SalonDocumentType.ID_PROOF, file)
              // Clear the input if validation fails
              if (file && !validateFile(file).isValid) {
                e.target.value = ''
              }
            }}
          />
          <p className='text-xs text-gray-500 mt-1'>Accepted formats: PDF, JPG, PNG (Max: 10MB)</p>
        </div>
        <div>
          <label className='block mb-1 font-medium'>Banking Proof</label>
          <Input
            type='file'
            accept='.pdf,.jpg,.jpeg,.png'
            required
            onChange={e => {
              const file = e.target.files && e.target.files[0] ? e.target.files[0] : null
              handleFileChange(SalonDocumentType.BANKING_PROOF, file)
              // Clear the input if validation fails
              if (file && !validateFile(file).isValid) {
                e.target.value = ''
              }
            }}
          />
          <p className='text-xs text-gray-500 mt-1'>Accepted formats: PDF, JPG, PNG (Max: 10MB)</p>
        </div>
        <div>
          <label className='block mb-1 font-medium'>Company Registration</label>
          <Input
            type='file'
            accept='.pdf,.jpg,.jpeg,.png'
            required
            onChange={e => {
              const file = e.target.files && e.target.files[0] ? e.target.files[0] : null
              handleFileChange(SalonDocumentType.COMPANY_REGISTRATION, file)
              // Clear the input if validation fails
              if (file && !validateFile(file).isValid) {
                e.target.value = ''
              }
            }}
          />
          <p className='text-xs text-gray-500 mt-1'>Accepted formats: PDF, JPG, PNG (Max: 10MB)</p>
        </div>
        <Button color='primary' type='submit' isLoading={isPending}>
          Submit
        </Button>
      </Form>
    </div>
  )
}
