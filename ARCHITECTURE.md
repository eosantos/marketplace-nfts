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
