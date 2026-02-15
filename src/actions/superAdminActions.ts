import { Salon } from '../types/salon'
import { SalonDetails, SalonDocuments } from '../types/superAdmin'
import axiosInstance from './axiosInstance'

export async function loginSuperAdmin(username: string, password: string) {
  const response = await axiosInstance.post('/super-admin/login', {
    username,
    password,
  })
  return response.data
}

export async function getAllSalons(authHeader: string): Promise<Salon[]> {
  const response = await axiosInstance.get('/super-admin/all-salons', {
    headers: {
      Authorization: authHeader,
    },
  })
  return response.data
}

export async function getSalonDocuments(
  salonId: string,
  authHeader: string,
): Promise<SalonDocuments[]> {
  const response = await axiosInstance.get(`/super-admin/salon-documents/${salonId}`, {
    headers: {
      Authorization: authHeader,
    },
  })
  return response.data
}

export async function getSalonDetails(salonId: string, authHeader: string): Promise<SalonDetails> {
  const response = await axiosInstance.get(`/super-admin/salon-details/${salonId}`, {
    headers: {
      Authorization: authHeader,
    },
  })
  return response.data
}

export async function verifySalon(salonId: string, authHeader: string): Promise<void> {
  const response = await axiosInstance.post(
    '/super-admin/verify-salon',
    { salonId },
    {
      headers: {
        Authorization: authHeader,
      },
    },
  )
  return response.data
}

export async function failVerification(salonId: string, authHeader: string): Promise<void> {
  const response = await axiosInstance.post(
    '/super-admin/fail-verification',
    { salonId },
    {
      headers: {
        Authorization: authHeader,
      },
    },
  )
  return response.data
}

export async function getSecureDocumentUrl(
  documentId: string,
  authHeader: string,
): Promise<string> {
  const response = await axiosInstance.get(`/api/documents/secure/${documentId}`, {
    headers: {
      Authorization: authHeader,
    },
    responseType: 'blob',
  })
  // Create a blob URL for the document
  const blob = new Blob([response.data])
  return URL.createObjectURL(blob)
}
