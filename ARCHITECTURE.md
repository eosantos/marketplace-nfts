# ARCHITECTURE.md

Decisões de arquitetura, contratos, estratégias de cache e desvios do Figma.

## Stack e versões

| Dependência | Versão fixada | Papel no projeto |
|---|---|---|
| react | ^19.0.0 | Interface declarativa |
| react-dom | ^19.0.0 | Renderização no DOM |
| @tanstack/react-router | ^1.95.1 | Roteamento file-based, estado da URL, proteção de rotas |
| @tanstack/react-query | ^5.62.7 | Estado assíncrono, cache, mutations, invalidação |
| axios | ^1.7.9 | Cliente HTTP único, interceptors, cancelamento |
| socket.io-client | ^4.8.1 | Eventos em tempo real (nft.updated, order.updated) |
| zod | ^3.24.1 | Validação e inferência de tipos dos contratos REST |
| react-hook-form | ^7.54.1 | Gerenciamento de formulários |
| @hookform/resolvers | ^3.9.1 | Integração react-hook-form + zod |
| decimal.js | ^10.4.3 | Aritmética precisa de ETH (nunca `number`) |
| tailwindcss | ^4.0.0 | Estilização utilitária |
| @tailwindcss/vite | ^4.0.0 | Plugin Vite para Tailwind v4 |
| tw-animate-css | ^1.4.0 | Animações dos componentes shadcn/ui (Tailwind v4) |
| shadcn/ui (Radix + CVA) | — | Componentes acessíveis adaptados ao design |
| class-variance-authority | ^0.7.1 | Variantes de componentes |
| clsx + tailwind-merge | ^2.x | Utilitário `cn()` |
| lucide-react | ^0.468.0 | Ícones SVG |
| sonner | ^1.7.1 | Toasts/notificações |
| msw | ^2.15.0 | Mocking na camada de rede (REST + Socket.IO) |
| @mswjs/socket.io-binding | ^0.2.0 | Binding Socket.IO para MSW |
| vite | ^6.0.5 | Build tool e dev server |
| @vitejs/plugin-react | ^4.3.4 | Plugin React para Vite |
| @tanstack/router-plugin | ^1.95.1 | Geração automática de routeTree |
| typescript | ^5.7.2 | Tipagem estrita |
| vitest | ^2.1.8 | Testes unitários |
| jsdom | ^31.0.1 | Ambiente DOM para o Vitest |
| @playwright/test | ^1.49.1 | Testes E2E |
| @axe-core/playwright | ^4.10.1 | Auditoria de acessibilidade nos testes |
| lighthouse | ^12.3.0 | Auditoria de performance |
| eslint | ^9.17.0 | Linting |
| prettier | ^3.4.2 | Formatação |

## Estrutura de pastas

```
src/
├── app/           # entry point (main.tsx), globals.css
├── routes/        # file-based routes — TanStack Router
├── features/      # <feature>/{api, hooks, components, types}
├── shared/
│   ├── api/       # único cliente Axios (src/shared/api/index.ts)
│   ├── contracts/ # schemas Zod + tipos inferidos (compartilhados entre MSW e UI)
│   ├── ui/        # componentes shadcn/ui
│   └── lib/       # utilitários (cn, hooks)
├── mocks/
│   ├── browser.ts     # setup MSW para o browser
│   ├── db/            # estado em memória dos mocks
│   ├── handlers/      # request handlers REST
│   ├── fixtures/      # dados fixos determinísticos
│   ├── scenarios/     # composições de cenários (default, slow, error, etc.)
│   └── socket/        # handlers Socket.IO via @mswjs/socket.io-binding
└── routeTree.gen.ts   # gerado pelo @tanstack/router-plugin
tests/e2e/             # specs Playwright
```

## Contratos REST

Definidos em `src/shared/contracts/index.ts` (Zod + tipos inferidos) e documentados em
`docs/API.md`.

- **Auth/sessão**: `POST /auth/register`, `POST /auth/login`, `GET /session`, `POST /auth/logout`.
- **NFTs**: `GET /nfts` (busca, filtros combináveis, ordenação, paginação) e `GET /nfts/:id`.
- **Favoritos**: `GET /favorites`, `POST /favorites`, `DELETE /favorites/:nftId`.
- **Carrinho**: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:itemId`,
  `DELETE /cart/items/:itemId`, `DELETE /cart`. A linha tem `id` estável e a unicidade
  lógica é `nftId + editionType`.
- **Cotação**: `POST /quote` (`quoteId`, `version`, subtotal, desconto, taxa e total).
- **Pedidos**: `POST /orders` com `Idempotency-Key` e `GET /orders/:id` (recibo com snapshot).
- **Perfil**: `GET /profile`, `PATCH /profile`, `POST /profile/password`.
- **Carteiras**: `GET /wallets`, `POST /wallets`, `PATCH /wallets/:id`.

Modelo do NFT: nome, token ID, preço (`string` ETH), preço antigo opcional, coleção,
categoria (`Arte digital`, `Fotografia`, `Música`, `Arte 3D`, `Colecionáveis`,
`Generativa`, `Jogos`, `Assinaturas`, `Utilidade`), rede (`Ethereum`, `Polygon`,
`Solana`), raridade (`COMUM`, `RARO`, `ÉPICO`, `LENDÁRIO`), atributos, avaliação
(nota/quantidade), galeria, descrição, royalties, contrato e as quatro edições
(`1/1`, `1/10`, `1/50`, `ABERTA`) com disponibilidade e limite de quantidade.

Erros: `ApiError { code, message, fieldErrors? }`, com o mapa HTTP em
`src/shared/contracts/errors.ts`. Valores ETH são strings decimais validadas por regex
e nunca `number`.

## Banco simulado e fixtures (Etapa 01)

- Banco único em `src/mocks/db`, carregado em memória e persistido em `localStorage`
  com a chave versionada `kurio:mocks:db:v1`. `resetDb(scenario)` recria o seed de
  forma determinística; `getDb/saveDb/mutateDb` são usados pelos handlers.
- Seed atual: 64 NFTs (reutilizando as 4 ilustrações copiadas para
  `public/assets/nfts`), 2 usuários com carteiras principais/secundárias, carrinhos e
  favoritos isolados, e cupons válido/inválido/expirado.
- Senhas dos usuários fictícios são armazenadas apenas como PBKDF2-SHA256
  (120.000 iterações) + salt. As credenciais de demonstração ficam no README.
- Cada NFT expõe as quatro edições; `ABERTA` usa `total: null`. `available` é a
  disponibilidade e `quantityLimit` o limite por comprador.
- Nomes canônicos dos cenários em `src/mocks/scenarios/names.ts` (16 cenários). Nesta
  etapa, `default` e `empty` alteram o seed; os demais cenários serão consumidos pelo
  pipeline REST/socket nas etapas 06/07.
- Asset paths usam caminhos locais (`/assets/nfts/...`), sem CDN externo.

## Eventos Socket.IO

> A preencher na Etapa 06 (tempo real)

Eventos previstos: `nft.updated`, `order.updated`.

Envelope: `{ id, type, resource, resourceId, version, userId?, payload }`.

Transporte MSW: `@mswjs/socket.io-binding` intercepta as conexões do `socket.io-client`
e as roteia para handlers no service worker. Limitação: apenas navegador (sem SSE real).

## Política de sessão

> A preencher na Etapa 02 (auth)

## Estado do carrinho

> A preencher na Etapa 05 (carrinho)

## Estratégia de cache (TanStack Query)

> A preencher na Etapa 03 (catálogo)

Princípios já definidos:
- Query keys incluem `userId` em dados privados
- Logout/troca de usuário: `queryClient.clear()` + desconectar socket + limpar storages privados
- AbortSignal do TanStack Query repassado ao Axios

## Reconciliação REST ↔ Socket.IO

> A preencher na Etapa 06 (tempo real)

## Dinheiro (ETH)

- Sempre `string` decimal no transporte e no estado
- `decimal.js` para todos os cálculos e formatação
- Nunca `number` para valores monetários
- Quantidades são inteiros (`number`)
- Totais exibidos vêm da API de cotação, não calculados no cliente

## Desvios do Figma

> A preencher conforme as telas forem implementadas (Etapas 03–08)

Nenhum desvio até a Etapa 00.

## Decisões desta etapa (Etapa 00)

- Tailwind v4 com `@tailwindcss/vite` (sem `tailwind.config.js` — config via CSS)
- shadcn/ui sem CLI (componentes criados manualmente para evitar dependência de rede no CI)
- `tw-animate-css` importado em `globals.css` para as animações `data-[state]` dos componentes shadcn/ui no Tailwind v4
- `@mswjs/socket.io-binding` v0.2.0 (versão mais recente; v0.1.x não publicada)
- ESLint v9 flat config (sem `.eslintrc`)
- Playwright webServer aponta para `pnpm dev` (reutiliza servidor existente se já rodando)
- `routeTree.gen.ts` é gerado pelo plugin; o arquivo atual foi regenerado no build
- MSW fica ativo por padrão (`VITE_ENABLE_MOCKS` só desativa com `"false"`), garantindo `pnpm dev` com mocks e build de demonstração funcional
- `.gitignore` ignora `.env*`, exceto `.env.example`
- Vitest usa `environment: 'jsdom'` com `passWithNoTests` até existirem testes unitários
- `.agents/skills/` é gerado/gerenciado pelo pnpm (skills dos pacotes TanStack) e ignorado pelo `.gitignore` interno; não faz parte do runtime da aplicação
- `pnpm-workspace.yaml` é usado pelo pnpm v12 para permissões de build e skills, não define pacotes adicionais

## Decisões desta etapa (Etapa 01 — tarefas 1–5)

- Contratos usam `EthAmountSchema` (regex de string decimal) e caminhos de imagem
  relativos (`/assets/...`) além de URLs absolutas.
- `NftListResponse` expõe `items, page, pageSize, total`; `totalPages` fica a cargo da UI.
- Abas do catálogo: `todos`, `novos`, `em-alta`; ordenação padrão `recentes`
  (“Listados recentemente”). Faixa de preço de referência exportada como
  `NFT_PRICE_RANGE` (`0.02`–`12.30`).
- Seed do banco é clonado a cada reset (`structuredClone`), evitando que mutations
  contaminem as fixtures originais.
- Persistência é opcional: se `localStorage` falhar (modo privado/quota), o banco segue
  em memória e o app não quebra.
- Cenários não implementados nesta etapa carregam o seed `default` e apenas registram
  o nome ativo; nenhuma falha é mascarável como sucesso nos handlers futuros.

## Decisões desta etapa (Etapa 00b)

- **Roteamento:** file-based (TanStack Router) com rotas planas. Rota inexistente usa o `notFoundComponent` da raiz (não há `404.tsx`). O guarda de rotas privadas (`beforeLoad`) entra na Etapa 02.
- **Cliente HTTP:** um único Axios em `src/shared/api/http.ts`, `baseURL` padrão `/api` (mesma origem). O MSW intercepta `/api/*` tanto em desenvolvimento quanto no build de demonstração.
- **MSW:** `src/mocks/browser.ts` registra `src/mocks/handlers/index.ts`. Mocks ligados por padrão; `VITE_ENABLE_MOCKS=false` desliga.
- **Tema:** tokens de `design/tokens.md` em `@theme` (Tailwind v4) e mapeados para os nomes do shadcn/ui (`primary`/`accent` = cobre `#d08a4b`, `card`/`popover` = `surface`, `destructive` = `danger`). Fonte Roboto Mono self-hosted via `@fontsource-variable/roboto-mono` (sem CDN).
- **Toast:** somente `sonner` (wrapper em `src/shared/ui/sonner.tsx`). O `@radix-ui/react-toast` e o `toast.tsx` foram removidos para evitar dois sistemas de notificação.
- **Deploy:** estático na Vercel (preset Vite), com rewrite de SPA para `/index.html` em `vercel.json`. Variáveis `VITE_ENABLE_MOCKS=true` e `VITE_MOCK_SCENARIO=default` precisam existir no projeto da Vercel antes do build, porque o Vite as embute.


## Decisões desta etapa (Etapa 01 — parte 2a)

- **Serviços + handlers:** a lógica vive em `src/mocks/services` (funções puras sobre o banco, retornam `ServiceResult`), e os handlers em `src/mocks/handlers` só leem a requisição e traduzem o resultado. Isso permite testar a regra sem navegador.
- **Rotas por tipo:** `auth` (login/cadastro/sessão), `public` (catálogo) e `private` (recursos do usuário). Os cenários de falha afetam `public` e `private`; `auth` continua funcionando para o teste poder logar.
- **Sessão:** token Bearer opaco (`kurio_<hex>`) guardado no banco simulado, validade de 2 horas. A política de armazenamento do token no cliente é definida na Etapa 02.
- **Latência determinística:** padrão fixo (180 ms); `slow-random-latency` usa PRNG com seed; `out-of-order` deriva o atraso do hash da URL. Nenhum `Math.random`.
- **Carrinho:** limite por linha = `min(disponível, limite por comprador)`; esgotado responde `AVAILABILITY_CONFLICT`. Totais e preços não são calculados aqui (cotação, parte 2b).
- **Avatar:** upload multipart validado (PNG/JPEG/WebP, 300 KB) e guardado como data URL no banco simulado, para caber no localStorage.
- **Controle:** `/__mocks__/*` e `window.__mocks` são o único caminho para os testes mudarem cenário/dados; nada de setar estado da UI diretamente.
- **Cenário do env:** `VITE_MOCK_SCENARIO` é aplicado na primeira execução e sempre que o valor mudar; entre mudanças, o cenário definido pelo controle persiste no refresh.
