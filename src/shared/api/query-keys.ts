// Chaves do TanStack Query. Dados privados SEMPRE incluem o userId: um usuário
// nunca compartilha cache com outro, mesmo antes do clear() do logout.
export const qk = {
  session: ['session'] as const,
  facets: ['nfts', 'facets'] as const,
  nfts: (params: unknown) => ['nfts', 'list', params] as const,
  nft: (id: string) => ['nfts', 'detail', id] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  cart: (userId: string) => ['cart', userId] as const,
  quote: (userId: string, signature: string) => ['quote', userId, signature] as const,
  wallets: (userId: string) => ['wallets', userId] as const,
  profile: (userId: string) => ['profile', userId] as const,
  order: (userId: string, orderId: string) => ['order', userId, orderId] as const,
}
