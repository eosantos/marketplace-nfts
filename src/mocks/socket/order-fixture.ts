// Apoio dos testes: cria um pedido pendente pelos serviços reais (cotação + pedido).
import { createOrder } from '../services/orders'
import { createQuote } from '../services/quote'
import { setWalletConnection } from '../services/wallets'

export function createOrderFixture(userId: string): { orderId: string } {
  const quote = createQuote(userId, { items: [{ nftId: 'nft_002', editionType: 'ABERTA', quantity: 1 }] })
  if (!quote.ok) throw new Error(quote.error.message)

  const walletId = userId === 'user_alice' ? 'wallet_alice_primary' : 'wallet_bob_primary'
  setWalletConnection(userId, walletId, true)

  const result = createOrder(userId, `key-${userId}`, {
    collector: { displayName: 'Teste', userName: 'teste', profileName: 'Teste', email: 'teste@nft.test' },
    walletId,
    network: 'Ethereum',
    quoteId: quote.data.quoteId,
    quoteVersion: quote.data.version,
  })
  if (!result.ok) throw new Error(result.error.message)
  return { orderId: result.data.order.id }
}
