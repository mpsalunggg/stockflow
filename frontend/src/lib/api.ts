import type { z } from 'zod'

export class ApiError extends Error {
  status: number
  code: string
  fields: Record<string, unknown>

  constructor(status: number, code: string, message: string, fields: Record<string, unknown>) {
    super(message || code)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export async function request<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  })

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const { code = 'UNKNOWN_ERROR', message = res.statusText, ...fields } = body?.error ?? {}
    throw new ApiError(res.status, code, message, fields)
  }

  return schema ? schema.parse(body) : (body as T)
}
