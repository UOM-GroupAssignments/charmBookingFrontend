import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  failVerification,
  getSalonDetails,
  getSalonDocuments,
  getSecureDocumentUrl,
  verifySalon,
} from '../../actions/superAdminActions'
import { SalonDetails, SalonDocuments, VerificationStatus } from '../../types/superAdmin'
import { addToast, Button, Spinner } from '@heroui/react'
import { getSalonById } from '../../actions/customerActions'
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader'

export function SalonVerifyPage() {
  const queryClient = useQueryClient()
  const params = useParams<{ salonId: string }>()
  const navigate = useNavigate()
  const authHeader = useAuthHeader()
  const [loadingDocuments, setLoadingDocuments] = useState<Record<string, boolean>>({})

  const handleSecureDocumentAccess = async (documentId: string) => {
    if (loadingDocuments[documentId]) return

    setLoadingDocuments(prev => ({ ...prev, [documentId]: true }))
    try {
      const documentUrl = await getSecureDocumentUrl(documentId, authHeader!)
      window.open(documentUrl, '_blank')
      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(documentUrl), 10000)
    } catch (error) {
      addToast({
        title: 'Error accessing document',
        description: 'Unable to load the document. Please try again.',
        color: 'danger',
      })
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [documentId]: false }))
    }
  }

  useEffect(() => {
    if (!params.salonId) {
      navigate('/super-admin/dashboard')
    }
  }, [params.salonId, navigate])

  const { data: salonData, isPending: isLoadingSalonData } = useQuery({
    queryKey: ['salon', params.salonId],
    queryFn: () => getSalonById(params.salonId!),
    enabled: !!params.salonId,
  })

  const { data: salonDetails, isLoading: isLoadingDetails } = useQuery<SalonDetails>({
    queryKey: ['salon', 'details', params.salonId],
    queryFn: () => getSalonDetails(params.salonId!, authHeader!),
    enabled: !!params.salonId,
  })

  const { data: documents, isLoading: isLoadingDocuments } = useQuery<SalonDocuments[]>({
    queryKey: ['salon', params.salonId, 'documents'],
    queryFn: () => getSalonDocuments(params.salonId!, authHeader!),
    enabled: !!params.salonId,
  })

  const { mutate: verifySalonMutation, isPending: isVerifying } = useMutation({
    mutationFn: (salonId: string) => verifySalon(salonId, authHeader!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] })
      queryClient.invalidateQueries({ queryKey: ['salon', params.salonId] })
      addToast({
        title: 'Salon verified successfully',
        description: 'The salon has been marked as verified.',
        color: 'success',
      })
    },
    onError: () => {
      addToast({
        title: 'Error verifying salon',
        description: 'Something went wrong. Please try again.',
        color: 'danger',
      })
    },
  })

  const { mutate: failVerify, isPending: isFailing } = useMutation({
    mutationFn: (salonId: string) => failVerification(salonId, authHeader!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salons'] })
      queryClient.invalidateQueries({ queryKey: ['salon', params.salonId] })
      addToast({
        title: 'Salon verification failed',
        description: 'The salon has been marked as failed.',
        color: 'danger',
      })
    },
    onError: () => {
      addToast({
        title: 'Error failing salon verification',
        description: 'Something went wrong. Please try again.',
        color: 'danger',
      })
    },
  })

  if (isLoadingDetails || isLoadingDocuments || isLoadingSalonData) {
    return (
      <div className='flex justify-center items-center h-64'>
        <Spinner className='animate-spin h-10 w-10 text-gray-500' />
      </div>
    )
  }

  return (
    <div className='max-w-3xl mx-auto my-10 space-y-8'>
      {/* Header */}
      <div className='flex items-center space-x-4'>
        <button
          onClick={() => navigate('/super-admin/dashboard')}
          className='px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700'
        >
          &larr; Back
        </button>
        <div>
          <h2 className='text-3xl font-bold text-foreground'>Salon Verification</h2>
          <p className='text-muted-foreground'>Review and verify salon details</p>
        </div>
      </div>
      {/* Salon Card */}
      <div className='bg-white shadow rounded-lg p-6 flex flex-col md:flex-row gap-6'>
        {/* Salon Image */}
        <div className='flex-shrink-0'>
          <img
            src={
              salonData?.images && salonData.images.length > 0
                ? salonData.images[0].url
                : '/placeholder-salon.png'
            }
            alt={salonData?.name || 'Salon'}
            className='w-40 h-40 object-cover rounded-lg border'
            onError={e => {
              e.currentTarget.src = '/signup-drawing.avif'
            }}
          />
        </div>
        {/* Salon Info */}
        <div className='flex-1 space-y-2'>
          <h3 className='text-2xl font-semibold'>
            {salonData?.name || salonDetails?.salon?.name || 'Salon Name'}
          </h3>
          <div className='text-gray-600'>{salonData?.location}</div>
          <div className='flex flex-wrap gap-4 mt-2'>
            <div>
              <span className='font-medium'>Contact:</span> {salonData?.phone || '-'}
            </div>
            <div>
              <span className='font-medium'>Email:</span> {salonData?.email || '-'}
            </div>
            <div>
              <span className='font-medium'>Status:</span>{' '}
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs ${
                  salonData?.verificationStatus === VerificationStatus.VERIFIED
                    ? 'bg-green-100 text-green-700'
                    : salonData?.verificationStatus === VerificationStatus.FAILED
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {salonData?.verificationStatus === VerificationStatus.VERIFIED
                  ? 'Verified'
                  : salonData?.verificationStatus === VerificationStatus.FAILED
                    ? 'Failed'
                    : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details Card */}
      {salonDetails ? (
        <div className='bg-white shadow rounded-lg p-6'>
          <h4 className='text-lg font-semibold mb-4'>Owner & Bank Details</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2'>
            <div>
              <span className='font-medium'>Owner NIC:</span> {salonDetails.owner_nic || '-'}
            </div>
            <div>
              <span className='font-medium'>Bank Account Name:</span>{' '}
              {salonDetails.bank_account_full_name || '-'}
            </div>
            <div>
              <span className='font-medium'>Bank Account Number:</span>{' '}
              {salonDetails.bank_account_number || '-'}
            </div>
            <div>
              <span className='font-medium'>Bank Name:</span> {salonDetails.bank_name || '-'}
            </div>
            <div>
              <span className='font-medium'>Bank Branch:</span> {salonDetails.bank_branch || '-'}
            </div>
            <div>
              <span className='font-medium'>Created At:</span>{' '}
              {salonDetails.createdAt ? new Date(salonDetails.createdAt).toLocaleString() : '-'}
            </div>
            <div>
              <span className='font-medium'>Updated At:</span>{' '}
              {salonDetails.updatedAt ? new Date(salonDetails.updatedAt).toLocaleString() : '-'}
            </div>
          </div>
          {Object.values(salonDetails).every(v => v === null || v === undefined || v === '') && (
            <div className='mt-4 text-center text-muted-foreground'>
              Owner has not submitted details yet
            </div>
          )}
        </div>
      ) : (
        <div className='bg-white shadow rounded-lg p-6'>
          <h4 className='text-lg font-semibold mb-4'>Owner & Bank Details</h4>
          <div className='text-center text-muted-foreground'>
            Owner has not submitted details yet
          </div>
        </div>
      )}
      {documents ? (
        <div className='bg-white shadow rounded-lg p-6'>
          <h4 className='text-lg font-semibold mb-4'>Salon Documents</h4>
          <ul className='space-y-3'>
            {documents.map(doc => (
              <li key={doc.id} className='flex items-center gap-4'>
                <span className='font-medium'>{doc.documentType}</span>
                <button
                  onClick={() => handleSecureDocumentAccess(doc.id)}
                  disabled={loadingDocuments[doc.id]}
                  className='text-blue-600 underline hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed'
                >
                  {loadingDocuments[doc.id] ? 'Loading...' : 'View Document'}
                </button>
                <span className='text-gray-500 text-sm'>
                  Uploaded: {new Date(doc.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className='bg-white shadow rounded-lg p-6'>
          <h4 className='text-lg font-semibold mb-4'>Salon Documents</h4>
          <div className='text-center text-muted-foreground'>No documents submitted yet</div>
        </div>
      )}
      {/* Actions */}
      <div className='flex gap-4 justify-end'>
        {salonData?.verificationStatus === VerificationStatus.VERIFIED ? (
          <Button
            color='danger'
            isLoading={isFailing}
            disabled={
              !salonDetails ||
              !documents ||
              Object.values(salonDetails).every(v => v === null || v === undefined || v === '') ||
              documents.length === 0
            }
            onClick={() => params.salonId && failVerify(params.salonId)}
          >
            Revoke Verification
          </Button>
        ) : (
          <Button
            color='success'
            isLoading={isVerifying}
            isDisabled={
              !salonDetails ||
              !documents ||
              Object.values(salonDetails).every(v => v === null || v === undefined || v === '') ||
              documents.length === 0
            }
            onClick={() => params.salonId && verifySalonMutation(params.salonId)}
          >
            Verify Salon
          </Button>
        )}
      </div>
    </div>
  )
}
