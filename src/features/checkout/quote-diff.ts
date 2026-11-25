import { Decimal } from 'decimal.js'
import type { Quote } from '@/shared/contracts'

export interface QuoteChange {
  kind: 'price' | 'quantity' | 'added' | 'removed' | 'discount' | 'coupon' | 'fee' | 'total'
  message: string
}

const same = (a: string, b: string) => new Decimal(a).eq(b)
const lineKey = (item: { nftId: string; editionType: string }) => `${item.nftId}|${item.editionType}`

/**
 * Compara a cotação que o usuário revisou com a cotação atual do servidor. Qualquer diferença em
 * preço, quantidade, itens, desconto, cupom, taxa ou total é uma mudança que exige NOVA confirmação.
 * Ids e versões não contam: cada cotação nova tem os seus.
 */
export function diffQuotes(reviewed: Quote, current: Quote): QuoteChange[] {
  const changes: QuoteChange[] = []
  const currentByKey = new Map(current.items.map((item) => [lineKey(item), item]))
  const reviewedKeys = new Set(reviewed.items.map(lineKey))

  for (const item of reviewed.items) {
    const now = currentByKey.get(lineKey(item))
    const label = `${item.nftName} (${item.editionType})`
    if (!now) {
      changes.push({ kind: 'removed', message: `${label} saiu da cotação.` })
      continue
    }
    if (now.quantity !== item.quantity) {
      changes.push({ kind: 'quantity', message: `${label}: a quantidade mudou de ${item.quantity} para ${now.quantity}.` })
    }
    if (!same(now.unitPrice, item.unitPrice)) {
      changes.push({ kind: 'price', message: `${label}: o preço mudou de ${item.unitPrice} para ${now.unitPrice} ETH.` })
    }
  }

  for (const item of current.items) {
    if (!reviewedKeys.has(lineKey(item))) {
      changes.push({ kind: 'added', message: `${item.nftName} (${item.editionType}) entrou na cotação.` })
    }
  }

  if ((reviewed.coupon ?? null) !== (current.coupon ?? null) || reviewed.couponStatus !== current.couponStatus) {
    changes.push({ kind: 'coupon', message: 'O cupom aplicado mudou.' })
  }
  if (!same(reviewed.discount, current.discount)) {
    changes.push({ kind: 'discount', message: `O desconto mudou de ${reviewed.discount} para ${current.discount} ETH.` })
  }
  if (!same(reviewed.networkFee, current.networkFee)) {
    changes.push({ kind: 'fee', message: `A taxa de rede mudou de ${reviewed.networkFee} para ${current.networkFee} ETH.` })
  }
  if (!same(reviewed.total, current.total)) {
    changes.push({ kind: 'total', message: `O total mudou de ${reviewed.total} para ${current.total} ETH.` })
  }

  return changes
}
