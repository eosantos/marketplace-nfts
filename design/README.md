# design/ — Índice das telas do Figma

Fonte visual do projeto. Cada etapa deve abrir **as imagens listadas aqui** antes de implementar a tela e comparar o resultado com elas (desktop 1440, mobile 390).

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

## Regras para o que o Figma não mostra
- **Telas mobile ausentes** (Confirmação, Perfil, Carteiras): derive do desktop correspondente seguindo o padrão das telas mobile existentes (header, espaçamentos, botões, cards). Sem overflow horizontal em 390 e 768.
- **Estados não desenhados** (skeleton/shimmer, vazio, erro, hover, foco, desabilitado, diálogo de sessão expirada, pedido pendente/recusado): use o mesmo sistema visual (tokens, raios, sombras, tipografia).
- **Tablet (768):** não há frame; interpolar entre desktop e mobile.
- **Todo desvio** do Figma, estado inventado ou ajuste de acessibilidade deve ser registrado em `ARCHITECTURE.md`, seção de desvios.

## Tokens e assets
- `tokens.md`: cores (hex), tipografia (família, tamanhos, pesos, line-height), raios, sombras e espaçamentos, com os valores exatos do Figma. Em conflito entre o PNG e o `tokens.md`, vale o `tokens.md`.
- `assets/`: logo, ícones (preferir SVG) e imagens dos NFTs, exportados do Figma.
