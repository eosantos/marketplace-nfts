# NFT Marketplace

Implementação do desafio frontend — marketplace de NFTs com React, TypeScript e stack moderna.

## Pré-requisitos

- Node.js ≥ 22 (ver `.nvmrc`)
- pnpm ≥ 9

```bash
nvm use        # ou: node -v para confirmar >=22
corepack enable pnpm
```

## Instalação

```bash
pnpm install                 # desenvolvimento
pnpm install --frozen-lockfile  # reproduzível (CI / checkout limpo)
```

Os mocks (MSW) ficam ativos por padrão; só são desativados com `VITE_ENABLE_MOCKS=false`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário:

```bash
cp .env.example .env
```

| Variável             | Padrão    | Descrição                                                      |
|----------------------|-----------|----------------------------------------------------------------|
| `VITE_ENABLE_MOCKS`  | `true`    | Ativa o MSW (intercepta REST e Socket.IO)                      |
| `VITE_MOCK_SCENARIO` | `default` | Cenário de mock (`default`, `empty`, `slow`, `error`, etc.)    |
| `VITE_API_BASE_URL`  | —         | Base URL da API real (ignorada quando `VITE_ENABLE_MOCKS=true`) |

## Credenciais fictícias (disponíveis a partir da Etapa 02)

| Usuário    | E-mail             | Senha       |
|------------|--------------------|-------------|
| Alice      | alice@nft.test     | Alice@123   |
| Bob        | bob@nft.test       | Bob@456     |

## Comandos

```bash
pnpm dev        # inicia o servidor de desenvolvimento (mocks ativos)
pnpm build      # build de produção
pnpm preview    # pré-visualiza o build
pnpm typecheck  # verificação de tipos (tsc --noEmit)
pnpm lint       # ESLint (máx 0 warnings)
pnpm format     # Prettier
pnpm test       # testes unitários com Vitest
pnpm test:e2e   # testes E2E com Playwright
pnpm lighthouse # auditoria de performance (ver docs/lighthouse/)
```

## Cenários de mock (nomes canônicos)

Selecione o cenário via `VITE_MOCK_SCENARIO` no `.env` ou pelo painel de dev (a partir da Etapa 06):

| Cenário | Comportamento |
|---|---|
| `default` | Dados completos, latência realista |
| `empty` | Catálogo, favoritos e carrinhos vazios |
| `slow-random-latency` | Latência variável entre requisições |
| `out-of-order` | Respostas fora de ordem |
| `network-failure` | Falhas de conexão |
| `http-4xx` | Respostas HTTP 4xx |
| `http-5xx` | Respostas HTTP 5xx |
| `session-expired` | Sessão expirada durante a navegação |
| `signup-conflict` | Conflito de cadastro (`EMAIL_TAKEN`) |
| `coupon-invalid` | Cupom inválido |
| `coupon-expired` | Cupom expirado |
| `price-changed-at-checkout` | Preço alterado durante o checkout |
| `sold-out-at-checkout` | Edição esgotada durante a compra |
| `timeout-after-order-created` | Timeout após criar o pedido (recuperação por idempotência) |
| `payment-confirmed` | Pagamento confirmado |
| `payment-refused` | Pagamento recusado |
| `wallet-refused` | Recusa da conexão da carteira (conectar falha; desconectar continua possível) |

O banco simulado usa a chave versionada `kurio:mocks:db:v1` no localStorage. O reset restaura o cenário selecionado:

```bash
# Via painel de dev ou endpoint /__mocks__/reset (ao concluir os handlers da Etapa 01)
# Recarregar com ?reset=1 também limpa o estado persistido.
```


## Estrutura do projeto

```
src/
├── app/           # entry point, globals.css, providers
├── routes/        # file-based routes (TanStack Router)
├── features/      # <feature>/{api,hooks,components,types}
├── shared/
│   ├── api/       # único cliente Axios
│   ├── contracts/ # schemas Zod + tipos inferidos
│   ├── ui/        # componentes shadcn/ui adaptados
│   └── lib/       # utilitários (cn, hooks)
├── mocks/         # MSW: db, handlers, fixtures, scenarios, socket
└── routeTree.gen.ts
tests/e2e/         # specs Playwright
docs/              # PROGRESS, lighthouse reports
design/            # screenshots Figma, tokens, assets
```

## Reproduzir fluxos de falha (disponíveis a partir das etapas 05-07)

Ver `ARCHITECTURE.md` — seção Estratégia de cache e reconciliação.
