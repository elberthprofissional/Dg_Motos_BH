import { MapPin, ShieldCheck, Wrench } from 'lucide-react'
import { usePageMeta } from '../hooks/useNavigation'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { buildDefaultMessage } from '../lib/format'
import { Button } from '../components/ui/Button'

/** Foto real da loja (mesma do showroom, convertida para WebP). */
const LOJA_FOTO = '/hero/showroom.webp'

export function Sobre() {
  const { config } = useSiteConfig()

  usePageMeta(
    'Sobre a DG Motos | Belo Horizonte, MG',
    'A DG Motos é uma loja de motocicletas seminovas em Belo Horizonte. Estoque conferido, financiamento e avaliação de troca — negociação direta com quem vende.',
  )

  return (
    <div className="pt-16">
      {/* Intro editorial */}
      <section className="border-b border-white/10 bg-night-900">
        <div className="container-site grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Sobre a loja</p>
            <h1 className="h-display mt-3 text-4xl sm:text-5xl">
              Uma loja de bairro que conhece cada moto do pátio
            </h1>
            <p className="mt-5 leading-relaxed text-steel-300">
              A DG Motos nasceu em Belo Horizonte com uma ideia simples:
              vender motocicletas seminovas do jeito que a gente gostaria de
              comprar — com o estado real do veículo na mesa, preço justo e
              alguém do lado que entende do assunto.
            </p>
            <p className="mt-4 leading-relaxed text-steel-300">
              Somos uma equipe pequena, e por isso cada moto do anúncio é
              conferida por gente da loja antes de entrar no estoque.
            </p>
          </div>
          <img
            src={LOJA_FOTO}
            alt="Interior da loja DG Motos em Belo Horizonte"
            className="surface aspect-[3/2] w-full rounded-lg object-cover"
            loading="lazy"
          />
        </div>
      </section>

      {/* Compromissos */}
      <section className="section">
        <div className="container-site grid gap-12 lg:grid-cols-3">
          <div className="reveal">
            <ShieldCheck className="size-6 text-brand-500" aria-hidden="true" />
            <h2 className="h-display mt-4 text-xl">Procedência em primeiro lugar</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel-400">
              Toda motocicleta é conferida antes de entrar no estoque:
              documentação, histórico e estado mecânico. O que está no anúncio
              é o que você encontra na loja.
            </p>
          </div>
          <div className="reveal">
            <Wrench className="size-6 text-brand-500" aria-hidden="true" />
            <h2 className="h-display mt-4 text-xl">Revisão e documentação</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel-400">
              As motos são entregues revisadas e com a transferência
              acompanhada pela loja. Detalhes de cada veículo são informados no
              atendimento — pergunte sem cerimônia.
            </p>
          </div>
          <div className="reveal">
            <MapPin className="size-6 text-brand-500" aria-hidden="true" />
            <h2 className="h-display mt-4 text-xl">Raiz em Belo Horizonte</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel-400">
              Atendemos quem mora em BH e região metropolitana, na{' '}
              {config.enderecoRua}. Passe para ver as motos de perto — café por
              nossa conta.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-night-900">
        <div className="container-site flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="h-display text-3xl">Vem conhecer a loja</h2>
            <p className="mt-2 text-steel-400">
              {config.enderecoRua} — {config.enderecoCidadeUf}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <WhatsAppCTA message={buildDefaultMessage()} />
            <Button to="/estoque" variant="outline">
              Ver o estoque
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
