// Mapeamento de códigos de erro para status HTTP.
// Usado pelos handlers MSW e documentado em docs/API.md.

import type { ErrorCode } from './index'

export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  AVAILABILITY_CONFLICT: 409,
  PRICE_CHANGED: 409,
  IDEMPOTENCY_CONFLICT: 409,
  COUPON_INVALID: 400,
  COUPON_EXPIRED: 400,
  TRANSIENT: 503,
}

export function errorStatus(code: ErrorCode): number {
  return ERROR_STATUS[code]
}
