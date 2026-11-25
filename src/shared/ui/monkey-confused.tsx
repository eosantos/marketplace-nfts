import { cn } from '@/shared/lib/utils'

// Ilustração original (SVG) no estilo do site: formas chapadas, paleta quente e contorno escuro.
// Decorativa: o significado está no texto da página (aria-hidden).
const FUR = '#6b3f22'
const FUR_DARK = '#4a2a15'
const SKIN = '#e8c9a0'
const INK = '#1a100a'
const ACCENT = '#d28a4c'

export function MonkeyConfused({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      aria-hidden="true"
      focusable="false"
      className={cn('h-auto w-full', className)}
    >
      {/* ombros e gola */}
      <path d="M34 240c0-44 40-64 86-64s86 20 86 64z" fill={FUR_DARK} />
      <path d="M92 182c8 14 20 20 28 20s20-6 28-20c-8-4-18-6-28-6s-20 2-28 6z" fill={ACCENT} />

      {/* orelhas */}
      <circle cx="44" cy="114" r="23" fill={FUR} stroke={INK} strokeWidth="4" />
      <circle cx="44" cy="114" r="12" fill={SKIN} />
      <circle cx="196" cy="114" r="23" fill={FUR} stroke={INK} strokeWidth="4" />
      <circle cx="196" cy="114" r="12" fill={SKIN} />

      {/* cabeça */}
      <ellipse cx="120" cy="106" rx="76" ry="70" fill={FUR} stroke={INK} strokeWidth="4" />

      {/* máscara do rosto (formato de coração) */}
      <circle cx="98" cy="98" r="27" fill={SKIN} />
      <circle cx="142" cy="98" r="27" fill={SKIN} />
      <ellipse cx="120" cy="128" rx="46" ry="42" fill={SKIN} />

      {/* olhos arregalados, pupilas pequenas olhando para cima */}
      <circle cx="98" cy="104" r="14" fill="#fff7ea" stroke={INK} strokeWidth="3.5" />
      <circle cx="142" cy="104" r="14" fill="#fff7ea" stroke={INK} strokeWidth="3.5" />
      <circle cx="96" cy="100" r="4.5" fill={INK} />
      <circle cx="140" cy="100" r="4.5" fill={INK} />

      {/* sobrancelhas preocupadas (pontas internas elevadas) */}
      <path d="M82 84l24-10" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <path d="M158 84l-24-10" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />

      {/* focinho e boca ondulada */}
      <ellipse cx="120" cy="132" rx="9" ry="6" fill={FUR} opacity="0.35" />
      <circle cx="116" cy="131" r="1.8" fill={INK} />
      <circle cx="124" cy="131" r="1.8" fill={INK} />
      <path
        d="M98 150q5.5-7 11 0t11 0t11 0t11 0"
        fill="none"
        stroke={INK}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* gota de suor */}
      <path
        className="monkey-sweat"
        d="M192 56c-7 10-10 16-10 21a10 10 0 0 0 20 0c0-5-3-11-10-21z"
        fill="#9fd3e0"
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* faíscas de confusão */}
      <g stroke={ACCENT} strokeWidth="5" strokeLinecap="round">
        <path d="M120 22v-12" />
        <path d="M84 30l-7-9" />
        <path d="M156 30l7-9" />
      </g>
    </svg>
  )
}
