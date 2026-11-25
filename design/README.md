# design/ — Índice das telas do Figma

Fonte visual do projeto. Cada etapa deve abrir **as imagens listadas aqui** antes de implementar a tela e comparar o resultado com elas (desktop 1440, mobile ~414 fluido). Leia também `design/tokens.md`.

## Mapa tela → rota → etapa

| Tela | Rota | Etapa | Desktop | Mobile |
|---|---|---|---|---|
| Início | `/` | 03 | `desktop-inicio.png` | `mobile-inicio.png` |
| Detalhes do NFT | `/nft/$nftId` | 04 | `desktop-detalhe-nft.png` | `mobile-detalhe-nft.png` |
| Carrinho de NFTs | `/cart` | 05 | `desktop-carrinho.png` | `mobile-carrinho.png` |
| Pagamento | `/checkout` | 07 | `desktop-pagamento.png` | `mobile-pagamento.png` |
| Confirmação de Pedido | `/order/$orderId` | 07 | `desktop-confirmacao-pedido.png` | **não existe** |
| Login | `/login` | 02 | `desktop-login.png` | `mobile-login.png` |
| Cadastro | `/signup` | 02 | `desktop-cadastro.png` | `mobile-cadastro.png` |
| Perfil do Colecionador | `/profile` | 08 | `desktop-perfil.png` | **não existe** |
| Carteiras | `/wallets` | 08 | `desktop-carteiras.png` | **não existe** |

## Comportamento por tela (achados do Figma)
- **Login e Cadastro no desktop são MODAIS** sobre a página Início, com abas "Entrar | Criar conta". No mobile são **telas cheias**. As rotas `/login` e `/signup` continuam existindo (necessárias para redirect e links diretos): no desktop renderizam o modal sobre o Início, no mobile a tela cheia. Fechar o modal volta para `/`.
- **Confirmação de Pedido no desktop é um modal/painel** ("Thank you", ID da transação, data, total, carteira, itens, botão "Ver no Etherscan"), sem tela mobile: derivar um painel em largura total.
- **Pagamento: desktop e mobile diferem.** Desktop = formulário "Perfil do colecionador" + resumo dos NFTs + seleção de carteira e rede + "Confirmar compra". Mobile = "Carteira conectada" (Reserva e Principal) + lista "Carteira e rede" (WalletConnect, MetaMask, Coinbase) + "Confirmar compra". Implementar um único fluxo de dados com layouts responsivos que cubram os dois.
- **Perfil e Carteiras compartilham a sidebar "Meu perfil"** (Dados do perfil, Carteiras, Atividade, Lista de interesse, Ofertas, Arquivos baixados, Suporte, Sair). Só Dados do perfil e Carteiras são do escopo; os demais itens aparecem desabilitados ou com estado "Em breve", sem fingir sucesso.
- **Itens de navegação fora do escopo** (Mercado, Criadores, Aprenda, Entrar com Google/Facebook, "Esqueceu a senha?", "Diário da Cunhagem", "Ler mais", "Ver no Etherscan" real): renderizar como no Figma, mas sem simular sucesso. Registrar cada decisão em `ARCHITECTURE.md`.
- **Estado logado não foi desenhado** (o header só mostra "Entrar"): derivar avatar/menu mantendo o padrão do header.
- **Valores do Figma são ilustrativos** e há inconsistências (ex.: totais do carrinho mobile ≠ desktop). Não copiar números: totais vêm da API de cotação calculada a partir das fixtures.
- **Navegação inferior mobile** na home (início, favoritos, scan, carrinho, perfil) e **barra fixa de compra** no detalhe mobile (quantidade, preço, "Comprar NFT" e ícone do carrinho).

## Regras para o que o Figma não mostra
- **Telas mobile ausentes** (Confirmação, Perfil, Carteiras): derive do desktop correspondente seguindo o padrão das telas mobile existentes. Sem overflow horizontal em 390 e 768.
- **Estados não desenhados** (skeleton/shimmer, vazio, erro, hover, foco, desabilitado, sessão expirada, pedido pendente/recusado, usuário logado): use o mesmo sistema visual.
- **Tablet (768):** interpolar entre desktop e mobile.
- **Todo desvio** do Figma, estado inventado ou ajuste de acessibilidade deve ser registrado em `ARCHITECTURE.md`, seção de desvios.

## Tokens e assets
- `tokens.md`: cores, tipografia, layout e snippet de tema. Valores estimados, a conferir no Figma.
- `assets/`: ilustrações dos NFTs, ícones de marcas e ilustração "Thank you", exportados do Figma.
