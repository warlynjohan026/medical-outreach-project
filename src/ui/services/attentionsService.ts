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
  operativeId?: string | number
  patient?: string
  patientId?: string | number
  patientName?: string
}

export async function getAttentions() {
  const response = await apiRequest<ApiAttention[] | { data?: ApiAttention[] }>(
    '/medical-attentions/get-attentions?page=1&limit=10',
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
  const patientId = attention.patientId?.toString() ?? ''
  const operativeId = attention.operativeId?.toString() ?? ''

  return {
    date,
    day: date === 'Sin fecha' ? '--' : date.slice(0, 2),
    doctor: attention.doctor ?? 'Sin médico',
    id: attention.id?.toString() ?? attention._id,
    medication: attention.medication ?? 'Sin medicamento',
    operativeId,
    patient: attention.patientName ?? attention.patient ?? `Paciente ${patientId || 'sin ID'}`,
    patientId,
    status: date === currentDisplayDate() ? 'Hoy' : date.slice(3, 5) || 'Fecha',
    tone: date === currentDisplayDate() ? 'sun' : 'blue',
  }
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
