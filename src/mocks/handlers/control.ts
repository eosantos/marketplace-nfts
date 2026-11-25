import { http } from 'msw'
import { z } from 'zod'
import { getMockState, resetMocks, setMockScenario } from '../control'
import { jsonResponse, respond } from '../http/respond'
import { validationFail } from '../http/result'
import { MockScenarioSchema } from '../scenarios/names'
import { readJson } from './helpers'

const ResetBodySchema = z.object({ scenario: MockScenarioSchema.optional() })
const ScenarioBodySchema = z.object({ scenario: MockScenarioSchema })

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
]
