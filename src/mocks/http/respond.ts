import { errorStatus } from '@/shared/contracts/errors'
import type { ApiError } from '@/shared/contracts'
import type { ServiceResult } from './result'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS })
}

export function errorResponse(error: ApiError): Response {
  return jsonResponse(error, errorStatus(error.code))
}

export function respond<T>(result: ServiceResult<T>, status = 200): Response {
  return result.ok ? jsonResponse(result.data, status) : errorResponse(result.error)
}
