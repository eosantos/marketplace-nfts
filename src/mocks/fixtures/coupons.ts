// Fixtures de cupons: válido, inválido e expirado.
// Valores de desconto seguem string decimal (ETH ou percentual).

import type { MockCoupon } from '../db/types'

export const couponFixtures: MockCoupon[] = [
  {
    code: 'KURIO10',
    kind: 'percent',
    value: '10',
    status: 'active',
    description: '10% de desconto no subtotal',
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
  {
    code: 'KURIO25',
    kind: 'fixed',
    value: '0.25',
    status: 'active',
    description: '0.25 ETH de desconto no subtotal',
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
  {
    code: 'KURIO-VENCIDO',
    kind: 'percent',
    value: '15',
    status: 'expired',
    description: 'Cupom expirado para cenários de erro',
    expiresAt: '2026-07-31T23:59:59.000Z',
  },
  {
    code: 'KURIO-INVALIDO',
    kind: 'percent',
    value: '0',
    status: 'invalid',
    description: 'Código inválido de demonstração',
    expiresAt: '2026-12-31T23:59:59.000Z',
  },
]
