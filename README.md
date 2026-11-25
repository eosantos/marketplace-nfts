# NFT Marketplace

Demonstração pública: https://marketplace-nfts-ten.vercel.app/

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
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial (nomes na seção "Cenários de mock")            |
| `VITE_API_BASE_URL`  | —         | Base URL da API real (ignorada quando `VITE_ENABLE_MOCKS=true`) |

## Credenciais fictícias

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
pnpm test:e2e   # E2E com Playwright (fluxos; desktop 1440 e mobile 390)
pnpm test:e2e:update # gera/atualiza as baselines de regressão visual
pnpm test:e2e:visual # compara com as baselines visuais
pnpm lighthouse # Lighthouse (mediana de 3) -> docs/lighthouse/ (requer `pnpm build` e o Chromium do Playwright)
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

O banco simulado usa a chave versionada `kurio:mocks:db:v1` no localStorage. O `VITE_MOCK_SCENARIO` só é reaplicado quando o valor muda; um cenário escolhido em tempo de execução sobrevive ao refresh.

### Selecionar e resetar cenários em tempo de execução
No console do navegador (mocks ligados), `window.__mocks` expõe:

```js
window.__mocks.reset('default')            // restaura o banco e o cenário
window.__mocks.setScenario('payment-refused') // troca o cenário mantendo os dados
window.__mocks.getState()                  // { scenario, users, sessions, nfts, orders }
window.__mocks.emitNft({ nftId: 'nft_002', price: '3.50' }) // altera o NFT e emite nft.updated (Socket.IO)
window.__mocks.dropSocket()                // derruba as conexões (testa a reconexão)
window.__mocks.socketState()               // { connected, authenticated }
```

Os mesmos controles existem em HTTP interceptado pelo MSW: `POST /__mocks__/reset`, `/__mocks__/scenario`, `/__mocks__/emit`, `/__mocks__/socket/drop` e `GET /__mocks__/state`, `/__mocks__/socket`.

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

## Reproduzir fluxos de falha
Entre como Alice, adicione um NFT ao carrinho, rode o comando no console e siga até "Confirmar compra" em `/checkout`:

| Falha | Comando | Resultado esperado |
|---|---|---|
| Pagamento recusado | `__mocks.setScenario('payment-refused')` | "Pagamento recusado"; carrinho preservado; "Tentar novamente" |
| Preço mudou no checkout | `__mocks.setScenario('price-changed-at-checkout')` | Painel com o que mudou; exige "Aceitar novos valores e confirmar" |
| Esgotado no checkout | `__mocks.setScenario('sold-out-at-checkout')` | Compra bloqueada, nenhum pedido criado |
| Timeout após criar o pedido | `__mocks.setScenario('timeout-after-order-created')` | O reenvio usa a mesma `Idempotency-Key` e recupera o mesmo pedido |
| Carteira recusada | `__mocks.setScenario('wallet-refused')` | "Conectar carteira" falha; é possível tentar de novo |
| Sessão expirada | `__mocks.setScenario('session-expired')` | Diálogo "Sessão expirada" e retomada após novo login |
| Tempo real | `__mocks.emitNft({ nftId: 'nft_002', price: '3.50' })` / `__mocks.dropSocket()` | Preço atualiza sem recarregar; o cliente reconecta e reconcilia por REST |

Clique repetido, recarregar com pedido pendente e queda do socket estão cobertos em `tests/e2e/`. Detalhes em `ARCHITECTURE.md`.

## Testes E2E (Playwright)
- Primeira vez: `pnpm exec playwright install chromium`.
- `pnpm test:e2e` compila o app com `VITE_ENABLE_MOCKS=true`, sobe o `vite preview` (porta 4173) e roda os fluxos em dois projetos: `chromium-desktop` (1440x900) e `chromium-mobile` (390x844). `PW_DEV=1 pnpm test:e2e` usa o servidor de dev.
- Cada teste restaura o banco simulado e o cenário por `window.__mocks.reset(...)`; nenhum teste mexe no cache ou no estado da UI.
- Cobertura: acessibilidade com axe-core (`a11y.spec.ts`), compra completa, pagamento recusado, clique repetido, timeout após criar o pedido, preço alterado e esgotado no checkout, retomada de pedido pendente, eventos Socket.IO (atualização, duplicado/antigo, queda e reconexão), perfil, avatar, senha e carteiras.
- Regressão visual (início, detalhe, carrinho, pagamento): rode `pnpm test:e2e:update` uma vez para criar as baselines em `tests/e2e/__screenshots__/` e depois `pnpm test:e2e:visual`. As baselines dependem do sistema operacional; gere-as na máquina que as comparará.
- Relatório: `pnpm exec playwright show-report`.

## Lighthouse
`pnpm build && pnpm lighthouse` serve o build com `vite preview`, audita início (`/`) e detalhe (`/nft/nft_002`) nos perfis mobile e desktop, executa 3 medições por combinação e grava em `docs/lighthouse/`: `REPORT.md` (medianas, LCP/CLS/TBT, versões e ambiente), `summary.json` e HTML/JSON da execução mais próxima da mediana. Para auditar o deploy: `pnpm lighthouse --url=https://<deploy>`. A configuração fica em `scripts/lighthouse.mjs`.

## Deploy (Vercel)
O `vercel.json` já define preset Vite, `pnpm build`, `dist`, fallback de SPA (rotas como `/cart` funcionam no refresh), cabeçalhos de `mockServiceWorker.js` e as variáveis `VITE_ENABLE_MOCKS=true` e `VITE_MOCK_SCENARIO=default`. Basta importar o repositório na Vercel. A URL pública fica em `docs/PROGRESS.md`.
