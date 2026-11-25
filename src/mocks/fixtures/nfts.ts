// Fixtures determinísticas de NFTs.
// Reutilizam as 4 ilustrações exportadas do Figma (copiadas para public/assets/nfts).

import { Decimal } from 'decimal.js'
import type { Nft, NftCategory, NftEdition, NftNetwork, NftRarity } from '@/shared/contracts'

export const NFT_IMAGE_PATHS = [
  '/assets/nfts/ape-green.png',
  '/assets/nfts/gorilla-purple.png',
  '/assets/nfts/gorilla-black.png',
  '/assets/nfts/orangutan-gold.png',
] as const

export type NftImagePath = (typeof NFT_IMAGE_PATHS)[number]

interface CollectionSeed {
  name: string
  image: NftImagePath
  network: NftNetwork
}

const COLLECTIONS: CollectionSeed[] = [
  { name: 'Kurio Apes', image: '/assets/nfts/ape-green.png', network: 'Ethereum' },
  { name: 'Sage Nomads', image: '/assets/nfts/gorilla-purple.png', network: 'Polygon' },
  { name: 'Neon Vessels', image: '/assets/nfts/gorilla-black.png', network: 'Solana' },
  { name: 'Cosmic Blooms', image: '/assets/nfts/gorilla-purple.png', network: 'Ethereum' },
  { name: 'Ivory Barons', image: '/assets/nfts/gorilla-black.png', network: 'Polygon' },
  { name: 'Golden Beats', image: '/assets/nfts/orangutan-gold.png', network: 'Solana' },
  { name: 'Golden Signals', image: '/assets/nfts/orangutan-gold.png', network: 'Ethereum' },
  { name: 'Emerald Editions', image: '/assets/nfts/ape-green.png', network: 'Polygon' },
]

const CATEGORIES: NftCategory[] = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
]

const RARITIES: NftRarity[] = ['COMUM', 'COMUM', 'COMUM', 'RARO', 'RARO', 'ÉPICO', 'LENDÁRIO']

const NAME_STEMS = [
  'Emerald Ape',
  'Sage Nomad',
  'Neon Vessel',
  'Cosmic Bloom',
  'Violet Nomad',
  'Ivory Baron',
  'Golden Beat',
  'Golden Signal',
  'Amber Primate',
  'Obsidian Muse',
  'Cobalt Oracle',
  'Solar Chimp',
  'Lunar Gorilla',
  'Copper Sage',
  'Terra Nomad',
  'Aurora Ape',
]

const PRICE_LADDER = [
  '0.02',
  '0.09',
  '0.19',
  '0.29',
  '0.39',
  '0.49',
  '0.69',
  '0.89',
  '0.99',
  '1.19',
  '1.29',
  '1.39',
  '1.69',
  '1.79',
  '1.99',
  '2.29',
  '2.49',
  '2.99',
  '3.49',
  '4.19',
  '5.29',
  '6.99',
  '8.49',
  '9.99',
  '12.30',
]

const RATING_SCORES = [4.2, 4.5, 4.7, 4.8, 4.9, 5]
const EYE_COLORS = ['Esmeralda', 'Castanho', 'Dourado', 'Prata']
const ACCESSORIES = ['Óculos', 'Fones', 'Chapéu', 'Corrente', 'Moletom', 'Blazer']

const SEED_YEAR = 2026
const SEED_MONTH = 6 // julho (0-indexed)

function isoDate(dayOffset: number, hour: number): string {
  return new Date(Date.UTC(SEED_YEAR, SEED_MONTH, 1 + dayOffset, hour, 0, 0)).toISOString()
}

function contractAddress(index: number): string {
  const hex = ((index + 1) * 0x9e3779b1).toString(16).padStart(8, '0')
  return `0x${hex.repeat(5).slice(0, 40)}`.toLowerCase()
}

function buildEditions(index: number): NftEdition[] {
  const oneOfOneAvailable = index % 11 === 0 ? 0 : 1
  const tenAvailable = index % 7 === 0 ? 0 : 1 + ((index * 3) % 10)
  const fiftyAvailable = index % 9 === 0 ? 0 : 4 + ((index * 5) % 47)
  const openAvailable = 100 + (index % 50)

  return [
    { type: '1/1', total: 1, available: oneOfOneAvailable, quantityLimit: 1 },
    { type: '1/10', total: 10, available: tenAvailable, quantityLimit: 2 },
    { type: '1/50', total: 50, available: fiftyAvailable, quantityLimit: 3 },
    { type: 'ABERTA', total: null, available: openAvailable, quantityLimit: 5 },
  ]
}

function makeNft(index: number): Nft {
  const collection = COLLECTIONS[index % COLLECTIONS.length]
  const category = CATEGORIES[index % CATEGORIES.length]
  const rarity = RARITIES[index % RARITIES.length]
  const tokenNumber = 7 + index * 13
  const tokenId = `#${String(tokenNumber).padStart(3, '0')}`
  const nameStem = NAME_STEMS[index % NAME_STEMS.length]
  const price = PRICE_LADDER[index % PRICE_LADDER.length]
  const oldPrice =
    index % 5 === 0 && price !== '12.30' ? new Decimal(price).plus('0.30').toFixed(2) : undefined
  const createdAt = isoDate(index % 30, 9 + (index % 12))
  const updatedAt = isoDate(index % 30, 10 + (index % 12))
  const gallery = [collection.image, ...NFT_IMAGE_PATHS.filter((path) => path !== collection.image)]

  return {
    id: `nft_${String(index + 1).padStart(3, '0')}`,
    name: `${nameStem} ${tokenId}`,
    tokenId,
    price,
    ...(oldPrice ? { oldPrice } : {}),
    collection: collection.name,
    category,
    network: collection.network,
    rarity,
    attributes: [
      { trait_type: 'Olhos', value: EYE_COLORS[index % EYE_COLORS.length] },
      { trait_type: 'Acessório', value: ACCESSORIES[index % ACCESSORIES.length] },
      { trait_type: 'Raridade', value: rarity },
    ],
    rating: {
      score: RATING_SCORES[index % RATING_SCORES.length],
      count: 12 + ((index * 7) % 180),
    },
    gallery,
    image: collection.image,
    description: `${nameStem} ${tokenId} é uma obra de ${category} da coleção ${collection.name}, verificada na rede ${collection.network}. A peça combina ilustração original, metadados no token e um registro de procedência pensado para colecionadores.`,
    royalties: 5 + (index % 5),
    contract: contractAddress(index),
    editions: buildEditions(index),
    featured: index % 13 === 0,
    createdAt,
    updatedAt,
  }
}

export const nftFixtures: Nft[] = Array.from({ length: 64 }, (_, index) => makeNft(index))
