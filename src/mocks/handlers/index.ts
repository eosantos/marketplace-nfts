import { healthHandlers } from './health'

// Os handlers de negócio (auth, nfts, carrinho, pedidos...) entram na Etapa 01 (2a/2b).
export const handlers = [...healthHandlers]
