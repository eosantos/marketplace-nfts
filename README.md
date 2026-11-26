# 💻 Sobre o projeto

## 🖼️ KURIO — Marketplace de NFTs 🖼️

Demonstração pública (já no ar, não precisa instalar nada): **https://marketplace-nfts-ten.vercel.app/**

## Descrição

Este é o projeto do teste técnico de frontend: um **marketplace de NFTs** completo, em que a pessoa pode explorar o catálogo, ver os detalhes de cada obra, favoritar, montar um carrinho, criar uma conta, conectar uma carteira digital e finalizar uma compra, tudo com atualizações em tempo real.

Não existe um servidor de verdade por trás. Toda a "API" (login, catálogo, carrinho, pagamento e eventos em tempo real) é **simulada dentro do próprio navegador** com [MSW](https://mswjs.io/). Por isso o projeto roda em qualquer computador sem banco de dados, sem backend e sem configuração extra: basta instalar e abrir.

### Funcionalidades implementadas

- **Catálogo (Início):** listagem de NFTs com abas (Todos, Novos lançamentos, Em alta), busca, filtros por coleção, faixa de preço e rede, ordenação e paginação. Tudo fica na URL, então dá para compartilhar o link de uma busca.
- **Detalhe do NFT:** galeria, edições (1/1, 1/10, 1/50, Aberta), quantidade com limite de estoque, avaliação, abas de informações e NFTs relacionados.
- **Favoritos:** o coração responde na hora (atualização otimista) e volta atrás sozinho se a API falhar.
- **Carrinho:** quantidades, cupom de desconto e resumo calculado pelo "servidor". Quem ainda não entrou na conta também tem carrinho, que é mesclado ao fazer login.
- **Conta:** cadastro, login, perfil, avatar, troca de senha e gerenciamento de carteiras.
- **Checkout:** revisão do pedido, conexão de carteira, confirmação e recibo. Se o valor mudar durante a compra, a pessoa precisa confirmar de novo.
- **Tempo real:** preços e disponibilidade atualizam sem recarregar a página (Socket.IO simulado).
- **Responsivo:** layout de desktop (1440px) e de celular (390px), seguindo o Figma.

## ✨ Destaques e melhorias

Além do que o desafio pedia, o projeto traz cuidados que fazem diferença no dia a dia de quem usa:

| Melhoria | O que é |
|---|---|
| **Página 404 própria** | Um macaco confuso, mensagem clara, o endereço que a pessoa tentou acessar e dois botões de saída ("Voltar ao início" e "Voltar"). O foco vai para o título e o título da aba muda, para quem usa leitor de tela. |
| **Skeletons (carregamento)** | Enquanto os dados chegam, aparecem "esqueletos" no formato exato do conteúdo: catálogo, detalhe, carrinho, checkout e até as imagens (`SkeletonImage`). Nada pula de lugar quando o conteúdo chega. |
| **Estados de erro e vazio** | Toda tela tem mensagem clara para erro, lista vazia e "tentar novamente", sem tela branca. |
| **Compra à prova de falhas** | Cada tentativa de pedido usa uma chave de idempotência: clicar duas vezes, perder a conexão ou recarregar a página **nunca duplica a compra**. |
| **Sessão expirada** | Se a sessão cair no meio da navegação, aparece um aviso e a pessoa retoma de onde parou depois de entrar de novo. |
| **Atualização em tempo real** | Preço e estoque mudam na tela na hora, com aviso acessível. Se a conexão cair, o app reconecta e confere os dados sozinho. |
| **Acessibilidade** | Navegação completa por teclado, foco visível, rótulos para leitores de tela, avisos falados e testes automáticos com axe-core. |
| **Desempenho** | Divisão do código por rota, imagens em WebP, carregamento prioritário da imagem principal e medição com Lighthouse (relatório em `docs/lighthouse/`). |
| **Navegação do cabeçalho** | "Mercado" destaca também no detalhe, carrinho e pagamento; "Criadores" e "Aprenda" levam às seções da Home. |
| **16 cenários de teste** | Dá para simular pagamento recusado, preço alterado, estoque esgotado, queda de internet e mais, com um comando (veja a seção de cenários). |
| **Carrossel automático** | O destaque da Home gira sozinho, pausa com o mouse ou foco e respeita a opção "reduzir movimento" do sistema. |

## 🧰 Boas práticas aplicadas

- **TypeScript estrito**, sem `any`, e todos os dados da API validados com **Zod** (os tipos nascem dos schemas).
- **Um único cliente HTTP** (Axios) com tratamento central de erros, token de sessão e idempotência.
- **Estado do servidor com TanStack Query** (cache, atualização otimista, rollback) e **rotas com TanStack Router**; filtros e paginação vivem na URL.
- **Organização por funcionalidade** (`features/`), com componentes pequenos e reutilizáveis (`shared/`).
- **Valores monetários com `decimal.js`**, nunca somando números de ponto flutuante, e totais sempre vindos da cotação do servidor.
- **Formulários com React Hook Form + Zod**, com mensagens de erro por campo, inclusive as que vêm da API.
- **Testes em camadas:** unitários (Vitest), ponta a ponta (Playwright, desktop e mobile), acessibilidade (axe-core) e regressão visual.
- **Qualidade automática:** ESLint com zero avisos, Prettier e verificação de tipos antes de cada entrega.
- **Commits padronizados** (Conventional Commits) e uma branch por melhoria.
- **Documentação:** `ARCHITECTURE.md` (decisões), `docs/API.md` (contratos), `docs/PROGRESS.md` (etapas) e `docs/lighthouse/` (desempenho).

### Ferramentas

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) (aplicação de página única, **não** usa Next.js)
- [TanStack Router](https://tanstack.com/router) e [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Axios](https://axios-http.com/ptbr/docs/intro)
- [MSW](https://mswjs.io/) + [Socket.IO](https://socket.io/) (API e tempo real simulados)
- [Zod](https://zod.dev/) e [React Hook Form](https://react-hook-form.com/)
- [Vitest](https://vitest.dev/) e [Playwright](https://playwright.dev/)
- [Git](https://git-scm.com/doc) e [Vercel](https://vercel.com/docs)

---

## 🚀 Passo a passo para rodar o projeto

> Este guia foi escrito para quem **nunca programou**. Siga na ordem, copiando e colando cada comando. Onde aparecer "terminal", veja o quadro abaixo.

**O que é o "terminal"?** É uma janela onde você digita comandos.
- **Windows:** aperte a tecla Windows, digite `PowerShell` e abra.
- **Mac:** aperte `Cmd + Espaço`, digite `Terminal` e abra.
- **Linux:** aperte `Ctrl + Alt + T`.

### Passo 1 — Instalar o Node.js

O Node.js é o programa que faz o projeto funcionar no seu computador.

1. Acesse https://nodejs.org e baixe a versão **LTS** (a recomendada). Precisa ser a **versão 22 ou mais nova**.
2. Abra o instalador e vá clicando em "Próximo" até terminar.
3. **Feche e abra o terminal de novo**, depois confira digitando:

```sh
node -v
```

Deve aparecer algo como `v22.x.x`. Se aparecer um número menor que 22, instale a versão mais nova.

### Passo 2 — Instalar o pnpm

O pnpm é o gerenciador que baixa as peças que o projeto usa. No terminal:

```sh
npm install -g pnpm
```

Confira com:

```sh
pnpm -v
```

Se aparecer um número (por exemplo `9.x` ou maior), está certo.

### Passo 3 — Baixar o projeto

**Opção A — com o Git** (se você já tem instalado):

HTTPS

```sh
git clone https://github.com/eosantos/marketplace-nfts.git
```

SSH

```sh
git clone git@github.com:eosantos/marketplace-nfts.git
```

**Opção B — sem o Git** (mais simples):

1. Abra https://github.com/eosantos/marketplace-nfts
2. Clique no botão verde **Code** e depois em **Download ZIP**.
3. Extraia (descompacte) o arquivo ZIP em uma pasta de fácil acesso, por exemplo a Área de Trabalho.

### Passo 4 — Entrar na pasta do projeto

No terminal, entre na pasta. Se você clonou ou extraiu na Área de Trabalho:

```sh
cd Desktop/marketplace-nfts
```

> Em computadores em português, a pasta pode se chamar `Área de Trabalho`. Se der erro, digite `cd ` (com espaço) e **arraste a pasta do projeto para dentro do terminal**, depois aperte Enter. Se a pasta extraída do ZIP se chamar `marketplace-nfts-main`, use esse nome.

### Passo 5 — Instalar as dependências

Com o terminal dentro da pasta do projeto, rode:

```sh
pnpm install
```

Aguarde alguns minutos até terminar (aparecem muitas linhas, é normal).

### Passo 6 — (Opcional) Chaves de ambiente

Não é preciso fazer nada: o projeto já funciona com os valores padrão. Se quiser personalizar, copie o arquivo de exemplo:

```sh
cp .env.example .env
```

> No Windows PowerShell, use `copy .env.example .env`.

| Variável             | Padrão    | Descrição                                                      |
|----------------------|-----------|----------------------------------------------------------------|
| `VITE_ENABLE_MOCKS`  | `true`    | Liga a API simulada (MSW), que intercepta REST e Socket.IO     |
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial (nomes na seção "Cenários de mock")            |
| `VITE_API_BASE_URL`  | `/api`    | Endereço da API real (ignorado com `VITE_ENABLE_MOCKS=true`)   |

### Passo 7 — Iniciar o projeto

```sh
pnpm dev
```

Quando aparecer uma mensagem parecida com `Local: http://localhost:5173/`, está pronto.

### Passo 8 — Abrir no navegador

Abra o Chrome (ou outro navegador) e acesse:

```
http://localhost:5173
```

Para **parar** o projeto, volte ao terminal e aperte `Ctrl + C`. Para abrir de novo outro dia, repita apenas os passos 4 e 7.

### Passo 9 — Entrar e testar

Use uma das contas de demonstração (ou crie a sua em "Entrar" → "Criar conta"):

| Usuário    | E-mail             | Senha       |
|------------|--------------------|-------------|
| Alice      | alice@nft.test     | Alice@123   |
| Bob        | bob@nft.test       | Bob@456     |

**Um roteiro rápido para conhecer tudo:**

1. Na Home, use a busca, os filtros e as abas.
2. Clique em um NFT, escolha a edição e a quantidade, e clique em **Comprar**.
3. No carrinho, mude quantidades e teste o cupom.
4. Clique em **Conectar e finalizar**, entre com a conta da Alice, escolha uma carteira, conecte e confirme a compra. Você verá o recibo.
5. Digite um endereço qualquer inexistente (por exemplo `/pagina-inexistente`) para ver a **página 404**.
6. Recarregue a página durante o carregamento para ver os **skeletons**.

### ❓ Se algo der errado

| Problema | O que fazer |
|---|---|
| `node não é reconhecido` / `command not found: node` | O Node não foi instalado ou o terminal estava aberto. Feche o terminal, abra de novo e rode `node -v`. |
| `pnpm não é reconhecido` | Rode `npm install -g pnpm` de novo e reabra o terminal. No Mac/Linux, se pedir permissão, use `sudo npm install -g pnpm`. |
| Erro dizendo que o Node é antigo | Instale a versão 22 ou mais nova em https://nodejs.org. |
| A página não abre em `localhost:5173` | Veja se o `pnpm dev` ainda está rodando no terminal. Se a porta estiver ocupada, o terminal mostrará outro endereço: use esse. |
| Imagens quebradas ou dados estranhos | Abra o console do navegador (tecla `F12`), rode `window.__mocks.reset('default')` e recarregue a página. |
| O `pnpm install` falhou por rede | Verifique a internet e rode o comando de novo. |

---

## 🧪 Comandos úteis (para quem desenvolve)

```sh
pnpm dev                # inicia o projeto em modo de desenvolvimento (mocks ativos)
pnpm build              # gera a versão de produção
pnpm preview            # pré-visualiza a versão de produção
pnpm typecheck          # verifica os tipos (tsc --noEmit)
pnpm lint               # ESLint (máx. 0 avisos)
pnpm format             # formata o código com o Prettier
pnpm test               # testes unitários (Vitest)
pnpm test:e2e           # testes ponta a ponta (Playwright; desktop 1440 e mobile 390)
pnpm test:e2e:update    # cria/atualiza as imagens de referência da regressão visual
pnpm test:e2e:visual    # compara com as imagens de referência
pnpm lighthouse         # Lighthouse (mediana de 3) -> docs/lighthouse/
```

Antes de rodar os testes ponta a ponta pela primeira vez, instale o navegador de teste:

```sh
pnpm exec playwright install chromium
```

## 🎭 Cenários de mock (nomes canônicos)

Selecione o cenário com `VITE_MOCK_SCENARIO` no `.env` ou pelo console do navegador.

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

O banco simulado usa a chave versionada `kurio:mocks:db:v2` no `localStorage`. O `VITE_MOCK_SCENARIO` só é reaplicado quando o valor muda; um cenário escolhido em tempo de execução sobrevive ao refresh.

### Selecionar e resetar cenários em tempo de execução

No console do navegador (tecla `F12`, aba Console), `window.__mocks` expõe:

```js
window.__mocks.reset('default')               // restaura o banco e o cenário
window.__mocks.setScenario('payment-refused') // troca o cenário mantendo os dados
window.__mocks.getState()                     // { scenario, users, sessions, nfts, orders }
window.__mocks.emitNft({ nftId: 'nft_002', price: '3.50' }) // altera o NFT e emite nft.updated (Socket.IO)
window.__mocks.dropSocket()                   // derruba as conexões (testa a reconexão)
window.__mocks.socketState()                  // { connected, authenticated }
```

Os mesmos controles existem em HTTP interceptado pelo MSW: `POST /__mocks__/reset`, `/__mocks__/scenario`, `/__mocks__/emit`, `/__mocks__/socket/drop` e `GET /__mocks__/state`, `/__mocks__/socket`.

### Reproduzir fluxos de falha

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

## ✅ Testes ponta a ponta (Playwright)

- `pnpm test:e2e` compila o app com `VITE_ENABLE_MOCKS=true`, sobe o `vite preview` (porta 4173) e roda os fluxos em dois projetos: `chromium-desktop` (1440x900) e `chromium-mobile` (390x844). `PW_DEV=1 pnpm test:e2e` usa o servidor de desenvolvimento.
- Cada teste restaura o banco simulado e o cenário por `window.__mocks.reset(...)`.
- Cobertura: acessibilidade com axe-core, compra completa, pagamento recusado, clique repetido, timeout após criar o pedido, preço alterado e esgotado no checkout, retomada de pedido pendente, eventos Socket.IO (atualização, duplicado/antigo, queda e reconexão), perfil, avatar, senha e carteiras.
- Specs: `purchase`, `realtime`, `realtime-cart`, `catalog`, `session`, `cart`, `keyboard`, `responsive` (sem rolagem lateral em 390/768/1440), `account`, `a11y`, `images`, `not-found`. Em falha, trace e vídeo ficam em `test-results/` (`npx playwright show-trace`).
- Regressão visual (início, detalhe, carrinho, pagamento): rode `pnpm test:e2e:update` uma vez para criar as imagens de referência em `tests/e2e/__screenshots__/` e depois `pnpm test:e2e:visual`. Elas dependem do sistema operacional; gere-as na máquina que as comparará.
- Relatório: `pnpm exec playwright show-report`.

## ⚡ Lighthouse

`pnpm build && pnpm lighthouse` serve o build com `vite preview`, audita início (`/`) e detalhe (`/nft/nft_002`) nos perfis mobile e desktop, executa 3 medições por combinação e grava em `docs/lighthouse/`: `REPORT.md` (medianas, LCP/CLS/TBT, versões e ambiente), `summary.json` e HTML/JSON da execução mais próxima da mediana. Para auditar o deploy: `pnpm lighthouse --url=https://<deploy>`. A configuração fica em `scripts/lighthouse.mjs`.

## 🗂️ Estrutura do projeto

```
marketplace-nfts/
├── src/
│   ├── app/           # ponto de entrada, estilos globais e providers
│   ├── routes/        # rotas baseadas em arquivos (TanStack Router)
│   ├── features/      # uma pasta por funcionalidade (catalog, nft, cart, checkout, auth...)
│   ├── shared/
│   │   ├── api/       # único cliente Axios
│   │   ├── contracts/ # schemas Zod + tipos
│   │   ├── ui/        # componentes de interface (shadcn/ui adaptados, Skeleton...)
│   │   ├── layout/    # cabeçalho, rodapé, barra mobile, página 404
│   │   └── lib/       # utilitários
│   └── mocks/         # MSW: banco simulado, handlers, cenários e Socket.IO
├── tests/e2e/         # testes Playwright
├── docs/              # API, progresso, enunciado e relatórios Lighthouse
├── design/            # referências do Figma e tokens de design
├── ARCHITECTURE.md    # decisões de arquitetura
├── README.md          # este arquivo
└── ...                # outros arquivos de configuração
```

## 🌐 Deploy (Vercel)

Acesse o site aqui: [KURIO — Marketplace de NFTs](https://marketplace-nfts-ten.vercel.app/)

O `vercel.json` já define o preset Vite, `pnpm build`, a pasta `dist`, o retorno ao `index.html` para as rotas (por isso `/cart` funciona ao atualizar a página), os cabeçalhos do `mockServiceWorker.js` e as variáveis `VITE_ENABLE_MOCKS=true` e `VITE_MOCK_SCENARIO=default`. Basta importar o repositório na Vercel; cada envio para a branch `main` publica uma nova versão.

## 📝 Commit

Para nossos commits utilizamos a seguinte estrutura:

```
feat: mensagem curta
^--^  ^------------^
|     |
|     +-> Resumo da alteração
|
+-------> Tipos: chore, docs, feat, fix, refactor, style, perf ou test.
```

#### Exemplos

- `feat`: (novo recurso para o usuário, não um novo recurso para script de compilação)
- `fix`: (correção de bug para o usuário, não uma correção para um script de construção)
- `docs`: (alterações na documentação)
- `style`: (formatação, ponto e vírgula faltando etc; sem alteração do código de produção)
- `refactor`: (refatorando o código de produção, por exemplo, renomeando uma variável)
- `perf`: (melhoria de desempenho)
- `test`: (adicionando testes ausentes, testes de refatoração; nenhuma alteração no código de produção)
- `chore`: (atualização de tarefas e etc; sem alteração do código de produção)
