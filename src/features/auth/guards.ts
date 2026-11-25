import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { getToken } from './session-store'

/** `beforeLoad` das rotas privadas: sem sessão, vai ao login e volta depois. */
export function requireAuth({ location }: { location: ParsedLocation }): void {
  if (getToken() === null) {
    // O TanStack Router exige `throw redirect(...)`; o objeto não é um Error.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/login', search: { redirect: location.href } })
  }
}

/** `beforeLoad` das telas de auth: quem já tem sessão não precisa vê-las. */
export function redirectIfAuthenticated(): void {
  if (getToken() !== null) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/' })
  }
}
