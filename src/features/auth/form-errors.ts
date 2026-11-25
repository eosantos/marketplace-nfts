import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ApiError } from '@/shared/contracts'

/** Associa `fieldErrors` da API aos campos do formulário. Retorna se algum campo foi atribuído. */
export function applyApiFieldErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  fieldMap: Record<string, Path<T>>,
): boolean {
  let applied = false
  for (const fieldError of error.fieldErrors ?? []) {
    const target = fieldMap[fieldError.field]
    if (target) {
      setError(target, { type: 'server', message: fieldError.message })
      applied = true
    }
  }
  return applied
}
