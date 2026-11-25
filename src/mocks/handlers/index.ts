import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { controlHandlers } from './control'
import { favoritesHandlers } from './favorites'
import { healthHandlers } from './health'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

// Cotação, pedidos e Socket.IO entram na parte 2b e nas etapas 06/07.
export const handlers = [
  ...healthHandlers,
  ...controlHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...profileHandlers,
  ...walletHandlers,
]
