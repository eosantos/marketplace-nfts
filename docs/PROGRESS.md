# PROGRESS.md — NFT Marketplace

Acompanhamento das etapas do desafio.

**URL pública:** https://marketplace-nfts-ten.vercel.app/

| Etapa | Título | Status | Resumo | Commit |
|---|---|---|---|---|
| 00 | Ambiente e dependências | ✅ Concluída | Scaffold Vite+React+TS, todas as deps instaladas, Tailwind v4 + tw-animate-css, shadcn/ui (button, input, label, dialog, sheet, select, checkbox, skeleton, toast, form), MSW SW gerado, Playwright Chromium instalado, ESLint/Prettier/Vitest (jsdom) /Playwright configurados, README, ARCHITECTURE e PROGRESS criados. packageManager fixado (pnpm@12.23.0). Auditoria: pnpm install --frozen-lockfile, typecheck, lint, build validados; mocks ativos por padrão | `chore(setup): bootstrap vite react ts project with full dependency set` |
| 00b | Esqueleto, tema e deploy | ✅ Concluída | Rotas esqueleto + `notFoundComponent`, cliente Axios único, MSW com `GET /api/health`, tema KURIO (Roboto Mono self-hosted), toast único (`sonner`), `vercel.json`. Reconstruída após perda de trabalho não commitado. | `feat(setup): restore route skeleton, msw bootstrap and kurio theme` |
| 01 | Mocks e contratos | ✅ Concluída (aguardando merge na main) | Contratos Zod, banco simulado, fixtures, serviços e handlers REST (auth, catálogo/facets, favoritos, carrinho, perfil, carteiras, cotação e pedidos), 16 cenários determinísticos, canal `/__mocks__` e `window.__mocks`, barramento de eventos do banco. | `feat(mocks): ...` (3 commits) |
| 02 | Autenticação | ✅ Concluída | Login e cadastro (modal no desktop, tela cheia no mobile), sessão persistida, Bearer no Axios, 401 → diálogo de sessão expirada com retomada, redirect seguro, rotas privadas, isolamento de cache, header com menu do usuário. | `feat(auth): add login, signup, session handling and private routes` |
| 03 | Catálogo (Início) | ✅ Concluída | Home completa com URL como estado, filtros, skeleton, paginação, mobile e rodapé. | `feat(catalog): add home page with url-driven catalog, filters and mobile layout` |
| 04 | Detalhe do NFT | ✅ Concluída | Detalhe com galeria, edições, quantidade com limite, abas, relacionados e barra mobile; favoritos otimistas com rollback; ações de hover nos cards. | `feat(nft): add nft detail page, optimistic favorites and card actions` |
| 05 | Carrinho | ✅ Concluída | Página /cart com resumo só da cotação, quantidade otimista em série, cupom, carrinho de visitante e mescla ao entrar. | `feat(cart): add cart page, server quote summary, coupon and guest cart merge` |
| 06 | Tempo real (Socket.IO) | ✅ Concluída | `socket.io-client` atrelado à sessão e servidor simulado no MSW (`ws.link` + binding) sobre o mesmo banco do REST; ledger, avisos acessíveis e reconciliação por REST. | `feat(realtime): add socket.io realtime with msw-simulated server and rest reconciliation` |
| 07 | Checkout e pedidos | ✅ Concluída | Checkout com revisão e revalidação (mudanças exigem nova confirmação), carteira com conexão/recusa/desconexão, `Idempotency-Key` por tentativa com reenvio após timeout, pedido pendente/confirmado/recusado com retomada após refresh, e recibo por snapshot. | `feat(checkout): add checkout, idempotent orders and receipt` |
| 08 | Perfil e carteiras | ✅ Concluída | Edição de dados, avatar (upload multipart), troca de senha, carteira principal e secundárias | `feat(profile): add profile, avatar, password and wallets management` |
| 09 | Testes E2E (Playwright) | ✅ Concluída | Fluxos de compra e falha, tempo real, conta e carteiras, axe-core e regressão visual (desktop 1440 e mobile 390) | `test(e2e): add playwright flows for purchase, realtime, account and visual baselines` |
| 10 | Performance (Lighthouse) e deploy | ✅ Concluída | Code splitting, entrada paralela com o MSW, imagens WebP, `pnpm lighthouse` (mediana de 3, `docs/lighthouse/`) e deploy na Vercel | `perf(build): split routes and vendors, add lighthouse script and vercel config` |

## Etapa 01 — detalhamento (tarefas 1–5)

Concluído:
- Contratos Zod + tipos inferidos em `src/shared/contracts` (NFT com edições/disponibilidade, carteira, perfil, carrinho, cotação, pedido com snapshot, envelope Socket.IO, `ApiError`).
- Códigos de erro com mapeamento HTTP em `src/shared/contracts/errors.ts`.
- `docs/API.md` com método, rota, params, corpos, respostas e erros dos recursos mínimos.
- Banco simulado único em `src/mocks/db` (memória + localStorage `kurio:mocks:db:v2`), com `resetDb(scenario)`, `getDb`, `saveDb`, `mutateDb` e seed determinístico.
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

## Etapa 02 — Autenticação e sessão

Concluído (aguardando validação e commit):
- Telas `/login` e `/signup` conforme o Figma: modal com abas e barra cobre no desktop, tela cheia com logo e link de troca no mobile; foco preso, Esc fecha, foco inicial no primeiro campo.
- Formulários com react-hook-form + zod; erros da API associados ao campo (`aria-describedby`, `aria-invalid`, `role="alert"`); botão de mostrar/ocultar senha; estado de envio.
- Sessão em `localStorage` com sincronização entre abas, interceptor do Axios (Bearer + 401), diálogo de sessão expirada, `safeRedirect` e guardas de rota.
- `SiteHeader` (desktop) com contador do carrinho e menu do usuário (perfil, carteiras, sair); itens fora do escopo ficam desabilitados com "Em breve".
- Ícones em `src/shared/icons` gerados dos SVGs do Figma (`currentColor` nos monocromáticos). **Genérico a trocar:** `CoinbaseWalletIcon`.
- Cobre exato do Figma (`#D28A4C`) aplicado ao tema.
- Testes: `redirect`, `session-store`, `http` (interceptores e `parseApiError`) e `lifecycle` (isolamento de cache e 401).

Decisões e desvios do Figma:
- "Entrar com Google/Facebook" e "Esqueceu a senha?" seguem o visual, mas avisam que estão indisponíveis (fora do escopo, sem simular sucesso).
- A Home ainda não existe: o fundo do modal é a página vazia com header até a Etapa 03.
- No mobile não há header global; cada tela terá a própria barra (Etapa 03 em diante).

## Etapa 03 — Início e catálogo

Concluído (aguardando validação e commit):
- Home conforme o Figma: hero com destaques, sidebar (Coleções, Faixa de preço, Rede, NFT em destaque), abas, ordenação, grade 3 colunas, paginação, promos, Diário da Cunhagem e rodapé.
- URL como estado (`validateSearch` com fallback + `stripSearchParams`), debounce na busca, `keepPreviousData`, `AbortSignal`, skeleton com shimmer, erro com "Tentar novamente" e vazio com "Limpar filtros".
- Mobile: busca + drawer de filtros, grade em 2 colunas e barra inferior.
- Mocks: `GET /articles`. Dado de artigo nunca fica em componente.
- Testes: `search.test.ts` (fallback da URL, parâmetros de API, janela de paginação, conversões de preço).

Pendente de refino: valores exatos do Figma (espaçamentos, tipografia) quando a cópia editável do arquivo estiver disponível.

## Etapa 04 — Detalhe do NFT e favoritos

Concluído (aguardando validação e commit):
- `/nft/$nftId` com skeleton, 404 amigável, erro com retry e acesso direto; galeria com miniaturas e zoom; edições (rádios nativos), quantidade com limite e mensagens acessíveis; COMPRAR e Favoritar; abas; Mais desta coleção; barra de compra fixa no mobile.
- Favoritos com atualização otimista, rollback e toast (`aria-live`), coerentes entre catálogo, detalhe e relacionados.
- Ações dos cards (favoritar, adicionar ao carrinho, ver) fora do link, em hover/foco no desktop e coração fixo no mobile.
- Visitante: a ação (favoritar/comprar) é guardada, o login volta para a página e a ação é executada uma vez.
- Testes: `editions` (regras de edição/limite e plurais), `pending-action`, e `favorites` (otimista + rollback com a mutation real).
- Bug encontrado e corrigido por teste: plural "disponíveis".

## Etapa 05 — Carrinho e cotação

Concluído (aguardando validação e commit):
- `/cart` conforme o Figma (desktop e mobile): linhas com quantidade limitada pela edição, remoção, resumo (subtotal, desconto, taxa, total) vindo só de `POST /quote`, cupom com erro no campo, estado vazio, erros de disponibilidade e "Colecionadores também viram".
- Quantidade otimista, em série por linha e sem piscar com toques rápidos; falha reverte com o motivo do servidor.
- Carrinho de visitante (localStorage) com os mesmos limites; mescla ao entrar sem duplicar e respeitando estoque; contador do header para os dois casos.
- Banner de avisos do carrinho alimentado por cache (a Etapa 06 chama `pushCartAlert`).
- Ajuste da Etapa 04: o painel da imagem do detalhe não estica mais (`self-start`).
- Testes: `cart.test.ts` (15 casos: regras do visitante, plano de mescla, assinatura da cotação, cupom por usuário, alertas, mutations otimistas e mescla ponta a ponta com servidor simulado).

## Etapa 06 — Tempo real (Socket.IO)

Concluído (aguardando validação e commit):
- Servidor simulado: `RealtimeHub` (sem MSW) + cola com `ws.link('*/realtime')` e `toSocketIo`; autenticação por evento, ping do protocolo v4 a cada 20 s (o binding não envia), escopo por usuário e versões.
- Cliente: `RealtimeManager` (conecta com sessão, autentica a cada conexão, desconecta no logout/expiração), `EventLedger`, aplicação nos caches (detalhe, listas, favoritos, carrinho, pedido) e reconciliação por REST depois de reconectar.
- Avisos acessíveis (`aria-live`), banner do carrinho e indicador de conexão no header.
- Controle de testes: `/__mocks__/emit` (com `duplicate` e `stale`), `/__mocks__/socket` e `/__mocks__/socket/drop`; `window.__mocks.emitNft`, `dropSocket`, `socketState`.
- Testes: ledger, hub, aplicação de eventos e gerenciador completo contra o hub real (31 casos).
- Verificação da camada de rede (WebSocket real + binding + socket.io-client) fica com o navegador e com os testes E2E da Etapa 09.

## Etapa 07 — Checkout e pedidos

Concluído (aguardando validação e commit):
- `/checkout`: formulário do colecionador, seleção/conexão de carteira e rede, revisão e confirmação. A confirmação revalida a cotação; mudanças mostram o diff e exigem nova confirmação; cotação desatualizada por evento bloqueia o botão.
- Idempotência: uma `Idempotency-Key` por tentativa, guardada com o corpo; reenvio após timeout/rede/5xx com a mesma chave devolve o mesmo pedido; clique repetido protegido.
- Pedido pendente, confirmado e recusado, com retomada após refresh e atualização por `order.updated` (e polling de segurança só enquanto pendente).
- `/order/$orderId`: recibo reproduz o snapshot e só aparece para pedido confirmado; pendente e recusado têm tela própria.
- Mocks: cenário `wallet-refused`, flag `connected` em `GET /wallets`, e pedido exige carteira conectada (reenvio idempotente não exige).
- Testes: `checkout.test.ts` (15: diff de cotação, persistência, envio com recuperação, formulários) e 3 casos novos nos mocks (conexão obrigatória, recusa, estado na lista).
- Verificação visual e o fluxo completo no navegador ficam com o desenvolvedor e com os testes E2E da Etapa 09.

## Etapa 12 — Cobertura E2E completa
Concluído (aguardando validação e commit): specs de catálogo, sessão/favoritos, carrinho/cupom, realtime no carrinho/checkout, teclado e overflow; traces `retain-on-failure`; justificativa da Performance mobile no relatório Lighthouse.
