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
  com a chave versionada `kurio:mocks:db:v2`. `resetDb(scenario)` recria o seed de
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

Envelope (`SocketEvent`): `{ id, type, resource, resourceId, version, userId?, payload }`.

| Evento | Destinatários | `version` | `payload` |
|---|---|---|---|
| `nft.updated` | todas as conexões autenticadas | contador por NFT | `{ id, name, price, oldPrice?, editions[], updatedAt }` |
| `order.updated` | só o dono do pedido | 1 = `pending`, 2 = terminal | `{ orderId, status, txRef?, txExplorerUrl?, updatedAt }` |

Eventos de aplicação do cliente para o servidor: `authenticate { token }`. Respostas: `authenticated { userId }` e `auth_error { message }`.

## Política de sessão

- **Token:** opaco (`kurio_<hex>`), validade de 2 h, enviado como `Authorization: Bearer`. Fica em `localStorage` (`kurio:session`) para sobreviver ao refresh e sincronizar abas pelo evento `storage` (logout em uma aba derruba as outras). É uma escolha de demonstração com backend simulado; num backend real o ideal seria cookie `HttpOnly` + `SameSite`.
- **Restauração:** com token guardado, `GET /session` (TanStack Query, `retry: false`) devolve o usuário. Se falhar com 401, a limpeza é silenciosa (o usuário vira visitante).
- **Injeção sem acoplamento:** `src/shared/api/http.ts` não conhece a feature de auth; `setupAuth()` injeta `getToken` e o tratamento de 401 via `configureHttp`.
- **Sessão expirada:** um 401 (`SESSION_EXPIRED` ou `UNAUTHENTICATED` com token) em qualquer chamada que não seja `/auth/*` nem `/session` limpa o token e abre um diálogo **não dispensável** com duas saídas: "Entrar novamente" (vai a `/login?redirect=<rota atual>` e retoma depois do login) ou "Continuar como visitante" (limpa o estado e volta ao início). `/auth/*` fica de fora porque senha errada também é 401.
- **Redirect seguro:** `?redirect=` só aceita caminhos internos (`safeRedirect`): rejeita URL absoluta, `//host`, `javascript:`, barra invertida, caracteres de controle e as próprias telas de auth.
- **Rotas privadas:** `checkout`, `order/$orderId`, `profile` e `wallets` usam `beforeLoad: requireAuth` (sem token, redireciona para `/login?redirect=...`). `/login` e `/signup` usam `redirectIfAuthenticated`.
- **Isolamento entre usuários:** `completeAuth` limpa o cache quando o usuário muda; logout e "continuar como visitante" chamam `resetClientState` (token + `queryClient.clear()` + callbacks registrados com `onClientReset`, onde a Etapa 06 desconecta o Socket.IO). Chaves privadas sempre incluem o `userId` (`src/shared/api/query-keys.ts`).
- **Cadastro:** o Figma pede só usuário, e-mail e senha; nome de exibição e nome do perfil partem do nome de usuário e podem ser editados em "Perfil do colecionador" (Etapa 08).

## Estado do carrinho

Ver "Decisões desta etapa (Etapa 05 — carrinho)" no fim deste documento.

## Estratégia de cache (TanStack Query)

- **Chaves:** todas em `src/shared/api/query-keys.ts`. A lista do catálogo usa todos os parâmetros (`['nfts', 'list', params]`); dados privados incluem o `userId`.
- **Padrões:** `staleTime` de 60 s, uma nova tentativa só para falha de rede ou 5xx (4xx nunca se repete). Sessão: 5 min e sem retry. Facets e NFT em destaque: 5 min. Artigos: 10 min.
- **Troca de página/filtro:** `placeholderData: keepPreviousData` mantém a lista anterior (com `aria-busy` e opacidade reduzida) enquanto a nova carrega; sem salto de layout porque o skeleton tem as mesmas dimensões do card.
- **Cancelamento e ordem:** o `AbortSignal` do TanStack Query é repassado ao Axios; como a chave carrega todos os parâmetros, uma resposta atrasada de uma busca antiga nunca sobrescreve a mais recente (o cenário `out-of-order` dos mocks exercita isso).
- **Logout/troca de usuário:** `queryClient.clear()` + desconectar socket + limpar storages privados (ver "Política de sessão").
- **AbortSignal do TanStack Query repassado ao Axios** em todas as queries.

## Reconciliação REST ↔ Socket.IO

Ver "Decisões desta etapa (Etapa 06 — tempo real)" no fim deste documento: o REST é a fonte de verdade; o socket é um atalho que mantém os caches frescos. Eventos duplicados e antigos são descartados pelo `EventLedger`; depois de uma queda, o cliente reconcilia relendo pelo REST as consultas ativas.

## Dinheiro (ETH)

- Sempre `string` decimal no transporte e no estado
- `decimal.js` para todos os cálculos e formatação
- Nunca `number` para valores monetários
- Quantidades são inteiros (`number`)
- Totais exibidos vêm da API de cotação, não calculados no cliente

## Desvios do Figma

Os desvios, estados inventados e ajustes de acessibilidade estão nas subseções "Desvios do Figma" de cada etapa (03, 04, 05, 07 e 08), ao fim deste documento.

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

## Decisões desta etapa (Etapa 01 — parte 2b)

- **Cotação:** todos os valores passam por `decimal.js` e trafegam como string decimal. O resumo da UI usa os valores da API, nunca soma no cliente. Taxa de rede fixa (0.016 ETH) por cotação.
- **Cupom:** inválido/expirado responde 400 com `fieldErrors` no campo `coupon`; a UI mantém a cotação anterior. A validade usa só o `status` do cupom.
- **Idempotência:** chave por usuário; corpo comparado por JSON canônico; o reenvio devolve o pedido existente (200) e a divergência de corpo dá `IDEMPOTENCY_CONFLICT`. Falhas de criação não consomem a chave, então o cliente pode reenviar com a mesma chave depois de refazer a cotação.
- **Estados do pedido:** `pending → confirmed | refused`, liquidação em ~2,5 s por timer. Como timers se perdem em refresh, `GET /orders/:id` liquida pedidos vencidos de forma preguiçosa; a reconciliação REST × Socket.IO da Etapa 06 reutiliza esse caminho.
- **Efeitos da confirmação:** baixa de estoque e remoção do carrinho só das unidades compradas, ambos no servidor simulado (a UI apenas refaz a leitura).
- **Eventos do banco:** `src/mocks/events.ts` é a única ponte entre os serviços e o Socket.IO simulado; os serviços nunca importam o socket, e a UI nunca é chamada por ali.
- **Cenários únicos:** `price-changed-at-checkout` e `sold-out-at-checkout` acontecem na primeira tentativa de pedido e ficam registrados em `scenarioFlags` (limpos pelo reset), o que torna o fluxo repetível: tentativa 1 falha, a nova cotação reflete a mudança.
- **Timeout:** em `timeout-after-order-created` a resposta é substituída por erro de rede após 20 s; o cliente do checkout (Etapa 07) deve usar um timeout menor e reenviar com a mesma `Idempotency-Key`.

## Decisões desta etapa (Etapa 03 — catálogo)

- **URL como estado:** `q`, `category`, `network`, `minPrice`, `maxPrice`, `tab`, `orderBy` e `page` vivem na URL (`validateSearch` com zod). Valores inválidos caem no padrão via `.catch`, nunca quebram a página. Os padrões (`todos`, `recentes`, página 1) são removidos da URL por `stripSearchParams`, deixando links limpos e compartilháveis.
- **Histórico:** filtros, abas, ordenação e páginas usam `push` (voltar/avançar restaura o estado); a digitação na busca usa `replace` com debounce de 300 ms. Qualquer filtro volta para a página 1.
- **Contagens da sidebar:** vêm de `GET /nfts/facets` (catálogo inteiro, estáticas como no Figma). "Coleções" no Figma são as categorias do contrato.
- **Faixa de preço:** dois `<input type="range">` nativos sobrepostos (teclado e leitor de tela de graça) trabalhando em centésimos de ETH inteiros; o valor aplicado volta à URL como string decimal. Nenhum `number` de dinheiro sai do componente.
- **Imagens:** `width`/`height` e `aspect-ratio` fixos; as 3 primeiras do grid e a do hero carregam com prioridade, o resto com `loading="lazy"`.
- **Diário da Cunhagem:** os artigos vêm de `GET /articles` (fixtures nos mocks), sem dado fictício em componente.
- **Skeleton:** shimmer em CSS, desativado por `prefers-reduced-motion`.
- **Estilos base em `@layer base`:** garante que utilitários (bordas, rings) vençam as regras globais.

### Desvios do Figma (Etapa 03)
- **Busca no desktop:** o Figma só mostra o ícone de busca no header; ele abre um campo ligado ao parâmetro `q`.
- **Dots do hero:** viraram botões reais que trocam o destaque (3 imagens).
- **Ações no hover dos cards** (carrinho, favorito, ver): entram nas etapas 04 e 05, quando houver comportamento real para elas.
- **Ordenação no mobile:** o Figma mobile não mostra o seletor; ele fica dentro do drawer de filtros.
- **Drawer de filtros no mobile e barra inferior:** não há frame de filtros no Figma; o drawer reutiliza o painel do desktop. Favoritos e Scan na barra inferior aparecem desabilitados (fora do escopo).
- **Links fora do escopo** (Mercado, Criadores, Aprenda, "Ler mais", redes sociais, itens do rodapé): aparecem como no Figma, mas desabilitados com "Em breve". O formulário de newsletter avisa que está indisponível.

## Decisões desta etapa (Etapa 04 — detalhe e favoritos)

- **Atualização otimista dos favoritos:** `favoriteToggleOptions` (`src/features/favorites/mutation.ts`) cancela buscas em andamento, atualiza o cache na hora (`onMutate`), reverte para a lista anterior se o servidor falhar (`onError`, com toast em região `aria-live`) e reconcilia com o servidor em `onSettled`. A lógica fica fora do hook de React para ser testada com a mutation real e o Axios simulado (sucesso, falha e remoção).
- **Estado coerente entre telas:** o conjunto de favoritos vem de uma única query (`['favorites', userId]`); cards do catálogo, "Mais desta coleção" e o detalhe leem o mesmo cache, então favoritar em uma tela reflete nas outras.
- **Visitante e ação pendente:** favoritar ou comprar sem sessão salva a intenção em `sessionStorage` (`kurio:pending-action`, validada por zod, consumida uma única vez) e leva ao login com `?redirect=` da página atual. O `PendingActionRunner`, montado na raiz, executa a ação quando o usuário volta autenticado (para "Comprar", segue para o carrinho).
- **Edição e quantidade:** edição padrão 1/50 (como no Figma) se houver estoque, senão a primeira com estoque. O máximo por compra é `min(disponível, limite por comprador)`. Edições esgotadas ficam desabilitadas e anunciadas como "esgotada"; ao tentar passar do limite, uma mensagem `role="status"` explica o motivo. O servidor valida de novo e devolve `AVAILABILITY_CONFLICT`, mostrado em toast.
- **Edições como rádios nativos:** teclado (setas) e leitor de tela de graça, sem ARIA manual.
- **Adição rápida no card:** adiciona 1 unidade da edição aberta (ou da primeira com estoque). As ações do card ficam fora do `<a>` (sem controle interativo dentro de link); no desktop aparecem em hover/foco, no mobile só o coração.
- **Dinheiro:** preço sempre em string; o total da barra mobile usa `decimal.js`.
- **404 e erro:** NFT inexistente mostra um estado amigável com link para o catálogo; falha de rede/5xx mostra retry.

### Desvios do Figma (Etapa 04)
- **Aba "Avaliações de colecionadores":** existe só a nota média e a contagem; os comentários individuais estão fora do escopo (mensagem "em breve").
- **Textos de Rede/Contrato/Direitos autorais:** o Figma troca os rótulos; aqui cada rótulo mostra o dado correspondente (rede, endereço do contrato abreviado, royalties).
- **"Mais desta coleção":** carrossel com pontos que paginam a coleção (até 3 páginas) em vez de deslizar.
- **"COMPRAR":** adiciona ao carrinho e segue para `/cart` (o checkout depende da cotação do carrinho). O ícone de carrinho do mobile só adiciona.
- **Compartilhar:** LinkedIn, e-mail e Twitter abrem os links de compartilhamento reais.

## Decisões desta etapa (Etapa 05 — carrinho)

- **Estado do carrinho:** conta logada usa o carrinho da API (`['cart', userId]`); visitante usa um carrinho local (`kurio:guest-cart`, localStorage, sincronizado entre abas). Os dois passam pela mesma `CartLine` na UI. Visitante pode montar o carrinho, mas a cotação e o checkout exigem login, e o botão vira "Entrar e finalizar".
- **Mescla ao entrar:** `onAuthenticated(mergeGuestCart)` roda depois de cada login/cadastro. O plano (`planGuestMerge`, função pura) soma NFT + edição sem duplicar linhas e sem passar de `min(disponível, limite por comprador)`, descontando o que a conta já tem. Itens que não cabem são ajustados ou ignorados e o usuário é avisado por toast. Se a mescla falhar, o carrinho de visitante é mantido para a próxima tentativa.
- **Totais só do servidor:** subtotal, desconto, taxa de rede e total vêm de `POST /quote`; o cliente nunca soma valores. Enquanto o resumo recarrega, `keepPreviousData` mantém os valores anteriores esmaecidos, sem salto de layout; o primeiro carregamento usa skeleton com as mesmas dimensões.
- **Quantidade sem corrida:** a mutation de quantidade é otimista (a tela muda na hora), roda em série por linha (`scope`) e só reconcilia com o servidor quando é a última do carrinho em andamento (`isMutating`), então toques rápidos não fazem o valor piscar. Falha reverte e mostra o motivo do servidor (ex.: limite por comprador).
- **Cupom:** validado com uma cotação real antes de ser guardado; inválido/expirado mostra o erro no campo, e o cupom aceito fica por usuário em `sessionStorage` (`kurio:coupon:<userId>`), para o checkout pedir a mesma cotação. Cupom que passa a falhar depois (ex.: expirou) aparece no resumo com a ação "Remover cupom".
- **Disponibilidade:** `AVAILABILITY_CONFLICT` na cotação bloqueia o botão de finalizar e indica os itens; a linha acima do estoque mostra um alerta para ajustar a quantidade.
- **Ponto de integração do tempo real:** `pushCartAlert` (em `features/cart/alerts.ts`) grava avisos no cache; o banner no topo do carrinho só lê. A Etapa 06 chama `pushCartAlert` a partir dos eventos `nft.updated` e invalida `['quote', userId]`.
- **Compra de visitante:** deixou de forçar login (a ação pendente agora só cobre favoritar). Adicionar ao carrinho vai para o carrinho local; "Comprar" segue para `/cart`.

### Desvios do Figma (Etapa 05)
- **Coluna "Edições":** no Figma ela mostra a quantidade; a edição escolhida (1/10, 1/50...) aparece no subtítulo da linha, porque a mesma NFT pode estar em edições diferentes.
- **Estado do cupom aplicado e erros de cupom/estoque:** não existem no Figma; seguem o padrão visual (borda cobre, texto de erro em `danger`).
- **Mobile:** o resumo fica no fluxo, ao fim da lista (com cantos superiores arredondados), em vez de fixo na base.
- **"Colecionadores também viram":** visível só no desktop, como carrossel por pontos (mais bem avaliados fora do carrinho).

## Decisões desta etapa (Etapa 06 — tempo real)

- **Wire:** `socket.io-client` (só WebSocket, `path: '/realtime/'`, mesma origem) conversa com um servidor simulado no MSW via `ws.link` + `@mswjs/socket.io-binding` (`toSocketIo`). Os eventos passam pelo cliente real; nada chama setter ou cache diretamente.
- **Limitações do binding (lidas no código instalado, v0.2.0):** só simula o handshake Engine.IO/Socket.IO; não decodifica o `auth` do pacote CONNECT, não suporta namespaces, rooms nem ack e **não envia ping**. Por isso: (1) a autenticação é um evento da aplicação (`authenticate` com o token, respondido por `authenticated` ou `auth_error`); (2) o servidor simulado envia o ping `2` do protocolo v4 a cada 20 s, senão o cliente derrubaria a conexão por `pingTimeout` (30 s); (3) usamos um `path` próprio (`/realtime/`), porque o padrão `*/realtime` casa só ele e não intercepta o WebSocket do HMR do Vite (um `ws.link('*')` quebraria o dev server).
- **Uma fonte de verdade:** os serviços do banco simulado emitem no barramento `src/mocks/events.ts`; o `RealtimeHub` (`src/mocks/socket/hub.ts`, sem dependência do MSW) lê o MESMO banco do REST e monta o envelope `{ id, type, resource, resourceId, version, userId?, payload }`. A cola com o MSW (`handler.ts`) é fina.
- **Escopo por usuário:** só conexões autenticadas recebem eventos. `nft.updated` vai a todas; `order.updated` só ao dono (envelope com `userId`). O cliente ainda descarta evento cujo `userId` não seja o seu (defesa em profundidade).
- **Versões:** `nft` incrementa por recurso a cada emissão; `order` usa 1 para `pending` e 2 para estados terminais, então um evento atrasado nunca regride um pedido.
- **Dedupe no cliente (`EventLedger`):** ignora `id` já visto (com descarte dos mais antigos) e `version <= última aplicada` do recurso. Cobre duplicado e fora de ordem; a defesa de pedido terminal também existe no cache.
- **Aplicação nos caches:** `nft.updated` atualiza detalhe, todas as listas (catálogo, relacionados, sugestões, destaque) e favoritos, marca as listas como obsoletas para a próxima visita e, se o NFT está no carrinho, refaz a cotação e cria avisos (preço mudou, linha não atendível). `order.updated` atualiza o pedido em cache e, ao terminar, refaz carrinho e cotação e limpa avisos antigos.
- **Reconexão e reconciliação:** o `socket.io-client` reconecta sozinho (500 ms a 2 s, sem jitter). Eventos emitidos durante a queda se perdem; ao reautenticar depois de uma queda, o cliente invalida (só as consultas ativas) catálogo, carrinho, cotação, favoritos e pedidos para relê-los pelo REST. A primeira conexão não reconcilia.
- **Ciclo de vida:** conecta quando há token, autentica a cada conexão, desconecta no logout, na expiração e na troca de usuário (`onClientReset`) e esquece o ledger. `auth_error` desconecta sem insistir (o REST trata o 401).
- **Acessibilidade:** região `aria-live` global (`RealtimeAnnouncer`) anuncia mudanças relevantes (preço, esgotado, pedido confirmado/recusado) e o carrinho mostra os avisos em `role="status"`. Um ponto discreto no header indica conectado, conectando ou reconectando.
- **Controle de testes:** `POST /__mocks__/emit` e `window.__mocks.emitNft` alteram o NFT NO BANCO e emitem pelo servidor simulado (com `duplicate` e `stale` opcionais); `POST /__mocks__/socket/drop` e `window.__mocks.dropSocket` derrubam as conexões.

## Decisões desta etapa (Etapa 07 — checkout e pedidos)

- **Fluxo em duas etapas:** formulário ("Perfil do colecionador" + carteira e rede) e **revisão** somente leitura antes de confirmar. A confirmação nunca cria o pedido sozinha: primeiro revalida.
- **Revalidação antes de confirmar:** `Confirmar compra` pede uma cotação nova (`POST /quote`: preço, estoque, cupom e taxas) e compara com a que o usuário revisou (`diffQuotes`, função pura). Qualquer diferença mostra o que mudou e exige uma **nova confirmação** ("Aceitar novos valores e confirmar"). Erros de estoque ou cupom bloqueiam com a causa, e o cupom inválido tem a saída "Remover cupom e continuar". O servidor também revalida ao criar o pedido (`PRICE_CHANGED` / `AVAILABILITY_CONFLICT`), e o cliente trata isso do mesmo jeito (refaz a cotação e pede nova confirmação).
- **Cotação desatualizada por evento:** enquanto o usuário revisa, `nft.updated` invalida a cotação ao vivo; se ela difere da revisada, aparece o aviso com o diff e o botão de confirmar fica **desabilitado** até aceitar os novos valores. O botão também fica desabilitado enquanto a cotação recarrega.
- **Sem pedido duplicado:** (1) o clique é protegido por uma trava (`busy`) e pelo botão desabilitado; (2) cada tentativa de compra gera uma `Idempotency-Key` de 128 bits, guardada em `sessionStorage` junto com o **corpo exato** enviado; (3) em timeout, queda de rede ou 5xx o cliente reenvia a MESMA requisição com a MESMA chave (`submitOrder`, até 3 tentativas com espera de 0,8 s e 1,6 s) e o servidor devolve o pedido já criado (200 em vez de 201); (4) erros 4xx não são reenviados. O timeout do `POST /orders` (6 s) é menor que a simulação de timeout do servidor (20 s), o que exercita o cenário `timeout-after-order-created`.
- **Se nem o reenvio responder:** a tela "Não conseguimos confirmar o envio" explica que o pedido pode existir e oferece "Verificar e reenviar", que usa a mesma chave e o mesmo corpo guardados.
- **Retomada depois de refresh:** o rascunho do formulário e a tentativa ficam em `sessionStorage` por usuário. Se havia um pedido (`orderId`), a tela acompanha o estado dele pelo REST; se a resposta tinha se perdido, o reenvio idempotente roda sozinho ao montar ("Verificando seu pedido"), sem criar outra compra. A revisão não é restaurada: depois de um refresh o usuário revisa de novo, vendo os valores atuais.
- **Estados do pedido:** `pending` (progresso em região `aria-live`), `refused` (itens preservados, "Tentar novamente" gera uma nova tentativa com nova chave) e `confirmed`. A atualização vem do evento `order.updated` (mesmo cache) e há um polling de 4 s só enquanto pendente, como rede de segurança. Estados terminais não regridem.
- **Confirmação só para pedido confirmado:** `/order/$orderId` mostra o recibo apenas com `status = confirmed`; pendente e recusado têm a sua própria tela, mesmo por link direto. O recibo lê somente o `snapshot` gravado no pedido, então mudar o catálogo depois não altera os valores. Referência de transação e link de exploração são simulados (Etherscan/Polygonscan/Solscan conforme a rede).
- **Após confirmar:** o servidor remove do carrinho só os itens e quantidades comprados e baixa o estoque; o cliente relê carrinho e catálogo. Em recusa ou falha nada sai do carrinho.
- **Carteira:** usa as carteiras cadastradas, com seleção de rede e **conexão simulada pelo servidor**: `POST /wallets/:id/connect` pode ser **recusado** (cenário `wallet-refused`) e `disconnect` desconecta. A criação do pedido exige a carteira conectada (`FORBIDDEN` caso contrário). "Usar outra carteira?" cadastra uma carteira nova sem sair do checkout.
- **Sessão expirada no checkout:** o 401 abre o diálogo da Etapa 02; o login volta para `/checkout` e o rascunho (por usuário) é restaurado. O estado do checkout nunca é lido por outro usuário.

### Desvios do Figma (Etapa 07)
- **Campos de carteira do formulário:** o Figma repete no formulário o endereço, o tipo e o ENS da carteira. Aqui eles vêm da carteira cadastrada selecionada (lista com conexão) e só aparecem como campos ao marcar "Usar outra carteira?".
- **Código de indicação:** aparece com asterisco no Figma, mas é opcional no contrato (formato validado se preenchido).
- **Lista de provedores (MetaMask, WalletConnect, Coinbase) da coluna direita:** vira o tipo de cada carteira cadastrada.
- **Resumo:** mostra a edição de cada item no lugar do ID do token (a cotação não traz o token).
- **Cupom:** aplica-se no carrinho; o checkout mostra o cupom ativo e leva de volta ao carrinho para trocar.
- **Passo de revisão e as telas de mudança, recusa, pendente, recuperação e falha de envio:** não existem no Figma; seguem o mesmo sistema visual.

## Decisões desta etapa (Etapa 08 — perfil e carteiras)
- **Rotas privadas** `/profile` e `/wallets` compartilham `AccountLayout` (menu "Meu perfil" no desktop; abas + botão sair no mobile). Só "Dados do perfil" e "Carteiras" estão no escopo; Atividade, Lista de interesse, Ofertas, Arquivos baixados e Suporte ficam `aria-disabled` com o rótulo "Em breve", sem simular sucesso.
- **Perfil**: `PATCH /profile` (displayName, userName, profileName). Avatar por `POST /profile/avatar` (multipart, campo `avatar`); remoção por `PATCH {avatar:null}`. O cliente pré-valida tipo e 300 KB, mas a mensagem do campo `avatar` devolvida pela API prevalece.
- **Cache coerente**: a resposta da API é gravada em `qk.profile(userId)` **e** no usuário da query `session`, de onde o header lê nome e avatar; não há estado paralelo.
- **Senha**: confirmação validada no cliente; `currentPassword`/`newPassword` mostram o erro da API no campo. No sucesso a API revoga as demais sessões e a atual continua válida (aviso no toast).
- **Carteiras**: um único `WalletForm` cria/edita principal e secundárias. "Tornar principal" usa `PATCH isPrimary:true` (o servidor rebaixa a anterior) e a lista é recarregada. Rebaixar a única principal é recusado pela API (`isPrimary`). Endereço duplicado aparece no campo `address`. O schema do formulário (`wallets/schemas.ts`) é compartilhado com o checkout.
- Estados de carregamento (skeleton), erro com "Tentar novamente" e botão desabilitado durante o envio.

### Desvios do Figma (Etapa 08)
- Não há frames mobile: derivados do desktop (coluna única, menu em abas, botões em largura total, campos `h-10`).
- E-mail é somente leitura em `/profile`: a API não permite alterá-lo (`PATCH /profile` não aceita `email`).
- O Figma repete campos de outra tela (carteira em `/profile`; nome/perfil/e-mail/indicação em `/wallets`). Foram mantidos só os que a API suporta em cada tela.
- "Nome ENS" é um único campo (`nome.eth`) em vez de select `.eth` + input.
- "Carteira secundária" lista as existentes (com "Tornar principal"); o radio "Igual à carteira principal / Adicionar" só aparece enquanto não há secundária.
- Itens do menu fora do escopo ficam desabilitados com "Em breve".

## Decisões desta etapa (Etapa 09 — E2E)
- Testes rodam contra o **build** servido por `vite preview` com mocks ligados (mais próximo do deploy); `PW_DEV=1` usa o dev server.
- Isolamento: `resetApp` limpa localStorage/sessionStorage e chama `window.__mocks.reset(cenário)`; cenários são trocados por `window.__mocks.setScenario`. Os testes nunca escrevem no cache do TanStack Query nem no estado da UI; eventos de tempo real passam por `window.__mocks.emitNft`, que usa o servidor Socket.IO simulado.
- Asserções de "um único pedido" leem `getState().orders` do banco simulado, não a interface.
- Seletores por papel/rótulo acessível (`getByRole`, `getByLabel`); `data-testid` só em totais e no input de avatar.
- Regressão visual separada do conjunto padrão (`test:e2e` a ignora) porque as baselines dependem do sistema; `animations: 'disabled'`, `reducedMotion: 'reduce'` e tolerância de 2%.

## Decisões desta etapa (Etapa 10 — performance e deploy)
- **Code splitting:** `autoCodeSplitting` do TanStack Router separa o componente de cada rota em chunk próprio (o `beforeLoad` permanece no principal para o guard de login); `manualChunks` isola react, router, query, formulários/zod e UI em chunks de vendor, que ficam em cache entre deploys. MSW (`mocks/browser`) e `socket.io-client` seguem em `import()` dinâmico.
- **Custo conhecido dos mocks:** o app só renderiza depois de o MSW iniciar (o servidor simulado precisa existir antes da primeira chamada). Isso é parte da entrega e não foi removido para melhorar a nota; o impacto aparece em FCP/LCP no relatório.
- **Lighthouse:** `scripts/lighthouse.mjs` mede início e detalhe em mobile e desktop, mediana de 3, sem alterar imagens, fontes ou funcionalidades. Resultados e justificativas em `docs/lighthouse/REPORT.md`.
- **Preço no mobile:** a barra de compra passou a exibir duas casas (`3.50 ETH`), igual ao desktop.
- **Deploy:** SPA com fallback para `index.html`, exceto `/assets/*` e `/mockServiceWorker.js`; este recebe `Content-Type` JavaScript, `no-cache` e `Service-Worker-Allowed: /`. Os assets com hash são `immutable`.
- **Primeira medição e correções:** a mediana inicial deu Performance 85/86 no mobile (meta 90), A11y 94 no detalhe desktop (meta 95) e CLS 0.161 no detalhe desktop. Causas: PNGs de 108–351 KB (Lighthouse estimou 624 KiB de economia em formatos modernos); `aria-label` em `<p>`/`<span>` sem `role` (`aria-prohibited-attr`); pontos de paginação de 12 px (`target-size`); e rodapé que pulava porque o skeleton do detalhe era mais baixo que o conteúdo. Correções: ilustrações em WebP (qualidade 90, de 351 KB para 35 KB no maior), `role="img"` nas notas, texto `sr-only` nos itens "em breve", alvos de 24 px nos pontos e skeleton com a altura reservada. Os PNGs originais ficam só em `design/assets/` (referência); o app serve apenas os `.webp` de `public/assets/nfts/`.
- **Custo conhecido que permanece:** a renderização espera o MSW iniciar, o que pesa em FCP/LCP no perfil mobile com CPU 4x. Foi mantido para não simplificar a entrega.
- **Segunda medição:** A11y 100 (início desktop 96), CLS 0 e desktop 99; o mobile ficou em 85/86 (FCP 2,9 s, LCP 3,5–3,7 s). A cadeia de rede mostrou o chunk do MSW (116 KB) sendo pedido só depois de o `index.js` executar. Por isso `src/app/main.tsx` virou uma entrada mínima que baixa em paralelo `mocks/browser` e `app.tsx`, e só então inicia o MSW e renderiza. O MSW continua antes da primeira renderização por necessidade funcional (o primeiro request já precisa ser interceptado).
- **Identidade e imagens:** favicon SVG (monograma "K" no tom de destaque) com fallback PNG 32 px e `apple-touch-icon`, o que também elimina o 404 de `/favicon.ico` no console. `SkeletonImage` (`src/shared/ui`) aplica o shimmer no próprio `<img>` enquanto carrega, sem wrapper, sem esconder a imagem (o LCP não é atrasado) e sem alterar dimensões (sem CLS); volta sozinho quando o `src` muda e para em caso de erro. Respeita `prefers-reduced-motion`.

## Decisões desta etapa (Etapa 11 — acabamento)
- **404:** `NotFoundPage` (`src/shared/layout`) com o macaco `MonkeyConfused` (`src/shared/ui`), SVG original em formas chapadas e a paleta do site (nenhuma ilustração do Figma foi copiada). A ilustração é decorativa (`aria-hidden`); o sentido está em "404", no título "Ops, algo deu errado por aqui", no texto e no endereço acessado. A página muda o título da aba, move o foco para o `h1` ao abrir (anúncio em leitores de tela) e oferece "Voltar ao início" e "Voltar à página anterior". A gota de suor anima de leve e respeita `prefers-reduced-motion`.
- **Desvio do Figma:** não há frame de 404; o estado foi inventado seguindo tokens, tipografia e botões das demais telas.

## Etapa 12 — Cobertura E2E completa
Specs em `tests/e2e` cobrem os fluxos do desafio, em desktop (1440) e mobile (390):
- `catalog.spec.ts`: listagem, paginação com histórico, busca, estado vazio, filtros combinados e ordenação na URL, acesso direto ao detalhe e a NFT inexistente, skeleton com `slow-random-latency`, falhas (`network-failure`, `http-5xx`) com "Tentar novamente".
- `session.spec.ts`: cadastro (e `signup-conflict`), login inválido/válido com retomada da rota, persistência e logout, troca Alice → Bob sem vazamento, sessão expirada (diálogo, retomada e visitante), favoritos (persistência, rollback em falha, visitante).
- `cart.spec.ts`: quantidade, remoção, cupom válido/inválido/expirado, persistência após refresh e mescla do carrinho de visitante.
- `realtime-cart.spec.ts`: evento real do socket com o item no carrinho (aviso e resumo) e bloqueio da confirmação no checkout até aceitar os novos valores.
- `keyboard.spec.ts` e `responsive.spec.ts`: teclado, foco no diálogo, validação de formulários e ausência de overflow horizontal em 390/768/1440.
- Traces e vídeos são guardados em falhas (`retain-on-failure`). A justificativa da nota mobile de Performance está em `docs/lighthouse/REPORT.md`.
