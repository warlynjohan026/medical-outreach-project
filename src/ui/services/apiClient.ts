const DEFAULT_API_URL = import.meta.env.DEV
  ? '/medical-outreach-project/v1'
  : 'http://localhost:3000/medical-outreach-project/v1'

export const API_URL = import.meta.env.DEV
  ? DEFAULT_API_URL
  : (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL)

export function buildApiUrl(path: string, params?: Record<string, string>) {
  const rawUrl = `${API_URL.replace(/\/$/, '')}${path}`
  const url = new URL(rawUrl, window.location.origin)

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value.trim()) {
      url.searchParams.set(key, value.trim())
    }
  })

  return url.toString()
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const body = options.body ? JSON.stringify(options.body) : undefined

  if (body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    body,
    headers,
  })

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new Error(message || `Error ${response.status} llamando ${path}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) {
      return body.message.join(', ')
    }
    return body.message
  } catch {
    return response.statusText
  }
}
