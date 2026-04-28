import type {
  CreatePatientPayload,
  Patient,
  SearchPatientParams,
  UpdatePatientPayload,
} from '../types'
import { apiRequest } from './apiClient'

type ApiPatient = {
  _id?: string
  address?: string
  allergies?: boolean | string
  birthDate?: string
  bloodType?: string
  condition?: string
  document?: string
  firstName?: string
  id?: string | number
  lastName?: string
  medicalCondition?: string
  medicalConditions?: string
  name?: string
  phone?: string
  phoneNumber?: string
  surname?: string
  taxId?: string
}

export async function getPatients() {
  const response = await apiRequest<ApiPatient[] | { data?: ApiPatient[] }>(
    '/patients/get-all?page=1&limit=10',
  )
  const items = Array.isArray(response) ? response : (response.data ?? [])
  return items.map(normalizePatient)
}

export async function createPatient(payload: CreatePatientPayload) {
  const response = await apiRequest<ApiPatient | { data?: ApiPatient }>('/patients/create', {
    body: payload,
    method: 'POST',
  })

  return normalizePatient(unwrapPatient(response))
}

export async function searchPatients(params: SearchPatientParams) {
  const query = buildSearchQuery(params)
  const response = await apiRequest<ApiPatient[] | { data?: ApiPatient[] }>(
    `/patients/search?${query.toString()}`,
  )
  const items = Array.isArray(response) ? response : (response.data ?? [])
  return items.map(normalizePatient)
}

export async function updatePatient(id: string, payload: UpdatePatientPayload) {
  const query = new URLSearchParams({ id })
  const response = await apiRequest<ApiPatient | { data?: ApiPatient }>(
    `/patients/update?${query.toString()}`,
    {
      body: payload,
      method: 'PATCH',
    },
  )

  return normalizePatient(unwrapPatient(response))
}

export async function deletePatient(id: string) {
  const query = new URLSearchParams({ id })
  await apiRequest<void>(`/patients/delete?${query.toString()}`, {
    method: 'DELETE',
  })
}

function buildSearchQuery(params: SearchPatientParams) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) {
      query.set(key, value.trim())
    }
  })

  return query
}

function unwrapPatient(response: ApiPatient | { data?: ApiPatient }): ApiPatient {
  if ('data' in response) {
    return response.data ?? {}
  }

  return response as ApiPatient
}

function normalizePatient(patient: ApiPatient): Patient {
  const firstName = patient.firstName ?? patient.name ?? 'Paciente'
  const lastName = patient.lastName ?? patient.surname ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const condition =
    patient.medicalConditions ?? patient.medicalCondition ?? patient.condition ?? 'Ninguna'

  return {
    address: patient.address ?? 'Sin dirección',
    allergies: normalizeAllergies(patient.allergies),
    bloodType: patient.bloodType ?? 'No registrado',
    condition,
    document: patient.taxId ?? patient.document ?? 'Sin documento',
    firstName,
    id: patient.id?.toString() ?? patient._id,
    initials: getInitials(fullName),
    lastName,
    name: fullName,
    phone: patient.phoneNumber ?? patient.phone ?? 'Sin teléfono',
    tone: condition.toLowerCase() === 'ninguna' ? 'soft' : 'sun',
  }
}

function normalizeAllergies(allergies: ApiPatient['allergies']) {
  if (typeof allergies === 'boolean') {
    return allergies ? 'Sí' : 'No'
  }

  return allergies ?? 'No'
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
    .padEnd(2, 'P')
}
