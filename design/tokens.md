# design/tokens.md — Tokens da marca KURIO

> ATENÇÃO: valores **estimados visualmente** a partir dos PNGs (não extraídos do Figma). Se o Figma divergir, o Figma vence: ajuste este arquivo e o `@theme`. Em conflito entre o PNG e este arquivo, vale este arquivo.

## Marca
- Nome: **KURIO** (não "Kurios"). Logo = texto monospace bold, caixa alta, com espaçamento entre letras. Não há arquivo de logo.
- Tom: marketplace de arte digital, tema escuro quente (marrom e cobre), tipografia monoespaçada.

## Cores (estimadas)
| Token | Valor | Uso |
|---|---|---|
| `bg` | `#140E0C` | fundo da página |
| `surface` | `#231815` | cards, sidebar, modais, inputs, painel do carrinho |
| `surface-strong` | `#3A2413` | faixa da marca no rodapé |
| `border` | `#4A2F1E` | bordas de input, linhas divisórias, sublinhado do header |
| `accent` | `#D08A4B` | botões primários, links ativos, ícones, badges |
| `accent-strong` | `#E08A3C` | preços em ETH, totais |
| `on-accent` | `#1A100A` | texto sobre botão primário |
| `text` | `#F3E9DA` | títulos e texto principal |
| `text-muted` | `#C9A67C` | descrições, labels, placeholders, texto secundário |
| `danger` | `#E0714A` | asterisco de campo obrigatório, erros |

Mobile: botões primários grandes têm **gradiente** cobre (`#D08A4B` → ~`#A8703F`).

## Tipografia
- Família: **monospace**, muito provavelmente **Roboto Mono** (zero cortado). Confirmar no Figma.
- Self-host (sem CDN): `pnpm add @fontsource-variable/roboto-mono` e importar no CSS. Fallback: `ui-monospace, SFMono-Regular, Menlo, monospace`.
- Escala (desktop, aprox.): hero 40px/70px bold, caixa alta · título de seção 16–18px bold · corpo e navegação 13–15px · legenda e rodapé 11–12px · preço 16px bold.
- Mobile: títulos de tela 20px bold; corpo 13–14px.

## Layout
- Container: **1200px** com margem lateral de 120px em 1440 (conteúdo de x=120 a x=1320).
- Header: ~68px de altura, linha inferior 1px, logo à esquerda, navegação centralizada (Início, Mercado, Criadores, Aprenda, item ativo em `accent` com sublinhado), à direita busca, carrinho com contador e botão "Entrar".
- Início: sidebar ~310px (coleções, faixa de preço, rede) + grade de **3 colunas** de ~258px com ~33px de gap.
- Cards de NFT: fundo `surface`, imagem arredondada (~16px) dentro do card, nome 14px e preço em `accent-strong`. Selo "RARO" (bloco `accent`) no canto; preço antigo riscado quando há desconto; ações no hover (carrinho, favorito, lupa).
- Escala de espaçamento: 4, 8, 12, 16, 24, 32, 48, 64.
- Raios: desktop botões/inputs ~4px, cards/painéis ~0–4px; mobile botões/inputs ~12px, cards ~16px.
- Sem sombras relevantes. Foco/ativo: borda do input em `accent`.
- Modais (login/cadastro e confirmação): fundo `surface`, largura ~500–580px, **barra de 8–10px em `accent` na base**, botão fechar (X) no canto superior direito.
- Mobile: telas de ~414px de largura (implementar fluido de 360 a 430). Barra inferior de navegação na home (início, favoritos, botão central de scan, carrinho, perfil).

## Snippet Tailwind v4 (`src/app/globals.css`)
```css
@theme {
  --color-bg: #140e0c;
  --color-surface: #231815;
  --color-surface-strong: #3a2413;
  --color-border: #4a2f1e;
  --color-accent: #d08a4b;
  --color-accent-strong: #e08a3c;
  --color-on-accent: #1a100a;
  --color-text: #f3e9da;
  --color-text-muted: #c9a67c;
  --color-danger: #e0714a;
  --font-sans: "Roboto Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;
}
```
Mapear também para as variáveis do shadcn (`--background`, `--card`, `--primary`, `--primary-foreground`, `--border`, `--input`, `--ring`, `--destructive`, `--muted-foreground`).

## Assets a exportar do Figma (design/assets/)
- **Imagens dos NFTs:** só existem ~4 ilustrações distintas (macaco de óculos e jaqueta verde; gorila de chapéu e moletom roxo; gorila preto de blazer; orangutango de fones). Exportar cada uma em alta resolução. As fixtures reutilizam essas imagens com nomes, preços e edições diferentes.
- **Ícones de marcas** (Google, Facebook, Instagram, X/Twitter, LinkedIn, YouTube): SVG. O `lucide-react` atual não traz ícones de marcas.
- **Ilustração "Thank you"** (envelope) da confirmação: SVG.
- Ícones de interface (busca, carrinho, coração, lixeira, usuário, pin, etc.): usar `lucide-react`.
