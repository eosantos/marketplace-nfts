import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import type { ApiError } from '@/shared/contracts'
import { parseApiError } from './errors'
import { configureHttp, http } from './http'

function failWith(status: number, data: unknown) {
  return (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const response: AxiosResponse = { data, status, statusText: '', headers: {}, config }
    return Promise.reject(new AxiosError('failed', AxiosError.ERR_BAD_REQUEST, config, null, response))
  }
}

async function failed(request: Promise<unknown>): Promise<boolean> {
  try {
    await request
    return false
  } catch {
    return true
  }
}

describe('http client', () => {
  it('adds the bearer token only when there is a session', async () => {
    const seen: (string | null)[] = []
    http.defaults.adapter = (config) => {
      const header = config.headers.get('Authorization')
      seen.push(typeof header === 'string' ? header : null)
      return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
    }

    configureHttp({ getToken: () => 'kurio_abc', onAuthError: () => undefined })
    await http.get('/cart')
    configureHttp({ getToken: () => null, onAuthError: () => undefined })
    await http.get('/cart')

    expect(seen).toEqual(['Bearer kurio_abc', null])
  })

  it('reports 401 responses that follow the ApiError contract', async () => {
    const reported: { error: ApiError; url: string | undefined }[] = []
    configureHttp({
      getToken: () => 'tok',
      onAuthError: (error, url) => {
        reported.push({ error, url })
      },
    })

    http.defaults.adapter = failWith(401, { code: 'SESSION_EXPIRED', message: 'expirou' })
    expect(await failed(http.get('/cart'))).toBe(true)
    expect(reported).toHaveLength(1)
    expect(reported[0].error.code).toBe('SESSION_EXPIRED')
    expect(reported[0].url).toBe('/cart')

    // Corpo fora do contrato e erros que não são 401 não acionam o tratamento de sessão.
    http.defaults.adapter = failWith(401, '<html>unauthorized</html>')
    expect(await failed(http.get('/cart'))).toBe(true)
    http.defaults.adapter = failWith(503, { code: 'TRANSIENT', message: 'fora do ar' })
    expect(await failed(http.get('/cart'))).toBe(true)
    expect(reported).toHaveLength(1)
  })
})

describe('parseApiError', () => {
  it('reads the contract body, network failures and unknown errors', () => {
    const response: AxiosResponse = {
      data: { code: 'EMAIL_TAKEN', message: 'Este e-mail já está cadastrado.', fieldErrors: [{ field: 'email', message: 'x' }] },
      status: 409,
      statusText: '',
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
    }
    const fromApi = parseApiError(new AxiosError('x', 'ERR_BAD_REQUEST', undefined, null, response))
    expect(fromApi.code).toBe('EMAIL_TAKEN')
    expect(fromApi.fieldErrors?.[0].field).toBe('email')

    const network = parseApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    expect(network.code).toBe('TRANSIENT')
    expect(network.message).toContain('conectar')

    expect(parseApiError(new Error('boom')).code).toBe('TRANSIENT')
    expect(parseApiError('texto').message).toContain('Algo deu errado')
  })
})
