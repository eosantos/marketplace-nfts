// Fixtures dos artigos da seção "Diário da Cunhagem" (conteúdo editorial estático).

import type { Article } from '@/shared/contracts'

export const articleFixtures: Article[] = [
  {
    id: 'article_001',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/assets/nfts/gorilla-black.png',
    publishedAt: '2026-09-12T12:00:00.000Z',
    readMinutes: 6,
  },
  {
    id: 'article_002',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    image: '/assets/nfts/ape-green.png',
    publishedAt: '2026-09-13T12:00:00.000Z',
    readMinutes: 2,
  },
  {
    id: 'article_003',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/assets/nfts/gorilla-purple.png',
    publishedAt: '2026-09-15T12:00:00.000Z',
    readMinutes: 3,
  },
  {
    id: 'article_004',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/assets/nfts/orangutan-gold.png',
    publishedAt: '2026-09-15T15:00:00.000Z',
    readMinutes: 2,
  },
]
