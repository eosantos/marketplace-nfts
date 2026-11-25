# docs/API.md — Contratos REST do Marketplace NFTs

> Contrato alvo desta etapa. Os handlers MSW que implementam estes endpoints entram
> nas tarefas 6–11 da Etapa 01.

Todos os endpoints retornam `application/json`. Erros seguem o contrato `ApiError`:

```ts
{ code: ErrorCode, message: string, fieldErrors?: { field: string, message: string }[] }
```

Valores monetários (ETH) trafegam **sempre como string decimal** — nunca `number`.
Datas são strings ISO 8601 (`2026-07-29T12:00:00.000Z`).

Base URL: `VITE_API_BASE_URL` (ignorada quando `VITE_ENABLE_MOCKS=true`; o MSW intercepta).

Autenticação: `Authorization: Bearer <session.token>` nos recursos privados.
Criação de pedido: header obrigatório `Idempotency-Key`.

---

## Códigos de erro

| Código | HTTP | Significado |
|--------|------|-------------|
| `VALIDATION_ERROR` | 422 | Erro de validação de campos |
| `UNAUTHENTICATED` | 401 | Sem sessão válida |
| `SESSION_EXPIRED` | 401 | Sessão expirada |
| `FORBIDDEN` | 403 | Recurso pertence a outro usuário / sem permissão |
| `NOT_FOUND` | 404 | Recurso inexistente |
| `EMAIL_TAKEN` | 409 | E-mail já cadastrado |
| `AVAILABILITY_CONFLICT` | 409 | Item esgotado ou quantidade acima do disponível |
| `PRICE_CHANGED` | 409 | Preço alterado desde a cotação |
| `IDEMPOTENCY_CONFLICT` | 409 | Mesma chave de idempotência com corpo diferente |
| `COUPON_INVALID` | 400 | Cupom inexistente ou inválido |
| `COUPON_EXPIRED` | 400 | Cupom expirado |
| `TRANSIENT` | 503 | Falha transitória simulada |

---

## Sessão e conta

### `POST /auth/register`
Cria uma conta de colecionador.

**Body** (`RegisterInput`):
```ts
{
  email: string
  password: string          // 8–128 caracteres; hash no mock
  displayName: string
  userName: string          // letras, números e underscore
  profileName: string
}
```

**Resposta 201** (`AuthResponse`):
```ts
{ user: User, session: Session }
```

**Erros**: `VALIDATION_ERROR`, `EMAIL_TAKEN`, `TRANSIENT`

---

### `POST /auth/login`
Autentica e cria sessão.

**Body** (`LoginInput`):
```ts
{ email: string, password: string }
```

**Resposta 200** (`AuthResponse`)
**Erros**: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `TRANSIENT`

---

### `GET /session`
Retorna a sessão atual (recuperável após refresh).

**Resposta 200** (`AuthResponse`)
**Erros**: `UNAUTHENTICATED`, `SESSION_EXPIRED`, `TRANSIENT`

---

### `POST /auth/logout`
Encerra a sessão atual.

**Resposta 200** (`OkResponse`): `{ ok: true }`
**Erros**: `UNAUTHENTICATED`, `TRANSIENT`

---

## NFTs

### `GET /nfts`
Lista NFTs com busca, filtros, ordenação e paginação. Os parâmetros compõem a URL.

**Query** (`NftListParams`):
| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `q` | string | — | Busca por nome/coleção |
| `collection` | string | — | Filtro por coleção |
| `category` | enum | — | `Arte digital`, `Fotografia`, `Música`, `Arte 3D`, `Colecionáveis`, `Generativa`, `Jogos`, `Assinaturas`, `Utilidade` |
| `network` | enum | — | `Ethereum`, `Polygon`, `Solana` |
| `rarity` | enum | — | `COMUM`, `RARO`, `ÉPICO`, `LENDÁRIO` |
| `minPrice` | string ETH | — | Preço mínimo (referência: `0.02`) |
| `maxPrice` | string ETH | — | Preço máximo (referência: `12.30`) |
| `tab` | `todos\|novos\|em-alta` | `todos` | `Todos os NFTs`, `Novos lançamentos`, `Em alta` |
| `orderBy` | `recentes\|preco-asc\|preco-desc\|nome\|avaliacao` | `recentes` | `Listados recentemente` é o padrão |
| `page` | int | `1` | Página (mínimo 1) |
| `pageSize` | int | `9` | Itens por página (máximo 60) |

**Resposta 200** (`NftListResponse`):
```ts
{ items: Nft[], page: number, pageSize: number, total: number }
```

**Erros**: `VALIDATION_ERROR`, `TRANSIENT`

---

### `GET /nfts/:id`
Detalhe de um NFT, incluindo galeria, atributos, avaliação, royalties, contrato e edições
(`1/1`, `1/10`, `1/50`, `ABERTA`) com disponibilidade e limite de quantidade.

**Resposta 200**: `Nft`
**Erros**: `NOT_FOUND`, `TRANSIENT`

---

## Favoritos

### `GET /favorites`
Lista os NFTs favoritados pelo usuário autenticado.

**Resposta 200**: `Nft[]`
**Erros**: `UNAUTHENTICATED`, `SESSION_EXPIRED`, `TRANSIENT`

---

### `POST /favorites`
Adiciona um NFT aos favoritos. Operação idempotente para o mesmo par usuário/NFT.

**Body** (`FavoriteInput`): `{ nftId: string }`
**Resposta 201**: `Favorite`
**Erros**: `VALIDATION_ERROR`, `NOT_FOUND`, `UNAUTHENTICATED`, `TRANSIENT`

---

### `DELETE /favorites/:nftId`
Remove um NFT dos favoritos.

**Resposta 200** (`OkResponse`)
**Erros**: `NOT_FOUND`, `UNAUTHENTICATED`, `TRANSIENT`

---

## Carrinho

Cada linha é identificada por `id` e representa um par único `nftId` + `editionType`.

### `GET /cart`
Retorna o carrinho do usuário autenticado.

**Resposta 200** (`Cart`):
```ts
{
  userId: string
  items: { id: string, nftId: string, editionType: '1/1'|'1/10'|'1/50'|'ABERTA', quantity: number }[]
  updatedAt: string
}
```

**Erros**: `UNAUTHENTICATED`, `SESSION_EXPIRED`, `TRANSIENT`

---

### `POST /cart/items`
Adiciona um item ou incrementa a quantidade de um par `nftId` + `editionType` existente.

**Body** (`CartItemInput`):
```ts
{ nftId: string, editionType: '1/1'|'1/10'|'1/50'|'ABERTA', quantity: number }
```

**Resposta 200**: `Cart`
**Erros**: `VALIDATION_ERROR`, `NOT_FOUND`, `AVAILABILITY_CONFLICT`, `UNAUTHENTICATED`, `TRANSIENT`

---

### `PATCH /cart/items/:itemId`
Altera a quantidade de uma linha do carrinho.

**Body** (`CartItemUpdate`): `{ quantity: number }`
**Resposta 200**: `Cart`
**Erros**: `VALIDATION_ERROR`, `NOT_FOUND`, `AVAILABILITY_CONFLICT`, `FORBIDDEN`, `TRANSIENT`

---

### `DELETE /cart/items/:itemId`
Remove uma linha do carrinho.

**Resposta 200**: `Cart`
**Erros**: `NOT_FOUND`, `FORBIDDEN`, `TRANSIENT`

---

### `DELETE /cart`
Esvazia o carrinho.

**Resposta 200** (`OkResponse`)
**Erros**: `UNAUTHENTICATED`, `TRANSIENT`

---

## Cotação

### `POST /quote`
Calcula subtotal, desconto do cupom, taxa de rede e total com `decimal.js`, e valida
disponibilidade e limite de quantidade. Cada cotação recebe `quoteId` e `version` incrementais.

**Body** (`QuoteRequest`):
```ts
{
  items: { nftId: string, editionType: '1/1'|'1/10'|'1/50'|'ABERTA', quantity: number }[]
  coupon?: string
}
```

**Resposta 200** (`Quote`):
```ts
{
  quoteId: string
  version: number
  items: {
    nftId: string, nftName: string, nftImage: string,
    editionType: '1/1'|'1/10'|'1/50'|'ABERTA',
    quantity: number, unitPrice: string, subtotal: string
  }[]
  subtotal: string
  discount: string
  networkFee: string
  total: string
  coupon?: string
  couponStatus: 'valid'|'invalid'|'expired'|'not_applied'
  expiresAt: string
}
```

**Erros**: `VALIDATION_ERROR`, `NOT_FOUND`, `AVAILABILITY_CONFLICT`, `COUPON_INVALID`,
`COUPON_EXPIRED`, `TRANSIENT`

---

## Pedidos

### `POST /orders`
Cria um pedido idempotente a partir de uma cotação válida.

**Headers**: `Idempotency-Key: <string única>` (obrigatório)

**Body** (`OrderCreateInput`):
```ts
{
  collector: { displayName: string, userName: string, profileName: string, email: string }
  walletId: string
  network: 'Ethereum'|'Polygon'|'Solana'
  quoteId: string
  quoteVersion: number
  note?: string                 // observação do colecionador
  referralCode?: string         // código de indicação
}
```

**Resposta 201**: `Order` com `status: 'pending'` e `snapshot` imutável.
Reenvio da mesma `Idempotency-Key` com o mesmo corpo retorna o mesmo pedido (sem duplicar).
Mesma chave com corpo diferente → `IDEMPOTENCY_CONFLICT`.

**Erros**: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `NOT_FOUND`,
`AVAILABILITY_CONFLICT`, `PRICE_CHANGED`, `COUPON_INVALID`, `COUPON_EXPIRED`,
`IDEMPOTENCY_CONFLICT`, `TRANSIENT`

---

### `GET /orders/:id`
Consulta o estado e o recibo de um pedido. Estados terminais (`confirmed`, `refused`)
não regridem.

**Resposta 200** (`Order`):
```ts
{
  id: string
  userId: string
  status: 'pending'|'confirmed'|'refused'
  walletId: string
  network: 'Ethereum'|'Polygon'|'Solana'
  txRef?: string                // ID da transação simulada
  txExplorerUrl?: string        // link de exploração simulado
  snapshot: {
    quoteId: string
    quoteVersion: number
    collector: {
      displayName: string, userName: string, profileName: string, email: string,
      walletId: string, walletNickname: string,
      walletType: 'MetaMask'|'WalletConnect'|'Coinbase Wallet',
      walletAddress: string, ensName?: string,
      network: 'Ethereum'|'Polygon'|'Solana'
    }
    items: {
      nftId: string, nftName: string, nftImage: string, tokenId: string,
      collection: string, editionType: '1/1'|'1/10'|'1/50'|'ABERTA',
      quantity: number, unitPrice: string, subtotal: string
    }[]
    subtotal: string
    discount: string
    networkFee: string
    total: string
    coupon?: string
    couponStatus: 'valid'|'invalid'|'expired'|'not_applied'
    note?: string
    referralCode?: string
    placedAt: string
  }
  createdAt: string
  updatedAt: string
}
```

**Erros**: `NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`, `TRANSIENT`

---

## Perfil

### `GET /profile`
Dados do colecionador autenticado.

**Resposta 200** (`Profile`):
```ts
{ userId: string, displayName: string, userName: string, profileName: string, email: string, avatar?: string }
```

**Erros**: `UNAUTHENTICATED`, `SESSION_EXPIRED`, `TRANSIENT`

---

### `PATCH /profile`
Atualiza dados e avatar. `avatar: null` remove o avatar.

**Body** (`ProfileUpdateInput`):
```ts
{ displayName?: string, userName?: string, profileName?: string, avatar?: string | null }
```

**Resposta 200**: `Profile`
**Erros**: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `TRANSIENT`

---

### `POST /profile/password`
Altera a senha. A senha atual é verificada contra o hash do mock.

**Body** (`PasswordChangeInput`):
```ts
{ currentPassword: string, newPassword: string }
```

**Resposta 200** (`OkResponse`)
**Erros**: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `TRANSIENT`

---

## Carteiras

Campos: apelido, rede, endereço `0x` (40 hex), tipo
(`MetaMask`, `WalletConnect`, `Coinbase Wallet`), nome ENS (`.eth`) e
indicador de carteira principal. No máximo uma carteira principal por usuário.

### `GET /wallets`
Lista as carteiras do usuário autenticado.

**Resposta 200**: `Wallet[]`
**Erros**: `UNAUTHENTICATED`, `SESSION_EXPIRED`, `TRANSIENT`

---

### `POST /wallets`
Cadastra uma carteira.

**Body** (`WalletCreateInput`):
```ts
{
  nickname: string
  network: 'Ethereum'|'Polygon'|'Solana'
  address: string               // 0x + 40 hex
  type: 'MetaMask'|'WalletConnect'|'Coinbase Wallet'
  ensName?: string              // ex.: "alice.eth"
  isPrimary?: boolean           // padrão: false
}
```

**Resposta 201**: `Wallet`
**Erros**: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `TRANSIENT`

---

### `PATCH /wallets/:id`
Atualiza uma carteira do usuário. Se `isPrimary` for `true`, as demais são rebaixadas
para secundárias.

**Body** (`WalletUpdateInput`): campos opcionais de `WalletCreateInput`;
`ensName: null` remove o nome ENS.
**Resposta 200**: `Wallet`
**Erros**: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`, `TRANSIENT`

---

## Estado simulado

O banco dos mocks é único e persistido em `localStorage` sob a chave versionada
`kurio:mocks:db:v1`. O reset restaura integralmente o cenário selecionado por
`VITE_MOCK_SCENARIO` (ver README para a lista canônica). Na etapa atual, o seed
distingue `default` (catálogo completo) de `empty` (catálogo, favoritos e carrinhos
vazios); as respostas específicas dos demais cenários são aplicadas nas etapas 06/07.

Fixtures atuais: 64 NFTs, 2 usuários, carteiras principais/secundárias, carrinhos e
favoritos independentes por usuário, e cupons válidos, inválidos e expirados.
