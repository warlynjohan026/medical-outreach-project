import type {
  Attention,
  CreateAttentionPayload,
  SearchAttentionParams,
  UpdateAttentionPayload,
} from '../types'
import { apiRequest } from './apiClient'

type ApiAttention = {
  _id?: string
  attentionDate?: string
  date?: string
  doctor?: string
  id?: string | number
  medication?: string
  medicalOutreach?: ApiAttentionOutreach | string
  operative?: ApiAttentionOutreach | string
  operativeId?: ApiAttentionOutreach | string | number
  patient?: ApiAttentionPatient | string
  patientId?: ApiAttentionPatient | string | number
  patientName?: string
}

type ApiAttentionPatient = {
  _id?: string
  document?: string
  firstName?: string
  id?: string | number
  lastName?: string
  name?: string
  surname?: string
  taxId?: string
}

type ApiAttentionOutreach = {
  _id?: string
  id?: string | number
  location?: string
  name?: string
  title?: string
}

export async function getAttentions() {
  const response = await apiRequest<ApiAttention[] | { data?: ApiAttention[] }>(
    '/medical-attentions/get-attentions?page=1&limit=100',
  )
  const items = Array.isArray(response) ? response : (response.data ?? [])
  return items.map(normalizeAttention)
}

export async function createAttention(payload: CreateAttentionPayload) {
  const response = await apiRequest<ApiAttention | { data?: ApiAttention }>(
    '/medical-attentions/create',
    {
      body: payload,
      method: 'POST',
    },
  )

  return normalizeAttention(unwrapAttention(response))
}

export async function searchAttentions(params: SearchAttentionParams) {
  const query = buildSearchQuery(params)
  const response = await apiRequest<ApiAttention[] | { data?: ApiAttention[] }>(
    `/medical-attentions/search?${query.toString()}`,
  )
  const items = Array.isArray(response) ? response : (response.data ?? [])
  return items.map(normalizeAttention)
}

export async function updateAttention(id: string, payload: UpdateAttentionPayload) {
  const query = new URLSearchParams({ id })
  const response = await apiRequest<ApiAttention | { data?: ApiAttention }>(
    `/medical-attentions/update?${query.toString()}`,
    {
      body: payload,
      method: 'PATCH',
    },
  )

  return normalizeAttention(unwrapAttention(response))
}

export async function deleteAttention(id: string) {
  const query = new URLSearchParams({ id })
  await apiRequest<void>(`/medical-attentions/delete?${query.toString()}`, {
    method: 'DELETE',
  })
}

function buildSearchQuery(params: SearchAttentionParams) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) {
      query.set(key, value.trim())
    }
  })

  return query
}

function unwrapAttention(response: ApiAttention | { data?: ApiAttention }): ApiAttention {
  if ('data' in response) {
    return response.data ?? {}
  }

  return response as ApiAttention
}

function normalizeAttention(attention: ApiAttention): Attention {
  const date = normalizeDate(attention.attentionDate ?? attention.date)
  const patientId = normalizePatientId(attention)
  const operativeId = normalizeOperativeId(attention)
  const patientName = normalizePatientName(attention, patientId)

  return {
    date,
    day: date === 'Sin fecha' ? '--' : date.slice(0, 2),
    doctor: attention.doctor ?? 'Sin médico',
    id: attention.id?.toString() ?? attention._id,
    medication: attention.medication ?? 'Sin medicamento',
    operativeId,
    patient: patientName,
    patientId,
    status: date === currentDisplayDate() ? 'Hoy' : date.slice(3, 5) || 'Fecha',
    tone: date === currentDisplayDate() ? 'sun' : 'blue',
  }
}

function normalizePatientId(attention: ApiAttention) {
  if (typeof attention.patientId === 'string' || typeof attention.patientId === 'number') {
    return attention.patientId.toString()
  }

  if (typeof attention.patientId === 'object' && attention.patientId) {
    return getObjectId(attention.patientId)
  }

  if (typeof attention.patient === 'object' && attention.patient) {
    return getObjectId(attention.patient)
  }

  return ''
}

function normalizePatientName(attention: ApiAttention, patientId: string) {
  if (attention.patientName?.trim()) {
    return attention.patientName
  }

  if (typeof attention.patient === 'string' && attention.patient.trim()) {
    return attention.patient
  }

  if (typeof attention.patient === 'object' && attention.patient) {
    const firstName = attention.patient.firstName ?? attention.patient.name ?? ''
    const lastName = attention.patient.lastName ?? attention.patient.surname ?? ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    return fullName || attention.patient.taxId || attention.patient.document || `Paciente ${patientId || 'sin ID'}`
  }

  if (typeof attention.patientId === 'object' && attention.patientId) {
    const firstName = attention.patientId.firstName ?? attention.patientId.name ?? ''
    const lastName = attention.patientId.lastName ?? attention.patientId.surname ?? ''
    const fullName = [firstName, lastName].filter(Boolean).join(' ')

    return (
      fullName ||
      attention.patientId.taxId ||
      attention.patientId.document ||
      `Paciente ${patientId || 'sin ID'}`
    )
  }

  return `Paciente ${patientId || 'sin ID'}`
}

function normalizeOperativeId(attention: ApiAttention) {
  if (typeof attention.operativeId === 'string' || typeof attention.operativeId === 'number') {
    return attention.operativeId.toString()
  }

  if (typeof attention.operativeId === 'object' && attention.operativeId) {
    return getObjectId(attention.operativeId)
  }

  if (typeof attention.operative === 'object' && attention.operative) {
    return getObjectId(attention.operative)
  }

  if (typeof attention.medicalOutreach === 'object' && attention.medicalOutreach) {
    return getObjectId(attention.medicalOutreach)
  }

  if (typeof attention.operative === 'string') {
    return attention.operative
  }

  if (typeof attention.medicalOutreach === 'string') {
    return attention.medicalOutreach
  }

  return ''
}

function getObjectId(value: { _id?: string; id?: string | number }) {
  return value.id?.toString() ?? value._id ?? ''
}

function normalizeDate(value: string | undefined) {
  if (!value) {
    return 'Sin fecha'
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value
  }

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch
    return `${day}/${month}/${year}`
  }

  return value
}

function currentDisplayDate() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return `${day}/${month}/${year}`
}
