import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useSiteConfig } from '../../hooks/siteConfigContexto'
import { buildDefaultMessage } from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { InstagramIcon } from '../ui/InstagramIcon'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

const NAV = [
  { to: '/estoque', label: 'Estoque' },
  { to: '/contato', label: 'Contato' },
]

const ANO_ATUAL = new Date().getFullYear()

/** Link direto do WhatsApp de quem fez o site (ddi 55 + número). */
const WHATSAPP_CRIADOR = 'https://wa.me/553198015559'

/**
 * ============================================================
 * RODAPÉ — bancada e papel
 * ============================================================
 * Mesma regra da casa: o rodapé é a bancada escura (#0f0e0c) e
 * o conteúdo é a ficha sobre ela — sem cartão, sem moldura, sem
 * enfeite. A hierarquia sai da tipografia: títulos em caixa alta
 * miúda e espaçada (rótulo de arquivo), conteúdo em texto comum.
 * O vermelho não entra aqui: na casa ele é carimbo de preço e
 * ação principal, e rótulo miúdo era proibido pelo redesign.
 *
 * A grade reparte 4/3/5 dos eixos, na proporção do conteúdo —
 * a navegação é enxuta e a loja tem mais assunto. No tablet a
 * marca empilha e Navegue/loja dividem a linha; no celular,
 * uma coluna compacta na ordem da leitura.
 */
export function Footer() {
  const { config } = useSiteConfig()
  const wa = useWhatsappLink(buildDefaultMessage())

  /* Rótulo de seção: o mesmo eixo tipográfico nas duas colunas. */
  const titulo = 'mb-3 font-display text-xs font-semibold tracking-[0.16em] text-texto-3 uppercase'
  /* Link genérico: alvo de toque cheio no celular, enxuto no desktop. */
  const link =
    'inline-flex min-h-11 items-center text-sm text-texto-2 transition-colors hover:text-texto sm:min-h-9'

  return (
    <footer className="bg-painel-2 text-texto">
      {/* O pé mais fundo no desktop (a partir de md) estaciona o conteúdo
          fora da zona dos botões flutuantes — zap e seta vivam fixos no
          canto inferior direito e, sem isso, cobriam a assinatura. No
          celular eles nem existem, então nada de espaço morto. */}
      <div className="container-site py-8 sm:py-10 md:pb-32">
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_minmax(0,5fr)]">
          {/* Marca — ocupa sozinha quando a grade viram duas colunas */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              aria-label="DG Motos — Página inicial"
              className="inline-flex min-h-11 items-center gap-3"
            >
              <img
                src="/logo.webp"
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain"
              />
              <span className="font-display text-xl leading-none font-bold tracking-[0.03em]">
                DG Motos
              </span>
            </Link>
            <p className="mt-2.5 max-w-[28ch] text-sm leading-relaxed text-texto-2">
              Motocicletas seminovas em Belo Horizonte.
            </p>
          </div>

          {/* Navegação */}
          <nav aria-label="Páginas públicas" className="flex flex-col items-start">
            {/* mt-3 desce o rótulo até o eixo óptico do "DG Motos": o
                nome da loja pende do centro da logo (20px), o rótulo
                parte do topo (8px) — 12px fecham a conta. */}
            <h2 className={`${titulo} mt-3`}>Navegue</h2>
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className={link}>
                {item.label}
              </Link>
            ))}
            <a href="/#sonhos" className={link}>
              Sonhos realizados
            </a>
          </nav>

          {/* Visite e fale com a loja */}
          <div className="flex flex-col items-start">
            <h2 className={`${titulo} mt-3`}>Visite e fale com a loja</h2>
            <address className="space-y-0.5 text-sm leading-relaxed text-texto-2 not-italic">
              <p>{config.enderecoRua}</p>
              <p>{config.enderecoCidadeUf}</p>
            </address>
            {config.horarios.length > 0 ? (
              <div className="mt-2.5 space-y-0.5 text-sm leading-relaxed text-texto-2">
                {config.horarios.map((horario) => (
                  <p key={`${horario.dias}-${horario.horas}`}>
                    {horario.dias}: {horario.horas}
                  </p>
                ))}
              </div>
            ) : null}
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={`${link} mt-1 gap-2`}>
                <IconeWhatsapp className="size-4 shrink-0" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
            ) : null}
            {config.instagramUrl ? (
              /* Sem o @ na frente: o handle só interessa a quem já está
                  no perfil. Aqui o convite é a frase, e ela toda é o
                  link — o ícone acompanha o texto. */
              <a
                href={config.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link} gap-2`}
              >
                <InstagramIcon className="size-4 shrink-0" aria-hidden="true" />
                <span className="underline decoration-texto-3/40 underline-offset-4 transition-colors hover:decoration-texto">
                  Siga a gente no Instagram
                </span>
              </a>
            ) : null}
          </div>
        </div>

        {/* Barra final: mesma régua do container, uma linha no desktop
            e a ordem da leitura no celular — copyright, painel, campanha
            e a assinatura fechando o site. */}
        <div className="mt-9 border-t border-painel-3/60 pt-4">
          <div className="flex flex-col items-start gap-2.5 text-sm text-texto-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-8 sm:gap-y-2">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <p>© {ANO_ATUAL} DG Motos · Belo Horizonte, MG.</p>
              {/* Porta do painel, nomeada: o dono acha na hora e
                  ninguém fica confuso com um cadeado mudo. */}
              <Link
                to="/admin/login"
                className="inline-flex min-h-11 items-center gap-1.5 text-texto-3 transition-colors hover:text-texto sm:min-h-9"
              >
                <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Área administrativa</span>
              </Link>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
              {/* Campanha do Ibama, como no site da Honda: o selo acompanha
                  a frase. A frase vizinha já descreve o selo, por isso o
                  alt vazio — leitor de tela não lê tudo duas vezes. */}
              <div className="flex min-w-0 items-center gap-2.5">
                <img
                  src="/icons/ibama.webp"
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  className="size-7 shrink-0 object-contain"
                />
                <p className="whitespace-nowrap tracking-wide transition-colors hover:text-texto">
                  Desacelere. Seu bem maior é a vida.
                </p>
              </div>

              {/* Crédito do criador: a assinatura fecha o site inteiro. */}
              <a
                href={WHATSAPP_CRIADOR}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap transition-colors hover:text-texto sm:min-h-9"
              >
                <span className="text-sm">
                  Criado por{' '}
                  <span className="font-medium text-texto-2 underline decoration-texto-3/40 underline-offset-4 transition-colors hover:decoration-texto">
                    Elberth
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
