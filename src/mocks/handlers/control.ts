import { http } from 'msw'
import { z } from 'zod'
import { EthAmountSchema, NftEditionTypeSchema } from '@/shared/contracts'
import {
  dropSocketConnections,
  emitNftChange,
  getMockState,
  getSocketState,
  resetMocks,
  setMockScenario,
} from '../control'
import { jsonResponse, respond } from '../http/respond'
import { fail, validationFail } from '../http/result'
import { MockScenarioSchema } from '../scenarios/names'
import { readJson } from './helpers'

const ResetBodySchema = z.object({ scenario: MockScenarioSchema.optional() })
const ScenarioBodySchema = z.object({ scenario: MockScenarioSchema })
const EmitBodySchema = z.object({
  nftId: z.string(),
  price: EthAmountSchema.optional(),
  available: z.object({ edition: NftEditionTypeSchema, value: z.number().int().min(0) }).optional(),
  duplicate: z.boolean().optional(),
  stale: z.boolean().optional(),
})

// Canal de controle fora de /api e sem latência/falhas de cenário.
export const controlHandlers = [
  http.get('/__mocks__/state', () => jsonResponse(getMockState())),
  http.post('/__mocks__/reset', async ({ request }) => {
    const parsed = ResetBodySchema.safeParse((await readJson(request)) ?? {})
    if (!parsed.success) return respond(validationFail(parsed.error))
    return jsonResponse(resetMocks(parsed.data.scenario))
  }),
  http.post('/__mocks__/scenario', async ({ request }) => {
    const parsed = ScenarioBodySchema.safeParse(await readJson(request))
    if (!parsed.success) return respond(validationFail(parsed.error))
    return jsonResponse(setMockScenario(parsed.data.scenario))
  }),
  // Altera um NFT no banco e emite `nft.updated` pelo Socket.IO simulado.
  http.post('/__mocks__/emit', async ({ request }) => {
    const parsed = EmitBodySchema.safeParse(await readJson(request))
    if (!parsed.success) return respond(validationFail(parsed.error))
    try {
      const { nftId, price, available, duplicate, stale } = parsed.data
      return jsonResponse(
        emitNftChange({
          nftId,
          ...(price ? { price } : {}),
          ...(available ? { available } : {}),
          ...(duplicate ? { duplicate } : {}),
          ...(stale ? { stale } : {}),
        }),
      )
    } catch (error) {
      return respond(fail('NOT_FOUND', error instanceof Error ? error.message : 'NFT não encontrado.'))
    }
  }),
  http.get('/__mocks__/socket', () => jsonResponse(getSocketState())),
  http.post('/__mocks__/socket/drop', () => jsonResponse({ dropped: dropSocketConnections() })),
]
