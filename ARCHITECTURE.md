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

> A preencher na Etapa 01 (mocks + contratos)

Recursos previstos: Sessão, NFTs, Favoritos, Carrinho, Cotação, Pedidos, Perfil, Carteiras.

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
