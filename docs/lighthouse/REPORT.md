# Relatório Lighthouse

Mediana de 3 execuções por página e perfil. Alvo: http://localhost:4174. Gerado em 2026-11-25T20:42:56.415Z.

| Página | Perfil | Perf. | A11y | Boas práticas | SEO | FCP | LCP | TBT | CLS | Execuções (perf.) |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | 87 | 100 | 100 | 92 | 2428 ms | 3639 ms | 18 ms | 0.000 | 87 / 87 / 87 |
| `/nft/nft_002` | mobile | 87 | 100 | 100 | 92 | 2498 ms | 3554 ms | 5 ms | 0.000 | 87 / 87 / 88 |
| `/` | desktop | 99 | 96 | 100 | 92 | 560 ms | 740 ms | 0 ms | 0.000 | 99 / 99 / 100 |
| `/nft/nft_002` | desktop | 99 | 100 | 100 | 92 | 561 ms | 778 ms | 0 ms | 0.000 | 99 / 99 / 99 |

Relatórios completos (execução mais próxima da mediana):
- / (mobile): [HTML](./inicio-mobile.html) · [JSON](./inicio-mobile.json)
- /nft/nft_002 (mobile): [HTML](./nft-nft-002-mobile.html) · [JSON](./nft-nft-002-mobile.json)
- / (desktop): [HTML](./inicio-desktop.html) · [JSON](./inicio-desktop.json)
- /nft/nft_002 (desktop): [HTML](./nft-nft-002-desktop.html) · [JSON](./nft-nft-002-desktop.json)

## Ambiente e condições
- Lighthouse 12.8.2; Node v24.18.0; darwin arm64.
- Navegador: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/159.0.0.0 Safari/537.36.
- Build de produção (pnpm build) servido por vite preview, mocks ligados, cenário default, sem alterar imagens, fontes ou funcionalidades.
- Throttling padrão do Lighthouse (mobile: 4G simulado e CPU 4x; desktop: preset desktop).
