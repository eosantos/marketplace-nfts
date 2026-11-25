# PROGRESS.md — NFT Marketplace

Acompanhamento das etapas do desafio.

| Etapa | Título | Status | Resumo | Commit |
|---|---|---|---|---|
| 00 | Ambiente e dependências | ✅ Concluída | Scaffold Vite+React+TS, todas as deps instaladas, Tailwind v4 + tw-animate-css, shadcn/ui (button, input, label, dialog, sheet, select, checkbox, skeleton, toast, form), MSW SW gerado, Playwright Chromium instalado, ESLint/Prettier/Vitest (jsdom) /Playwright configurados, README, ARCHITECTURE e PROGRESS criados. packageManager fixado (pnpm@12.23.0). Auditoria: pnpm install --frozen-lockfile, typecheck, lint, build validados; mocks ativos por padrão | `chore(setup): bootstrap vite react ts project with full dependency set` |
| 00b | Tokens de design | ⏳ Pendente | Extrair tokens do Figma e configurar globals.css | — |
| 01 | Mocks e contratos | ⏳ Pendente | MSW handlers REST, contratos Zod, cenários, fixtures | — |
| 02 | Autenticação | ⏳ Pendente | Login, cadastro, sessão, proteção de rotas | — |
| 03 | Catálogo (Início) | ⏳ Pendente | Busca, filtros, ordenação, paginação, URL como estado | — |
| 04 | Detalhe do NFT | ⏳ Pendente | Galeria, favoritos, quantidade, compra | — |
| 05 | Carrinho | ⏳ Pendente | Itens, cupom, persistência, sincronização | — |
| 06 | Tempo real (Socket.IO) | ⏳ Pendente | nft.updated, order.updated, reconexão | — |
| 07 | Checkout e confirmação | ⏳ Pendente | Pagamento, revisão, idempotência, recibo | — |
| 08 | Perfil e carteiras | ⏳ Pendente | Edição de dados, avatar, senha, carteiras | — |
| 09 | Testes E2E (Playwright) | ⏳ Pendente | 12 cenários do enunciado, regressão visual | — |
| 10 | Performance (Lighthouse) | ⏳ Pendente | Auditoria início e detalhe, mobile+desktop | — |
