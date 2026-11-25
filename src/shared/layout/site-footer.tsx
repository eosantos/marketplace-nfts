import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  SocialFacebookIcon,
  SocialInstagramIcon,
  SocialLinkedinIcon,
  SocialTwitterIcon,
  SocialYoutubeIcon,
} from '@/shared/icons'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

const FEATURES = [
  { letter: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { letter: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { letter: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
] as const

const HELP_LINKS = ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'] as const
const PROFILE_LINKS = ['Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'] as const
const COLLECTION_LINKS = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] as const

const SOCIALS = [
  { label: 'Facebook', Icon: SocialFacebookIcon },
  { label: 'Instagram', Icon: SocialInstagramIcon },
  { label: 'Twitter', Icon: SocialTwitterIcon },
  { label: 'LinkedIn', Icon: SocialLinkedinIcon },
  { label: 'YouTube', Icon: SocialYoutubeIcon },
] as const

function ComingSoon({ children }: { children: string }) {
  return (
    <span aria-disabled="true" title="Em breve" className="block cursor-not-allowed text-xs text-foreground/80">
      {children}
    </span>
  )
}

/** Rodapé do desktop. Links fora do escopo aparecem como no Figma, sem navegar. */
export function SiteFooter() {
  return (
    <footer className="mx-auto mt-24 hidden max-w-[1200px] md:block">
      <div className="grid grid-cols-[1fr_1fr_1fr_1.2fr] bg-surface">
        {FEATURES.map((feature) => (
          <section key={feature.title} className="border-r border-accent/60 p-12 pb-8">
            <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-accent text-3xl font-bold text-on-accent" aria-hidden="true">
              {feature.letter}
            </div>
            <h2 className="mt-4 text-base font-bold">{feature.title}</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{feature.text}</p>
          </section>
        ))}
        <section className="p-8">
          <h2 className="text-base font-bold leading-tight">Antecipe-se ao próximo lançamento</h2>
          <form
            className="mt-3 flex"
            onSubmit={(event) => {
              event.preventDefault()
              toast.info('Inscrição indisponível nesta demonstração.')
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Seu e-mail
            </label>
            <Input id="newsletter-email" type="email" placeholder="digite seu e-mail..." className="h-10 rounded-none border-0 bg-surface-strong text-xs" />
            <Button type="submit" className="h-10 rounded-none px-4 text-sm font-bold">
              Enviar
            </Button>
          </form>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </section>
      </div>

      <div className="grid grid-cols-4 items-center bg-surface-strong px-8 py-8 text-xs">
        <p className="text-sm font-bold tracking-[0.2em]">KURIO</p>
        <p>Feito para colecionadores, criadores e cultura</p>
        <p>contato@email.com</p>
        <p>+55 11 4002 8922</p>
      </div>

      <div className="grid grid-cols-4 gap-6 bg-surface px-8 py-8">
        <nav aria-label="Meu perfil">
          <h2 className="mb-3 text-base font-bold">Meu perfil</h2>
          <ul className="grid gap-3">
            <li>
              <Link to="/profile" className="block text-xs text-foreground/80 transition-colors hover:text-accent">
                Meu perfil
              </Link>
            </li>
            {PROFILE_LINKS.map((label) => (
              <li key={label}>
                <ComingSoon>{label}</ComingSoon>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Central de ajuda">
          <h2 className="mb-3 text-base font-bold">Central de ajuda</h2>
          <ul className="grid gap-3">
            {HELP_LINKS.map((label) => (
              <li key={label}>
                <ComingSoon>{label}</ComingSoon>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Coleções">
          <h2 className="mb-3 text-base font-bold">Coleções</h2>
          <ul className="grid gap-3">
            {COLLECTION_LINKS.map((category) => (
              <li key={category}>
                <Link to="/" search={{ category }} className="block text-xs text-foreground/80 transition-colors hover:text-accent">
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 text-base font-bold">Redes sociais</h2>
          <ul className="flex gap-2 text-accent">
            {SOCIALS.map(({ label, Icon }) => (
              <li key={label}>
                <button type="button" aria-disabled="true" aria-label={`${label} (em breve)`} title="Em breve" className="block cursor-not-allowed">
                  <Icon />
                </button>
              </li>
            ))}
          </ul>
          <h2 className="mb-3 mt-8 text-base font-bold">Carteiras compatíveis</h2>
          <p className="inline-block border border-accent/60 px-2 py-1 text-[9px] font-bold text-accent">
            METAMASK · WALLETCONNECT · COINBASE
          </p>
        </div>
      </div>

      <p className="pb-6 pt-4 text-center text-xs">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}
