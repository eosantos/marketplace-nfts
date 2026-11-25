import { articleHandlers } from './articles'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { controlHandlers } from './control'
import { favoritesHandlers } from './favorites'
import { healthHandlers } from './health'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { socketHandlers } from '../socket/handler'
import { quoteHandlers } from './quote'
import { walletHandlers } from './wallets'

// socketHandlers: servidor Socket.IO simulado, assina os eventos de src/mocks/events.ts.
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
  ...socketHandlers,
]
