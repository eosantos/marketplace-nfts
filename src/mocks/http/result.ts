import type { ZodError } from 'zod'
import type { ApiError, ErrorCode, FieldError } from '@/shared/contracts'

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: ApiError }

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data }
}

export function fail<T = never>(
  code: ErrorCode,
  message: string,
  fieldErrors?: FieldError[],
): ServiceResult<T> {
  const error: ApiError =
    fieldErrors && fieldErrors.length > 0 ? { code, message, fieldErrors } : { code, message }
  return { ok: false, error }
}

export function fieldErrorsFromZod(error: ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : '_',
    message: issue.message,
  }))
}

export function validationFail<T = never>(error: ZodError): ServiceResult<T> {
  return fail<T>('VALIDATION_ERROR', 'Verifique os campos informados.', fieldErrorsFromZod(error))
}
