import type {
  CreateOutreachPayload,
  Outreach,
  SearchOutreachParams,
  UpdateOutreachPayload,
} from '../types'
import { apiRequest } from './apiClient'

type ApiOutreach = {
  _id?: string
  createdAt?: string
  date?: string
  id?: string
  location?: string
  name?: string
  operativeDate?: string
  outreachDate?: string
  status?: number | string
  title?: string
  updatedAt?: string
}

export async function getOutreaches() {
  const response = await apiRequest<ApiOutreach[] | { data?: ApiOutreach[] }>(
    '/medical-outreach/get-outreaches',
  )

  const items = Array.isArray(response) ? response : (response.data ?? [])
  return items.map(normalizeOutreach)
}

export async function createOutreach(payload: CreateOutreachPayload) {
  const response = await apiRequest<ApiOutreach | { data?: ApiOutreach }>(
    '/medical-outreach/create',
    {
      body: payload,
      method: 'POST',
    },
  )

  return normalizeOutreach(unwrapOutreach(response))
}

export async function searchOutreaches(params: SearchOutreachParams) {
  const shouldSearchAllStatuses = !params.status?.trim()

  if (shouldSearchAllStatuses) {
    const [activeOutreaches, closedOutreaches] = await Promise.all([
      searchOutreachesByStatus(params, '1'),
      searchOutreachesByStatus(params, '0'),
    ])

    return mergeOutreaches(activeOutreaches, closedOutreaches)
  }

  const response = await fetchSearchOutreaches(params)

  const items = Array.isArray(response) ? response : (response.data ?? [])
  return items.map(normalizeOutreach)
}

export async function updateOutreach(id: string, payload: UpdateOutreachPayload) {
  const query = new URLSearchParams({ id })
  const response = await apiRequest<ApiOutreach | { data?: ApiOutreach }>(
    `/medical-outreach/update?${query.toString()}`,
    {
      body: payload,
      method: 'PATCH',
    },
  )

  return normalizeOutreach(unwrapOutreach(response))
}

export async function closeOutreach(id: string) {
  const query = new URLSearchParams({ id })
  const response = await apiRequest<ApiOutreach | { data?: ApiOutreach }>(
    `/medical-outreach/close?${query.toString()}`,
    {
      method: 'PATCH',
    },
  )

  return normalizeOutreach(unwrapOutreach(response))
}

export async function deleteOutreach(id: string) {
  const query = new URLSearchParams({ id })
  await apiRequest<void>(`/medical-outreach/delete?${query.toString()}`, {
    method: 'DELETE',
  })
}

function buildSearchQuery(params: SearchOutreachParams) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value?.trim()) {
      query.set(key, value.trim())
    }
  })

  return query
}

function fetchSearchOutreaches(params: SearchOutreachParams) {
  const query = buildSearchQuery(params)
  return apiRequest<ApiOutreach[] | { data?: ApiOutreach[] }>(
    `/medical-outreach/search?${query.toString()}`,
  )
}

async function searchOutreachesByStatus(params: SearchOutreachParams, status: '0' | '1') {
  const response = await fetchSearchOutreaches({ ...params, status })
  const items = Array.isArray(response) ? response : (response.data ?? [])
  return items.map(normalizeOutreach)
}

function mergeOutreaches(...outreachGroups: Outreach[][]) {
  const outreachesByKey = new Map<string, Outreach>()

  outreachGroups.flat().forEach((outreach) => {
    const key = outreach.id ?? `${outreach.name}-${outreach.date}-${outreach.location}`
    outreachesByKey.set(key, outreach)
  })

  return Array.from(outreachesByKey.values())
}

function unwrapOutreach(response: ApiOutreach | { data?: ApiOutreach }): ApiOutreach {
  if ('data' in response) {
    return response.data ?? {}
  }

  return response as ApiOutreach
}

function normalizeOutreach(outreach: ApiOutreach): Outreach {
  const name = outreach.name ?? outreach.title ?? 'Operativo sin nombre'
  const status = normalizeStatus(outreach.status)
  const statusValue = normalizeStatusValue(outreach.status)

  return {
    id: outreach.id ?? outreach._id,
    date: normalizeDate(outreach.date ?? outreach.operativeDate ?? outreach.outreachDate),
    initials: getInitials(name),
    location: outreach.location ?? 'Sin ubicación',
    name,
    status,
    statusValue,
    tone: status === 'Cerrado' ? 'sun' : 'soft',
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

function normalizeStatus(status: ApiOutreach['status']) {
  if (status === 1 || status === '1') {
    return 'En curso'
  }

  if (status === 0 || status === '0') {
    return 'Cerrado'
  }

  return status?.toString() ?? 'En curso'
}

function normalizeStatusValue(status: ApiOutreach['status']): '0' | '1' {
  if (status === 0 || status === '0' || status?.toString().toLowerCase() === 'cerrado') {
    return '0'
  }

  return '1'
}

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
    .padEnd(2, 'O')
}
