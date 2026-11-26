import { cn } from '@/shared/lib/utils'

export const inputClass =
  'h-10 w-full rounded border border-border bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ring-offset-background'

interface FieldProps {
  id: string
  label: string
  required?: boolean
  error?: string | undefined
  className?: string
  children: React.ReactNode
}

/** Rótulo visível + asterisco + erro associado (aria-describedby fica no controle via `describedBy`). */
export function Field({ id, label, required, error, className, children }: FieldProps) {
  return (
    <div className={cn('grid gap-1.5 lg:gap-[7px]', className)}>
      <label htmlFor={id} className="text-sm lg:text-[15px]">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Atributos de acessibilidade do controle de um Field. */
export function fieldA11y(id: string, error: string | undefined) {
  return {
    id,
    'aria-invalid': error ? (true as const) : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  }
}
