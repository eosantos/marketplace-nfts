const AUTH_PATHS = ['/login', '/signup']

/**
 * Aceita apenas caminhos internos (nada de URL absoluta, //host, javascript: ou barras invertidas)
 * e nunca devolve as telas de auth (evita laço). Qualquer outro valor cai no fallback.
 */
export function safeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value) return fallback
  const candidate = value.trim()
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(candidate)) return fallback

  const path = candidate.split(/[?#]/)[0]
  if (AUTH_PATHS.includes(path)) return fallback
  return candidate
}
