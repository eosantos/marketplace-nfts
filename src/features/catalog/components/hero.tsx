import { useState } from 'react'
import { cn } from '@/shared/lib/utils'

// Imagens da vitrine (assets do Figma). Os dados dos NFTs vêm sempre da API.
const SLIDES = [
  { src: '/assets/nfts/ape-green.png', alt: 'Macaco de óculos e jaqueta verde em destaque' },
  { src: '/assets/nfts/orangutan-gold.png', alt: 'Orangutango dourado com fones de ouvido em destaque' },
  { src: '/assets/nfts/gorilla-purple.png', alt: 'Gorila de chapéu e moletom roxo em destaque' },
] as const

export function Hero() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  return (
    <section
      aria-labelledby="hero-title"
      className="grid items-center gap-6 rounded-3xl bg-surface p-5 md:grid-cols-[1fr_450px] md:rounded-none md:bg-transparent md:p-0"
    >
      <div className="grid grid-cols-[1fr_130px] items-center gap-4 md:grid-cols-1 md:gap-0 md:pl-12">
        <div>
          <p className="text-xs md:text-sm">Bem-vindo à Kurio</p>
          <h1
            id="hero-title"
            className="mt-2 text-xl font-bold leading-tight md:mt-4 md:max-w-[500px] md:text-[40px] md:leading-[70px]"
          >
            <span className="hidden md:inline">SEJA DONO DO FUTURO DA ARTE DIGITAL</span>
            <span className="md:hidden">SEJA DONO DA CULTURA DIGITAL</span>
          </h1>
          <p className="mt-3 max-w-[460px] text-xs text-muted-foreground md:mt-4 md:text-sm md:leading-6">
            <span className="hidden md:inline">
              Descubra NFTs selecionados de criadores emergentes e consolidados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </span>
            <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
          </p>
          <a
            href="#catalogo"
            className="mt-4 inline-flex h-8 items-center rounded bg-accent px-4 text-xs font-bold uppercase text-on-accent transition-opacity hover:opacity-90 md:mt-8 md:h-10 md:px-7 md:text-sm"
          >
            Explorar
          </a>
        </div>

        <img
          src={slide.src}
          alt={slide.alt}
          width={450}
          height={450}
          fetchPriority="high"
          decoding="async"
          className="aspect-square w-full rounded-2xl object-cover md:hidden"
        />
      </div>

      <div className="relative hidden md:block">
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          width={450}
          height={450}
          fetchPriority="high"
          decoding="async"
          className="aspect-square w-full rounded-2xl object-cover"
        />
        <div role="group" aria-label="Destaques" className="absolute -left-24 bottom-6 flex gap-2">
          {SLIDES.map((item, position) => (
            <button
              key={item.src}
              type="button"
              aria-label={`Mostrar destaque ${position + 1}`}
              aria-current={position === index ? 'true' : undefined}
              onClick={() => {
                setIndex(position)
              }}
              className={cn(
                'h-2 w-2 rounded-full bg-accent transition-opacity',
                position === index ? 'opacity-100' : 'opacity-40 hover:opacity-70',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
