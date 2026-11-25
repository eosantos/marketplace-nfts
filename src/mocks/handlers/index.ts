import { articleHandlers } from './articles'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { controlHandlers } from './control'
import { favoritesHandlers } from './favorites'
import { healthHandlers } from './health'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { quoteHandlers } from './quote'
import { walletHandlers } from './wallets'

// O servidor Socket.IO simulado entra na Etapa 06 (assina os eventos de src/mocks/events.ts).
export const handlers = [
  ...healthHandlers,
  ...controlHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...articleHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...quoteHandlers,
  ...orderHandlers,
]
