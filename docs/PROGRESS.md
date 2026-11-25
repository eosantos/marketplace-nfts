# PROGRESS.md — NFT Marketplace

Acompanhamento das etapas do desafio.

| Etapa | Título | Status | Resumo | Commit |
|---|---|---|---|---|
| 00 | Ambiente e dependências | ✅ Concluída | Scaffold Vite+React+TS, todas as deps instaladas, Tailwind v4 + tw-animate-css, shadcn/ui (button, input, label, dialog, sheet, select, checkbox, skeleton, toast, form), MSW SW gerado, Playwright Chromium instalado, ESLint/Prettier/Vitest (jsdom) /Playwright configurados, README, ARCHITECTURE e PROGRESS criados. packageManager fixado (pnpm@12.23.0). Auditoria: pnpm install --frozen-lockfile, typecheck, lint, build validados; mocks ativos por padrão | `chore(setup): bootstrap vite react ts project with full dependency set` |
| 00b | Esqueleto, tema e deploy | ✅ Concluída | Rotas esqueleto + `notFoundComponent`, cliente Axios único, MSW com `GET /api/health`, tema KURIO (Roboto Mono self-hosted), toast único (`sonner`), `vercel.json`. Reconstruída após perda de trabalho não commitado. | `feat(setup): restore route skeleton, msw bootstrap and kurio theme` |
| 01 | Mocks e contratos | ✅ Concluída (aguardando merge na main) | Contratos Zod, banco simulado, fixtures, serviços e handlers REST (auth, catálogo/facets, favoritos, carrinho, perfil, carteiras, cotação e pedidos), 16 cenários determinísticos, canal `/__mocks__` e `window.__mocks`, barramento de eventos do banco. | `feat(mocks): ...` (3 commits) |
| 02 | Autenticação | ⏳ Pendente | Login, cadastro, sessão, proteção de rotas | — |
| 03 | Catálogo (Início) | ⏳ Pendente | Busca, filtros, ordenação, paginação, URL como estado | — |
| 04 | Detalhe do NFT | ⏳ Pendente | Galeria, favoritos, quantidade, compra | — |
| 05 | Carrinho | ⏳ Pendente | Itens, cupom, persistência, sincronização | — |
| 06 | Tempo real (Socket.IO) | ⏳ Pendente | nft.updated, order.updated, reconexão | — |
| 07 | Checkout e confirmação | ⏳ Pendente | Pagamento, revisão, idempotência, recibo | — |
| 08 | Perfil e carteiras | ⏳ Pendente | Edição de dados, avatar, senha, carteiras | — |
| 09 | Testes E2E (Playwright) | ⏳ Pendente | 12 cenários do enunciado, regressão visual | — |
| 10 | Performance (Lighthouse) | ⏳ Pendente | Auditoria início e detalhe, mobile+desktop | — |

## Etapa 01 — detalhamento (tarefas 1–5)

Concluído:
- Contratos Zod + tipos inferidos em `src/shared/contracts` (NFT com edições/disponibilidade, carteira, perfil, carrinho, cotação, pedido com snapshot, envelope Socket.IO, `ApiError`).
- Códigos de erro com mapeamento HTTP em `src/shared/contracts/errors.ts`.
- `docs/API.md` com método, rota, params, corpos, respostas e erros dos recursos mínimos.
- Banco simulado único em `src/mocks/db` (memória + localStorage `kurio:mocks:db:v1`), com `resetDb(scenario)`, `getDb`, `saveDb`, `mutateDb` e seed determinístico.
- Fixtures: 64 NFTs reutilizando as 4 imagens em `public/assets/nfts`, 2 usuários com carteiras/carrinhos/favoritos isolados e cupons válido/inválido/expirado.
- Nomes canônicos de cenários em `src/mocks/scenarios/names.ts`, refletidos em `.env.example` e `README.md`.
- Teste unitário de fixtures/banco (`src/mocks/db/db.test.ts`).

Pendente (tarefas 6–11):
- Handlers MSW REST, validação de auth, cotação com `decimal.js`, pedidos idempotentes, máquina de estados e `window.__mocks`.
- Cenários determinísticos de latência/falha e testes de aritmética, paginação e idempotência.

Decisões:
- Linha do carrinho tem `id` estável; unicidade lógica é `nftId + editionType`.
- Cada NFT expõe as quatro edições (`1/1`, `1/10`, `1/50`, `ABERTA`), com `total: null` na aberta.
- Cenário `empty` zera catálogo, favoritos e itens dos carrinhos; usuários e carteiras permanecem.


## Etapa 01 — parte 2a (handlers, auth e cenários)

Concluído (aguardando validação e commit):
- Camada de serviços pura em `src/mocks/services` (auth, catálogo, favoritos, carrinho, perfil, carteiras) e handlers MSW finos em `src/mocks/handlers`.
- Auth com hash PBKDF2 (senha em claro nunca persiste), token Bearer com expiração de 2 h, `GET /session`, logout, troca de senha que encerra as outras sessões.
- Catálogo com busca (sem acento/caixa), filtros, abas, ordenação e paginação reais; `GET /nfts/facets` para a sidebar.
- Favoritos idempotentes; carrinho com limite por edição (`min(disponível, limite por comprador)`), mescla por `nftId + editionType` e checagem de dono.
- Perfil (dados, avatar por upload ou remoção, senha) e carteiras (principal única, endereço único por usuário, conectar/desconectar).
- Cenários `default`, `empty`, `slow-random-latency`, `out-of-order`, `network-failure`, `http-4xx`, `http-5xx`, `session-expired`, `signup-conflict`, `coupon-invalid` e `coupon-expired` (este último consumido pela cotação na 2b), com PRNG por seed.
- Canal `/__mocks__/{state,reset,scenario}` e `window.__mocks`. `VITE_MOCK_SCENARIO` só é reaplicado quando o valor do env muda.
- Testes Vitest: `services.test.ts` e `latency.test.ts`.

Pendente (parte 2b): cotação, pedidos idempotentes, máquina de estados, cenários de checkout e testes de aritmética/idempotência.

## Etapa 01 — parte 2b (cotação, pedidos e cenários de checkout)

Concluído (aguardando validação e commit):
- `POST /quote` com `decimal.js`: subtotal, desconto (percentual/fixo), taxa de rede fixa de 0.016 ETH, total, `quoteId`/`version` incrementais e expiração de 10 min.
- `POST /orders` idempotente (`Idempotency-Key` por usuário, comparação por JSON canônico), revalidação de cotação/preço/estoque e snapshot imutável.
- Máquina de estados `pending → confirmed | refused` com liquidação por timer e preguiçosa em `GET /orders/:id`; estados terminais não regridem; baixa de estoque e limpeza do carrinho só na confirmação.
- Cenários `payment-confirmed`, `payment-refused`, `price-changed-at-checkout`, `sold-out-at-checkout` e `timeout-after-order-created`.
- `src/mocks/events.ts`: barramento de eventos (`order.updated`, `nft.updated`) que o servidor Socket.IO simulado assinará na Etapa 06.
- Testes: `checkout.test.ts` (21 casos) cobrindo aritmética, cupons, idempotência, estados, cenários e eventos.

Decisões:
- A validade do cupom depende só do `status`, para a demonstração não expirar com o calendário.
- Falhas de criação de pedido (409/422) não consomem a `Idempotency-Key`.
- O estoque só baixa na confirmação (pedido pendente não reserva).
