import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { MutationObserver, QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { nftFixtures } from '@/mocks/fixtures'
import { http } from '@/shared/api/http'
import { qk } from '@/shared/api/query-keys'
import type { Nft } from '@/shared/contracts'
import { applyFavorite, favoriteToggleOptions } from './mutation'

const [first, second] = nftFixtures

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown): Promise<AxiosResponse> {
  const response: AxiosResponse = { data, status, statusText: '', headers: {}, config }
  if (status >= 400) {
    return Promise.reject(new AxiosError('failed', AxiosError.ERR_BAD_RESPONSE, config, null, response))
  }
  return Promise.resolve(response)
}

function useServer(status: number, delayMs = 15) {
  http.defaults.adapter = (config) =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        const body =
          status >= 400
            ? { code: 'TRANSIENT', message: 'Serviço indisponível.' }
            : config.method === 'post'
              ? { userId: 'user_alice', nftId: first.id, createdAt: '2026-01-01T00:00:00.000Z' }
              : { ok: true }
        respond(config, status, body).then(resolve, reject)
      }, delayMs)
    })
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('applyFavorite', () => {
  it('adds once, removes and ignores favoriting without the nft payload', () => {
    expect(applyFavorite([], { nftId: first.id, favorite: true, nft: first })).toEqual([first])
    expect(applyFavorite([first], { nftId: first.id, favorite: true, nft: first })).toEqual([first])
    expect(applyFavorite([first, second], { nftId: first.id, favorite: false })).toEqual([second])
    expect(applyFavorite([], { nftId: first.id, favorite: true })).toEqual([])
  })
})

describe('favorite mutation', () => {
  it('shows the new state immediately and keeps it after the server confirms', async () => {
    const queryClient = new QueryClient()
    const key = qk.favorites('user_alice')
    queryClient.setQueryData<Nft[]>(key, [])
    useServer(201)

    const observer = new MutationObserver(queryClient, favoriteToggleOptions(queryClient, 'user_alice'))
    const done = observer.mutate({ nftId: first.id, favorite: true, nft: first })

    await wait(5) // o servidor (15 ms) ainda não respondeu: é a atualização otimista
    expect(queryClient.getQueryData<Nft[]>(key)).toEqual([first])

    await done
    expect(queryClient.getQueryData<Nft[]>(key)).toEqual([first])
  })

  it('rolls back to the previous list when the server fails', async () => {
    const queryClient = new QueryClient()
    const key = qk.favorites('user_alice')
    queryClient.setQueryData<Nft[]>(key, [second])
    useServer(503)

    const observer = new MutationObserver(queryClient, favoriteToggleOptions(queryClient, 'user_alice'))
    const done = observer.mutate({ nftId: first.id, favorite: true, nft: first }).catch(() => 'failed')

    await wait(5)
    expect(queryClient.getQueryData<Nft[]>(key)).toEqual([first, second])

    expect(await done).toBe('failed')
    expect(queryClient.getQueryData<Nft[]>(key)).toEqual([second])
  })

  it('also rolls back an optimistic removal', async () => {
    const queryClient = new QueryClient()
    const key = qk.favorites('user_alice')
    queryClient.setQueryData<Nft[]>(key, [first, second])
    useServer(503)

    const observer = new MutationObserver(queryClient, favoriteToggleOptions(queryClient, 'user_alice'))
    const done = observer.mutate({ nftId: first.id, favorite: false }).catch(() => 'failed')

    await wait(5)
    expect(queryClient.getQueryData<Nft[]>(key)).toEqual([second])

    await done
    expect(queryClient.getQueryData<Nft[]>(key)).toEqual([first, second])
  })
})
