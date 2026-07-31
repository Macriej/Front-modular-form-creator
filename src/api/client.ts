const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001'

export class ApiError extends Error {
  status: number
  details?: Record<string, unknown>

  constructor(status: number, message: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    let details: Record<string, unknown> | undefined

    try {
      const body = await response.json()
      message = body?.message ?? message
      details = body?.details
    } catch {
      // non-JSON body — leave message as-is
    }

    throw new ApiError(response.status, message, details)
  }

  // Attempt to parse JSON; if parsing fails return undefined as any
  try {
    return (await response.json()) as T
  } catch {
    return undefined as unknown as T
  }
}

export { request, BASE_URL }
