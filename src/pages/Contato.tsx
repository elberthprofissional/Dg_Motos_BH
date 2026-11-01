import { ArrowUpRight, Clock, MapPin } from 'lucide-react'
import { InstagramIcon } from '../components/ui/InstagramIcon'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../lib/format'
import { buildMapsRouteUrl } from '../lib/maps'
import { MapaLoja } from '../components/ui/MapaLoja'
import { WhatsAppCTA } from '../components/motorcycles/WhatsAppCTA'
import { Revelar } from '../components/ui/Revelar'
import { IconeWhatsapp } from '../components/ui/IconeWhatsapp'

/**
 * Contato — a folha de contatos da loja.
 *
 * Composição: um banner curto com a moto na meia-luz abre a página
 * e leva o convite ("Vamos conversar?"); abaixo, a leitura é o
 * dicionário dos canais — WhatsApp, Instagram, onde estamos e
 * horário, um item por linha, separados por régua fina de rótulo,
 * sem cartão embrulhando cada assunto. O mapa fecha à direita,
 * com o botão de rota.
 *
 * O rótulo faz o título: caixa alta miúda e espaçada, como o
 * sumário de uma ficha. O vermelho não entra na página — aqui o
 * carimbo de preço não tem o que carimbar; hierarquia sair do
 * peso do texto e do degrau de cinza.
 */

/* Rótulo de canal: o mesmo eixo tipográfico em todos os itens. */
const ROTULO =
  'flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-texto-3'

export function Contato() {
  usePageMeta(
    'Contato | DG Motos — Belo Horizonte, MG',
    'Fale com a DG Motos: WhatsApp, Instagram e localização da loja em Belo Horizonte, MG.',
  )

  const { config } = useSiteConfig()

  return (
    <div className="pt-cabecalho">
      {/* Banner: a moto na meia-luz sangra de ponta a ponta. Duas
          máscaras discretas abrem o céu da foto para o título e
          ancoram a base no fundo da página — sem moldura e sem
          landing page. A altura vem do respiro do texto, não de
          número mágico: curto de propósito. */}
      <section className="relative overflow-hidden bg-fundo">
        <img
          src="/hero/contato-showroom.webp"
          alt="Moto esportiva na garagem a meia-luz"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        />
        {/* As máscaras vão ao termo transparente: escurecem o texto e
            a base sem apagar a foto do meio pra lá. */}
        <div className="absolute inset-0 bg-gradient-to-t from-fundo via-fundo/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-fundo/85 via-fundo/25 to-transparent" />

        <div className="container-site relative py-14 sm:py-20">
          <Revelar>
            <h1 className="display text-3xl text-texto sm:text-5xl">DG Motos BH
            </h1>
              <p className="lead mt-3 max-w-xl text-texto-2 sm:mt-4">
              Sua próxima conquista sobre duas rodas começa aqui.
            </p>
          </Revelar>
        </div>
      </section>

      {/* Contato e localização: ao lado do título, cada canal é uma
          entrada da ficha — rótulo miúdo, texto no eixo, régua fina
          entre entradas. O mapa completa à direita. */}
      <section className="bg-painel">
        <div className="container-site grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          {/* Canais — a coluna esquerda inteira */}
          <div>
            {/* WhatsApp */}
            <Revelar>
              <p className={ROTULO}>
                <IconeWhatsapp className="size-3.5" aria-hidden="true" />
                WhatsApp
              </p>
              <p className="corpo mt-3 max-w-md text-texto">
                Gostou de alguma moto? Chama a gente.
              </p>
              {config.whatsapp ? (
                <WhatsAppCTA
                  message={buildDefaultMessage()}
                  label="Conversar no WhatsApp"
                  glifoWhatsapp
                  className="mt-5 h-12 w-full px-7 sm:w-auto"
                />
              ) : (
                <p className="mt-4 text-sm text-texto-3">
                  Número sendo configurado pela loja.
                </p>
              )}
            </Revelar>

            {/* Instagram */}
            {config.instagramUrl ? (
              <Revelar atraso={80}>
                <div className="mt-9 border-t border-painel-3/60 pt-8">
                  {/* ...a régua fina é a divisória: mesma largura do
                      texto, sem caixote e sem fileiro decorativo. */}
                  <p className={ROTULO}>
                    <InstagramIcon className="size-3.5" aria-hidden="true" />
                    Instagram
                  </p>
                  <p className="corpo mt-3 max-w-md text-texto">
                    Veja as novidades e acompanhe tudo em primeira mão.
                  </p>
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-acao mt-4"
                  >
                    <InstagramIcon className="size-4" aria-hidden="true" />
                    <span>{config.instagramHandle}</span>
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </Revelar>
            ) : null}

            {/* Onde estamos */}
            <Revelar atraso={140}>
              <div className="mt-9 border-t border-painel-3/60 pt-8">
                <p className={ROTULO}>
                  <MapPin className="size-3.5" aria-hidden="true" />
                  Onde estamos
                </p>
                <address className="mt-3 not-italic">
                  <p className="font-display text-xl font-semibold text-texto sm:text-2xl">
                    {config.enderecoRua}
                  </p>
                  <p className="corpo mt-1 text-texto-2">
                    {config.enderecoCidadeUf}
                  </p>
                </address>
              </div>
            </Revelar>

            {/* Horários */}
            {config.horarios.length > 0 ? (
              <Revelar atraso={200}>
                <div className="mt-9 border-t border-painel-3/60 pt-8">
                  <p className={ROTULO}>
                    <Clock className="size-3.5" aria-hidden="true" />
                    Horários
                  </p>
                  <dl className="mt-3 space-y-2">
                    {config.horarios.map((h) => (
                      <div key={h.dias} className="flex justify-between gap-4">
                        <dt className="text-sm text-texto-2">{h.dias}</dt>
                        <dd className="numeros text-sm font-medium text-texto sm:text-base">
                          {h.horas}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Revelar>
            ) : null}
          </div>

          {/* Mapa — moldura de ficha: borda fina, canto reto, sem
              sombra. No celular desce para baixo dos canais, do jeito
              que a leitura pede. */}
          <div className="flex min-w-0 flex-col">
            <Revelar atraso={120}>
              <div className="border border-painel-3/60 bg-painel-2">
                <MapaLoja
                  rotulo={`${config.enderecoRua}, ${config.enderecoCidadeUf}`}
                  className="h-80 w-full sm:h-[30rem] lg:h-full lg:min-h-[32rem]"
                />
              </div>
            </Revelar>

            <Revelar atraso={200}>
              <a
                href={buildMapsRouteUrl(config)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary mt-4 h-11 w-full justify-center sm:w-auto sm:self-start"
              >
                <MapPin className="size-4" aria-hidden="true" />
                <span>Como chegar à DG Motos</span>
              </a>
            </Revelar>
          </div>
        </div>
      </section>
    </div>
  )
}
