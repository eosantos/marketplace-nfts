// Contratos tipados (Zod + tipos inferidos) para todos os recursos REST.
// Usados por handlers MSW, cliente Axios e UI. Nenhum dado fictício aqui.

import { z } from 'zod'

// ============================================================================
// Primitivos compartilhados
// ============================================================================

/** Valor em ETH. Sempre string decimal; nunca `number`. */
export const EthAmountSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/, 'Valor ETH inválido (use string decimal, ex.: "1.19")')

export type EthAmount = z.infer<typeof EthAmountSchema>

/** Caminho de asset local (`/assets/...`), URL absoluta ou data URL de avatar (png/jpeg/webp). */
export const AssetPathSchema = z
  .string()
  .regex(
    /^(?:https?:\/\/[^\s]+|\/[^\s]*|data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/,
    'Caminho de imagem inválido',
  )

export type AssetPath = z.infer<typeof AssetPathSchema>

export const IsoDateSchema = z.string().datetime()

export type IsoDate = z.infer<typeof IsoDateSchema>

// ============================================================================
// Erros
// ============================================================================

export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR', // 422
  'UNAUTHENTICATED', // 401
  'SESSION_EXPIRED', // 401
  'FORBIDDEN', // 403
  'NOT_FOUND', // 404
  'EMAIL_TAKEN', // 409
  'AVAILABILITY_CONFLICT', // 409
  'PRICE_CHANGED', // 409
  'IDEMPOTENCY_CONFLICT', // 409
  'COUPON_INVALID', // 400
  'COUPON_EXPIRED', // 400
  'TRANSIENT', // 503
])

export type ErrorCode = z.infer<typeof ErrorCodeSchema>

export const FieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
})

export type FieldError = z.infer<typeof FieldErrorSchema>

export const ApiErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  fieldErrors: z.array(FieldErrorSchema).optional(),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

// ============================================================================
// Sessão e conta
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1).max(60), // nome de exibição
  userName: z.string().min(1).max(40), // nome de usuário (@)
  profileName: z.string().min(1).max(60), // nome do perfil
  avatar: AssetPathSchema.optional(),
  createdAt: IsoDateSchema,
})

export type User = z.infer<typeof UserSchema>

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: IsoDateSchema,
})

export type Session = z.infer<typeof SessionSchema>

export const AuthResponseSchema = z.object({
  user: UserSchema,
  session: SessionSchema,
})

export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(60),
  userName: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscore'),
  profileName: z.string().min(1).max(60),
})

export type RegisterInput = z.infer<typeof RegisterInputSchema>

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginInput = z.infer<typeof LoginInputSchema>

export const OkResponseSchema = z.object({
  ok: z.literal(true),
})

export type OkResponse = z.infer<typeof OkResponseSchema>

// ============================================================================
// NFT
// ============================================================================

export const NftCategorySchema = z.enum([
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
])

export type NftCategory = z.infer<typeof NftCategorySchema>

export const NftNetworkSchema = z.enum(['Ethereum', 'Polygon', 'Solana'])

export type NftNetwork = z.infer<typeof NftNetworkSchema>

export const NftEditionTypeSchema = z.enum(['1/1', '1/10', '1/50', 'ABERTA'])

export type NftEditionType = z.infer<typeof NftEditionTypeSchema>

export const NftRaritySchema = z.enum(['COMUM', 'RARO', 'ÉPICO', 'LENDÁRIO'])

export type NftRarity = z.infer<typeof NftRaritySchema>

export const NftAttributeSchema = z.object({
  trait_type: z.string(),
  value: z.string(),
})

export type NftAttribute = z.infer<typeof NftAttributeSchema>

export const NftRatingSchema = z.object({
  score: z.number().min(0).max(5),
  count: z.number().int().min(0),
})

export type NftRating = z.infer<typeof NftRatingSchema>

export const NftEditionSchema = z.object({
  type: NftEditionTypeSchema,
  /** Total de edições; `null` para edição ABERTA. */
  total: z.number().int().positive().nullable(),
  /** Unidades disponíveis para compra. */
  available: z.number().int().min(0),
  /** Limite de unidades por comprador. */
  quantityLimit: z.number().int().min(1),
})

export type NftEdition = z.infer<typeof NftEditionSchema>

export const NftSchema = z.object({
  id: z.string(),
  name: z.string(),
  tokenId: z.string(), // id do token (ex.: "#0042")
  price: EthAmountSchema,
  oldPrice: EthAmountSchema.optional(), // preço antigo (desconto)
  collection: z.string(),
  category: NftCategorySchema,
  network: NftNetworkSchema,
  rarity: NftRaritySchema, // selo exibido no card (ex.: "RARO")
  attributes: z.array(NftAttributeSchema),
  rating: NftRatingSchema,
  gallery: z.array(AssetPathSchema).min(1), // galeria de imagens
  image: AssetPathSchema, // imagem principal (capa)
  description: z.string(),
  royalties: z.number().min(0).max(100), // percentual ao criador
  contract: z.string().regex(/^0x[a-fA-F0-9]{40}$/), // contrato ERC-721
  editions: z.array(NftEditionSchema).min(1),
  featured: z.boolean(),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
})

export type Nft = z.infer<typeof NftSchema>

// ============================================================================
// Listagem de NFTs
// ============================================================================

export const NftListTabSchema = z.enum(['todos', 'novos', 'em-alta'])

export type NftListTab = z.infer<typeof NftListTabSchema>

export const NftOrderBySchema = z.enum(['recentes', 'preco-asc', 'preco-desc', 'nome', 'avaliacao'])

export type NftOrderBy = z.infer<typeof NftOrderBySchema>

/** Faixa de preço de referência exibida no filtro do catálogo. */
export const NFT_PRICE_RANGE = {
  min: '0.02',
  max: '12.30',
} as const

export const NFT_TAB_LABELS: Record<NftListTab, string> = {
  todos: 'Todos os NFTs',
  novos: 'Novos lançamentos',
  'em-alta': 'Em alta',
}

export const NFT_ORDER_LABELS: Record<NftOrderBy, string> = {
  recentes: 'Listados recentemente',
  'preco-asc': 'Menor preço',
  'preco-desc': 'Maior preço',
  nome: 'Nome (A–Z)',
  avaliacao: 'Melhor avaliados',
}

export const NftListParamsSchema = z.object({
  q: z.string().optional(),
  collection: z.string().optional(),
  category: NftCategorySchema.optional(),
  network: NftNetworkSchema.optional(),
  rarity: NftRaritySchema.optional(),
  minPrice: EthAmountSchema.optional(),
  maxPrice: EthAmountSchema.optional(),
  tab: NftListTabSchema.default('todos'),
  orderBy: NftOrderBySchema.default('recentes'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(9),
})

export type NftListParams = z.infer<typeof NftListParamsSchema>

export const NftListResponseSchema = z.object({
  items: z.array(NftSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
})

export type NftListResponse = z.infer<typeof NftListResponseSchema>

// ============================================================================
// Favoritos
// ============================================================================

export const FavoriteSchema = z.object({
  userId: z.string(),
  nftId: z.string(),
  createdAt: IsoDateSchema,
})

export type Favorite = z.infer<typeof FavoriteSchema>

export const FavoriteInputSchema = z.object({
  nftId: z.string(),
})

export type FavoriteInput = z.infer<typeof FavoriteInputSchema>

// ============================================================================
// Carrinho
// ============================================================================

export const CartItemInputSchema = z.object({
  nftId: z.string(),
  editionType: NftEditionTypeSchema,
  quantity: z.number().int().min(1),
})

export type CartItemInput = z.infer<typeof CartItemInputSchema>

export const CartItemSchema = CartItemInputSchema.extend({
  id: z.string(), // identidade estável da linha do carrinho
})

export type CartItem = z.infer<typeof CartItemSchema>

export const CartItemUpdateSchema = z.object({
  quantity: z.number().int().min(1),
})

export type CartItemUpdate = z.infer<typeof CartItemUpdateSchema>

export const CartSchema = z.object({
  userId: z.string(),
  items: z.array(CartItemSchema),
  updatedAt: IsoDateSchema,
})

export type Cart = z.infer<typeof CartSchema>

// ============================================================================
// Cotação
// ============================================================================

export const QuoteItemSchema = z.object({
  nftId: z.string(),
  nftName: z.string(),
  nftImage: AssetPathSchema,
  editionType: NftEditionTypeSchema,
  quantity: z.number().int().min(1),
  unitPrice: EthAmountSchema,
  subtotal: EthAmountSchema,
})

export type QuoteItem = z.infer<typeof QuoteItemSchema>

export const CouponStatusSchema = z.enum(['valid', 'invalid', 'expired', 'not_applied'])

export type CouponStatus = z.infer<typeof CouponStatusSchema>

export const QuoteSchema = z.object({
  quoteId: z.string(),
  version: z.number().int().min(1),
  items: z.array(QuoteItemSchema),
  subtotal: EthAmountSchema,
  discount: EthAmountSchema,
  networkFee: EthAmountSchema,
  total: EthAmountSchema,
  coupon: z.string().optional(),
  couponStatus: CouponStatusSchema,
  expiresAt: IsoDateSchema,
})

export type Quote = z.infer<typeof QuoteSchema>

export const QuoteRequestSchema = z.object({
  items: z.array(CartItemInputSchema).min(1),
  coupon: z.string().optional(),
})

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>

// ============================================================================
// Pedidos
// ============================================================================

export const OrderStatusSchema = z.enum(['pending', 'confirmed', 'refused'])

export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const OrderCollectorSnapshotSchema = z.object({
  displayName: z.string(),
  userName: z.string(),
  profileName: z.string(),
  email: z.string().email(),
  walletId: z.string(),
  walletNickname: z.string(),
  walletType: z.enum(['MetaMask', 'WalletConnect', 'Coinbase Wallet']),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  ensName: z.string().optional(),
  network: NftNetworkSchema,
})

export type OrderCollectorSnapshot = z.infer<typeof OrderCollectorSnapshotSchema>

export const OrderItemSnapshotSchema = z.object({
  nftId: z.string(),
  nftName: z.string(),
  nftImage: AssetPathSchema,
  tokenId: z.string(),
  collection: z.string(),
  editionType: NftEditionTypeSchema,
  quantity: z.number().int().min(1),
  unitPrice: EthAmountSchema,
  subtotal: EthAmountSchema,
})

export type OrderItemSnapshot = z.infer<typeof OrderItemSnapshotSchema>

export const OrderSnapshotSchema = z.object({
  quoteId: z.string(),
  quoteVersion: z.number().int().min(1),
  collector: OrderCollectorSnapshotSchema,
  items: z.array(OrderItemSnapshotSchema).min(1),
  subtotal: EthAmountSchema,
  discount: EthAmountSchema,
  networkFee: EthAmountSchema,
  total: EthAmountSchema,
  coupon: z.string().optional(),
  couponStatus: CouponStatusSchema,
  note: z.string().optional(),
  referralCode: z.string().optional(),
  placedAt: IsoDateSchema,
})

export type OrderSnapshot = z.infer<typeof OrderSnapshotSchema>

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: OrderStatusSchema,
  walletId: z.string(),
  network: NftNetworkSchema,
  txRef: z.string().optional(), // ID da transação simulada
  txExplorerUrl: z.string().url().optional(), // link de exploração simulado
  snapshot: OrderSnapshotSchema,
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
})

export type Order = z.infer<typeof OrderSchema>

export const OrderCollectorInputSchema = z.object({
  displayName: z.string().min(1).max(60),
  userName: z.string().min(1).max(40),
  profileName: z.string().min(1).max(60),
  email: z.string().email(),
})

export type OrderCollectorInput = z.infer<typeof OrderCollectorInputSchema>

export const OrderCreateInputSchema = z.object({
  collector: OrderCollectorInputSchema,
  walletId: z.string(),
  network: NftNetworkSchema,
  quoteId: z.string(),
  quoteVersion: z.number().int().min(1),
  note: z.string().max(500).optional(),
  referralCode: z.string().max(50).optional(),
})

export type OrderCreateInput = z.infer<typeof OrderCreateInputSchema>

// ============================================================================
// Perfil
// ============================================================================

export const ProfileSchema = z.object({
  userId: z.string(),
  displayName: z.string().min(1).max(60),
  userName: z.string().min(1).max(40),
  profileName: z.string().min(1).max(60),
  email: z.string().email(),
  avatar: AssetPathSchema.optional(),
})

export type Profile = z.infer<typeof ProfileSchema>

export const ProfileUpdateInputSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  userName: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-zA-Z0-9_]+$/, 'Use apenas letras, números e underscore')
    .optional(),
  profileName: z.string().min(1).max(60).optional(),
  avatar: AssetPathSchema.nullable().optional(),
})

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateInputSchema>

export const PasswordChangeInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

export type PasswordChangeInput = z.infer<typeof PasswordChangeInputSchema>

// ============================================================================
// Carteiras
// ============================================================================

export const WalletTypeSchema = z.enum(['MetaMask', 'WalletConnect', 'Coinbase Wallet'])

export type WalletType = z.infer<typeof WalletTypeSchema>

export const WalletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/)
export const EnsNameSchema = z.string().regex(/^[a-zA-Z0-9-]+\.eth$/)

export const WalletSchema = z.object({
  id: z.string(),
  userId: z.string(),
  nickname: z.string().min(1).max(40), // apelido
  network: NftNetworkSchema,
  address: WalletAddressSchema, // endereço 0x
  type: WalletTypeSchema,
  ensName: EnsNameSchema.optional(), // nome ENS
  isPrimary: z.boolean(), // principal ou secundária
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
})

export type Wallet = z.infer<typeof WalletSchema>

export const WalletCreateInputSchema = z.object({
  nickname: z.string().min(1).max(40),
  network: NftNetworkSchema,
  address: WalletAddressSchema,
  type: WalletTypeSchema,
  ensName: EnsNameSchema.optional(),
  isPrimary: z.boolean().default(false),
})

export type WalletCreateInput = z.infer<typeof WalletCreateInputSchema>

export const WalletUpdateInputSchema = z.object({
  nickname: z.string().min(1).max(40).optional(),
  network: NftNetworkSchema.optional(),
  address: WalletAddressSchema.optional(),
  type: WalletTypeSchema.optional(),
  ensName: EnsNameSchema.nullable().optional(),
  isPrimary: z.boolean().optional(),
})

export type WalletUpdateInput = z.infer<typeof WalletUpdateInputSchema>

// ============================================================================
// Socket.IO — envelope (AGENTS.md)
// ============================================================================

export const SocketEventTypeSchema = z.enum(['nft.updated', 'order.updated'])

export type SocketEventType = z.infer<typeof SocketEventTypeSchema>

export const SocketResourceSchema = z.enum(['nft', 'order'])

export type SocketResource = z.infer<typeof SocketResourceSchema>

export const SocketEventSchema = z.object({
  id: z.string(),
  type: SocketEventTypeSchema,
  resource: SocketResourceSchema,
  resourceId: z.string(),
  version: z.number().int().min(1),
  userId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
})

export type SocketEvent = z.infer<typeof SocketEventSchema>

// ============================================================================
// Health
// ============================================================================

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
})

export type HealthResponse = z.infer<typeof HealthResponseSchema>

// ============================================================================
// Facets do catálogo (sidebar da Home)
// ============================================================================

export const FacetEntrySchema = z.object({
  name: z.string(),
  count: z.number().int().min(0),
})

export type FacetEntry = z.infer<typeof FacetEntrySchema>

export const NftFacetsSchema = z.object({
  categories: z.array(FacetEntrySchema),
  networks: z.array(FacetEntrySchema),
  collections: z.array(FacetEntrySchema),
  priceRange: z.object({ min: EthAmountSchema, max: EthAmountSchema }),
})

export type NftFacets = z.infer<typeof NftFacetsSchema>

// ============================================================================
// Conexão de carteira (simulada)
// ============================================================================

export const WalletConnectionSchema = z.object({
  walletId: z.string(),
  connected: z.boolean(),
  network: NftNetworkSchema,
  address: WalletAddressSchema,
})

export type WalletConnection = z.infer<typeof WalletConnectionSchema>

// ============================================================================
// Artigos editoriais ("Diário da Cunhagem")
// ============================================================================

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  image: AssetPathSchema,
  publishedAt: IsoDateSchema,
  readMinutes: z.number().int().min(1),
})

export type Article = z.infer<typeof ArticleSchema>

// ============================================================================
// Payloads dos eventos Socket.IO (dentro do envelope `SocketEvent.payload`)
// ============================================================================

/** `nft.updated`: estado atual de preço e disponibilidade (lista, detalhe e carrinho se atualizam com ele). */
export const NftUpdatedPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: EthAmountSchema,
  oldPrice: EthAmountSchema.optional(),
  editions: z.array(NftEditionSchema).min(1),
  updatedAt: IsoDateSchema,
})

export type NftUpdatedPayload = z.infer<typeof NftUpdatedPayloadSchema>

/** `order.updated`: novo estado do pedido (somente o dono recebe). */
export const OrderUpdatedPayloadSchema = z.object({
  orderId: z.string(),
  status: OrderStatusSchema,
  txRef: z.string().optional(),
  txExplorerUrl: z.string().url().optional(),
  updatedAt: IsoDateSchema,
})

export type OrderUpdatedPayload = z.infer<typeof OrderUpdatedPayloadSchema>

/**
 * Caminho do Socket.IO. É próprio (não `/socket.io/`) para o servidor simulado casar só este
 * WebSocket e nunca interceptar o do HMR do Vite.
 */
export const REALTIME_PATH = '/realtime/'
