import type { HttpResponseResolver } from 'msw'
import { applyScenario, type RouteKind } from '../scenarios/behavior'

/** Envolve um resolver aplicando latência e falhas do cenário ativo. */
export function withScenario(kind: RouteKind, resolver: HttpResponseResolver): HttpResponseResolver {
  return async (info) => {
    const blocked = await applyScenario(kind, info.request)
    if (blocked) return blocked
    return resolver(info)
  }
}
