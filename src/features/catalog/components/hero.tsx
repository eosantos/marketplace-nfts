import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { SkeletonImage } from '@/shared/ui/skeleton-image'

// Imagens da vitrine (assets do Figma). Os dados dos NFTs vêm sempre da API.
const SLIDES = [
  { src: '/assets/nfts/ape-green.webp', alt: 'Macaco de óculos e jaqueta verde em destaque' },
  { src: '/assets/nfts/orangutan-gold.webp', alt: 'Orangutango dourado com fones de ouvido em destaque' },
  { src: '/assets/nfts/gorilla-purple.webp', alt: 'Gorila de chapéu e moletom roxo em destaque' },
] as const

const AUTOPLAY_MS = 5000

export function Hero() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = SLIDES[index]

  // Carrossel automático: pausa com mouse/foco sobre ele e não roda com "reduzir movimento".
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length)
    }, AUTOPLAY_MS)
    return () => {
      clearInterval(timer)
    }
  }, [paused, index])

  return (
    <section
      data-skel-group
      aria-labelledby="hero-title"
      className="relative grid items-center gap-6 overflow-hidden rounded-3xl bg-surface bg-gradient-to-r from-[#5b3a25] to-[#2c1b13] px-4 pb-9 pt-3 md:grid-cols-[1fr_450px] md:overflow-visible md:bg-none md:rounded-none md:bg-transparent md:p-0 md:pt-8"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-6 h-[260px] w-[260px] rounded-full bg-accent/10 md:hidden" />
      <div className="relative grid grid-cols-[1fr_138px] items-center gap-4 md:grid-cols-1 md:gap-0 md:pl-10">
        <div>
          <p className="skel-text text-xs md:text-sm lg:text-base">Bem-vindo à Kurio</p>
          <h1
            id="hero-title"
            className="skel-text mt-2 text-xl font-bold leading-tight md:mt-4 md:max-w-[500px] md:text-[40px] md:leading-[70px] lg:text-[43px]"
          >
            <span className="hidden md:inline">SEJA DONO DO FUTURO DA ARTE DIGITAL</span>
            <span className="md:hidden">SEJA DONO DA CULTURA DIGITAL</span>
          </h1>
          <p className="skel-text mt-3 max-w-[460px] text-xs lg:max-w-[560px] text-muted-foreground md:mt-4 md:text-sm md:leading-6">
            <span className="hidden md:inline">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </span>
            <span className="md:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
          </p>
          <a
            href="#catalogo"
            className="mt-2 inline-flex items-center gap-2 text-xs font-bold uppercase text-accent transition-opacity hover:opacity-90 md:mt-8 md:rounded md:bg-accent md:text-on-accent md:h-10 md:px-7 md:h-10 md:px-7 md:text-sm lg:px-8 lg:text-base"
          >
            Explorar
            <ArrowRight className="h-4 w-4 md:hidden" aria-hidden="true" />
          </a>
        </div>

        <div className="relative md:hidden">
          <SkeletonImage
            src={slide.src}
            alt={slide.alt}
            width={450}
            height={450}
            fetchPriority="high"
            decoding="async"
            className="aspect-square w-full rounded-2xl object-cover"
          />
          <img
            src={SLIDES[(index + 2) % SLIDES.length].src}
            alt=""
            aria-hidden="true"
            width={64}
            height={64}
            decoding="async"
            className="absolute -bottom-2 -left-4 h-16 w-16 rounded-2xl border-2 border-surface object-cover"
          />
        </div>
      </div>

      <div aria-hidden="true" className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 md:hidden">
        {SLIDES.map((item, position) => (
          <span key={item.src} className={cn('h-2 w-2 rounded-full bg-accent', position === index ? 'opacity-100' : 'opacity-60')} />
        ))}
      </div>

      <div
        className="relative hidden md:block"
        onMouseEnter={() => {
          setPaused(true)
        }}
        onMouseLeave={() => {
          setPaused(false)
        }}
        onFocus={() => {
          setPaused(true)
        }}
        onBlur={() => {
          setPaused(false)
        }}
      >
        <SkeletonImage
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          width={450}
          height={450}
          fetchPriority="high"
          decoding="async"
          className="aspect-square w-full rounded-2xl object-cover"
        />
        <div role="group" aria-label="Destaques" className="absolute -left-24 bottom-3 lg:-left-36 flex">
          {SLIDES.map((item, position) => (
            <button
              key={item.src}
              type="button"
              aria-label={`Mostrar destaque ${position + 1}`}
              aria-current={position === index ? 'true' : undefined}
              onClick={() => {
                setIndex(position)
              }}
              // Alvo de toque de 24 px; o ponto visível continua com 8 px.
              className="group flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-2 w-2 rounded-full bg-accent transition-opacity',
                  position === index ? 'opacity-100' : 'opacity-40 group-hover:opacity-70',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
