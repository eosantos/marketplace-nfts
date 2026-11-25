# docs/API.md — Contratos REST do Marketplace NFTs

> Contrato dos endpoints. Handlers implementados: sessão, NFTs, favoritos, carrinho, perfil e carteiras
> e, na parte 2b, cotação e pedidos.

Todos os endpoints retornam `application/json`. Erros seguem o contrato `ApiError`:

```ts
{ code: ErrorCode, message: string, fieldErrors?: { field: string, message: string }[] }
```

Valores monetários (ETH) trafegam **sempre como string decimal** — nunca `number`.
Datas são strings ISO 8601 (`2026-07-29T12:00:00.000Z`).

Base URL: `VITE_API_BASE_URL` (padrão `/api`, mesma origem). Com `VITE_ENABLE_MOCKS=true` o MSW intercepta `/api/*`. Os caminhos deste documento são relativos a essa base (ex.: `GET /nfts` = `GET /api/nfts`). Verificação de saúde dos mocks: `GET /health` -> `{ "status": "ok", "mocks": true }`.

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

### `GET /nfts/facets`
Contagens para a sidebar da Home (categorias, redes, coleções) e faixa de preço de referência.
Deve ser registrada antes de `/nfts/:id`.

**Resposta 200** (`NftFacets`):
```ts
{
  categories: { name: string, count: number }[]
  networks: { name: string, count: number }[]
  collections: { name: string, count: number }[]
  priceRange: { min: string, max: string }
}
```

---

### `GET /articles`
Artigos da seção "Diário da Cunhagem" da Home (conteúdo editorial estático).

**Resposta 200**: `Article[]` — `{ id, title, excerpt, image, publishedAt, readMinutes }`

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

Regras do mock:
- Taxa de rede fixa de `0.016` ETH por cotação; a cotação expira em 10 minutos.
- Linhas repetidas (mesmo `nftId` + `editionType`) são somadas antes de validar estoque.
- Cupom inválido ou expirado responde **HTTP 400** com `fieldErrors: [{ field: "coupon", ... }]`
  e nenhuma cotação é criada (o cliente mantém a cotação anterior). A validade do cupom usa só o
  `status` do cupom, não a data do calendário. Percentual e valor fixo nunca passam do subtotal.
- Cupons de demonstração: `KURIO10` (10%), `KURIO25` (0.25 ETH), `KURIO-VENCIDO` (expirado), `KURIO-INVALIDO`.
- `quoteId` (`quote_N`) e `version` (N) são incrementais.

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

Regras do mock:
- Criação responde **201**; o reenvio idempotente responde **200** com o mesmo pedido. A chave vale por
  usuário. Tentativas que falham (409, 422...) não consomem a chave.
- Corpos são comparados por JSON canônico (a ordem das chaves não importa).
- Antes de criar, revalida a cotação (dono, versão, expiração) e o estado atual: preço diferente do da
  cotação → `PRICE_CHANGED`; estoque ou limite insuficiente → `AVAILABILITY_CONFLICT`.
- O pedido nasce `pending` e é liquidado após ~2,5 s (`confirmed`, ou `refused` no cenário
  `payment-refused`). `GET /orders/:id` também liquida de forma preguiçosa pedidos vencidos
  (refresh, aba fechada). **Estados terminais nunca regridem.**
- Na confirmação: `txRef` (0x + 64 hex) e `txExplorerUrl` (Etherscan, Polygonscan ou Solscan conforme a
  rede), baixa de estoque da edição e remoção do carrinho **somente** das unidades compradas. Pedido
  recusado não altera estoque nem carrinho.
- O `snapshot` é imutável: mudanças posteriores no catálogo não alteram o recibo.

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

### `POST /profile/avatar`
Envia o avatar como `multipart/form-data` (campo `avatar`). Aceita PNG, JPEG e WebP de até
300 KB; o mock guarda o arquivo como data URL.

**Resposta 200**: `Profile`
**Erros**: `VALIDATION_ERROR` (campo `avatar`), `UNAUTHENTICATED`, `SESSION_EXPIRED`, `TRANSIENT`

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

### `POST /wallets/:id/connect` e `POST /wallets/:id/disconnect`
Conexão e desconexão simuladas da carteira (o checkout consome este estado).

**Resposta 200** (`WalletConnection`): `{ walletId: string, connected: boolean, network: string, address: string }`
**Erros**: `NOT_FOUND`, `FORBIDDEN`, `UNAUTHENTICATED`, `SESSION_EXPIRED`, `TRANSIENT`

---

## Canal de controle dos mocks

Fora de `/api`, sem latência nem falhas de cenário. Usado pelos testes E2E e para depuração.

| Rota | Corpo | Efeito |
|------|-------|--------|
| `GET /__mocks__/state` | — | Cenário ativo e contagens do banco |
| `POST /__mocks__/reset` | `{ scenario?: string }` | Restaura integralmente o cenário (padrão `default`) |
| `POST /__mocks__/scenario` | `{ scenario: string }` | Troca o cenário mantendo os dados |
| `POST /__mocks__/emit` | `{ nftId, price?, available?: { edition, value }, duplicate?, stale? }` | Altera o NFT no banco e emite `nft.updated` pelo Socket.IO simulado; `duplicate` reenvia o mesmo evento, `stale` envia depois um evento antigo (versão menor, preço errado) |
| `GET /__mocks__/socket` | — | Conexões abertas e autenticadas |
| `POST /__mocks__/socket/drop` | — | Derruba as conexões Socket.IO (os clientes reconectam e reconciliam) |

Com os mocks ativos, o mesmo controle existe em `window.__mocks`:
`reset(scenario?)`, `setScenario(scenario)`, `getState()`, `emitNft(opções)`, `dropSocket()` e `socketState()`.

## Cenários implementados

| Cenário | Efeito |
|---------|--------|
| `default` | Latência fixa de 180 ms |
| `empty` | Catálogo, favoritos e carrinhos vazios (use `reset`) |
| `slow-random-latency` | 400–2600 ms, sequência reproduzível por seed |
| `out-of-order` | Latência depende da URL: buscas terminam fora da ordem de envio |
| `network-failure` | Falha de rede em todas as rotas de negócio |
| `http-4xx` | `FORBIDDEN` (403) em catálogo e recursos privados; auth continua funcionando |
| `http-5xx` | `TRANSIENT` (503) em catálogo e recursos privados; auth continua funcionando |
| `session-expired` | Recursos privados e `GET /session` respondem `SESSION_EXPIRED` |
| `signup-conflict` | `POST /auth/register` responde `EMAIL_TAKEN` |
| `coupon-invalid` / `coupon-expired` | Impõem o status do cupom (consumidos pela cotação, parte 2b) |

Cenários de cotação e pedidos (parte 2b):

| Cenário | Efeito |
|---------|--------|
| `payment-confirmed` | Pedido confirmado após ~2,5 s (mesmo comportamento do `default`) |
| `payment-refused` | Pedido recusado após ~2,5 s; estoque e carrinho intactos |
| `price-changed-at-checkout` | Na **primeira** tentativa de pedido, o preço dos NFTs da cotação sobe 0.10 ETH no banco e a criação responde `PRICE_CHANGED`; uma nova cotação já traz o preço novo |
| `sold-out-at-checkout` | Na **primeira** tentativa de pedido, a edição do 1º item esgota e a criação responde `AVAILABILITY_CONFLICT`; novas cotações com ela também falham |
| `timeout-after-order-created` | O pedido é criado, mas a resposta só chega como erro de rede após 20 s (o cliente deve usar timeout menor). Reenviar a mesma `Idempotency-Key` devolve o mesmo pedido |

Os eventos únicos usam marcas no banco (`scenarioFlags`); `reset` as limpa.

## Estado simulado

O banco dos mocks é único e persistido em `localStorage` sob a chave versionada
`kurio:mocks:db:v1`. O reset restaura integralmente o cenário selecionado por
`VITE_MOCK_SCENARIO` (ver README para a lista canônica). Na etapa atual, o seed
distingue `default` (catálogo completo) de `empty` (catálogo, favoritos e carrinhos
vazios); os demais cenários mudam o comportamento dos handlers (ver a tabela de cenários).

Fixtures atuais: 64 NFTs, 2 usuários, carteiras principais/secundárias, carrinhos e
favoritos independentes por usuário, e cupons válidos, inválidos e expirados.
