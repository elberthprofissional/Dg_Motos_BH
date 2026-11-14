import { Link } from 'react-router-dom'
import type { Motorcycle, MotorcycleStatus } from '../../types'
import {
  bikeModelName,
  bikeTitle,
  buildBikeMessage,
  descontoPercentual,
  formatKm,
  formatPrice,
  precoRequerConfirmacao,
} from '../../lib/format'
import { useWhatsappLink } from '../../hooks/useWhatsappLink'
import { IconeWhatsapp } from '../ui/IconeWhatsapp'

interface BikeCardProps {
  bike: Motorcycle
  priority?: boolean
  /** `linha` é a listagem curta do pátio; `grade` é a vitrine do estoque;
   * `vitrine` é o anúncio editorial do catálogo da home; `indice` é a
   * fileira do índice editorial do estoque no desktop. */
  variante?: 'grade' | 'linha' | 'vitrine' | 'indice'
}

const ESTADO: Partial<Record<MotorcycleStatus, string>> = {
  indisponivel: 'Indisponível',
  vendida: 'Vendida',
}

/**
 * Selos colados na foto. Vêm dos campos reais da moto
 * (`especificacoes`): só o que o dono cadastrou vira etiqueta. Sem
 * selo cadastrado, a foto fica limpa — nada de etiqueta genérica
 * repetida em todo o pátio.
 */
const GATILHOS_SELOS: [RegExp, string][] = [
  [/único\s*dono/i, 'Único dono'],
  [/ipva/i, 'IPVA pago'],
  [/garantia/i, 'Com garantia'],
  [/revis/i, 'Revisada'],
  [/cautelar/i, 'Cautelar aprovada'],
]

function selosDaMoto(moto: Motorcycle): string[] {
  const achados: string[] = []
  for (const [gatilho, rotulo] of GATILHOS_SELOS) {
    if (moto.especificacoes.some((spec) => gatilho.test(`${spec.label} ${spec.value}`))) {
      achados.push(rotulo)
    }
  }
  return achados.slice(0, 2)
}

/** Etiquetas coladas no canto da foto: vermelho da marca, levemente
 * inclinadas, empilhadas. Em `grade` ficam à direita, porque o selo
 * de promoção mora à esquerda. */
function Selos({ lista, direita = false }: { lista: string[]; direita?: boolean }) {
  if (lista.length === 0) return null
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute top-2 z-[5] flex flex-col items-${
        direita ? 'end' : 'start'
      } gap-1 ${direita ? 'right-2' : 'left-2'}`}
    >
      {lista.map((selo) => (
        <span key={selo} className="selo-oferta">
          {selo}
        </span>
      ))}
    </span>
  )
}

const CLASSE_CONVERSA_MOLDURA =
  'relative z-20 grid size-8 shrink-0 place-items-center border border-borda text-texto-2 transition-colors hover:border-marca hover:bg-marca hover:text-white sm:size-9'
const CLASSE_CONVERSA_NUA =
  'relative z-20 grid size-8 shrink-0 place-items-center text-texto-3 transition-colors hover:text-marca'

/**
 * Vitrine de uma moto.
 *
 * A foto manda; o preço ocupa a mesma posição em todas as peças, para
 * a leitura descer a coluna sem tropeçar. Sem sombra, sem raio e sem
 * botão extra: o cartão inteiro abre a ficha e o WhatsApp é o único
 * atalho paralelo.
 *
 * Na variante `vitrine` (catálogo da home) não existe caixa: a foto é
 * o anúncio, o nome comanda, o preço vermelho fecha a informação e a
 * marca/ano ficam como linha miúda de rodapé. O desconto entra como
 * texto discreto junto ao preço anterior — nunca como selo de canto.
 */
export function BikeCard({ bike, priority = false, variante = 'grade' }: BikeCardProps) {
  const titulo = bikeTitle(bike)
  const modelo = bikeModelName(bike) || titulo
  const lateral = bike.imagens.find((imagem) => /vista lateral/i.test(imagem.alt))
  const capa = lateral ?? bike.imagens[0]
  const estado = ESTADO[bike.status]
  const waLink = useWhatsappLink(buildBikeMessage(bike.marca, bike.modelo, bike.ano))
  const desconto = descontoPercentual(bike)
  const disponivel = bike.status === 'disponivel'

  /** Atalho de conversa: `moldura` é o quadrado de contorno usado na
   * listagem e no estoque; `nu` é o glifo discreto do catálogo
   * editorial, alinhado à linha do preço. A função é a mesma. */
  const conversa = (nu = false) =>
    disponivel ? (
      waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Falar no WhatsApp sobre a ${titulo} ${bike.ano}`}
          className={nu ? CLASSE_CONVERSA_NUA : CLASSE_CONVERSA_MOLDURA}
        >
          <IconeWhatsapp className={nu ? 'size-[18px]' : 'size-4'} />
        </a>
      ) : (
        <Link
          to="/contato"
          aria-label={`Falar com a loja sobre a ${titulo} ${bike.ano}`}
          className={nu ? CLASSE_CONVERSA_NUA : CLASSE_CONVERSA_MOLDURA}
        >
          <IconeWhatsapp className={nu ? 'size-[18px]' : 'size-4'} />
        </Link>
      )
    ) : null

  const foto = capa ? (
    <img
      src={capa.src}
      alt={capa.alt || titulo}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      width={1280}
      height={800}
      className="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
    />
  ) : (
    <p className="grid size-full place-items-center px-3 text-center text-xs text-texto-3">
      Foto em breve
    </p>
  )

  if (variante === 'linha') {
    return (
      <article className="group relative flex gap-4 py-4">
        <Link
          to={`/moto/${bike.slug}`}
          aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
          className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-marca"
        />

        <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden bg-noite-2 sm:w-32">
          {foto}
          {desconto != null ? (
            <span className="numeros absolute top-0 left-0 bg-marca px-1.5 py-1 text-[11px] leading-none font-semibold text-white">
              −{desconto}%
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-texto-3 uppercase">{bike.marca}</p>
            <h3 className="mt-0.5 truncate font-display text-base leading-tight font-bold tracking-[-0.01em] text-texto">
              {modelo}
            </h3>
            <p className="numeros mt-1.5 text-xs text-texto-2">
              {bike.ano}
              {bike.quilometragem != null ? ` · ${formatKm(bike.quilometragem)}` : ''}
            </p>
            {estado ? <p className="mt-1 text-xs text-texto-3">{estado}</p> : null}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <p className="numeros font-display text-lg leading-none font-extrabold tracking-[-0.02em] text-marca-texto">
              {formatPrice(bike.preco)}
            </p>
            {conversa()}
          </div>
        </div>
      </article>
    )
  }

  if (variante === 'indice') {
    return (
      <article className="group relative flex items-center gap-6 py-7 xl:gap-8">
        <Link
          to={`/moto/${bike.slug}`}
          aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
          className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-marca"
        />

        <div className="relative aspect-[4/3] w-56 shrink-0 overflow-hidden bg-noite-2 xl:w-72">
          {foto}
          <Selos lista={selosDaMoto(bike)} />

          {estado ? (
            <span className="absolute bottom-0 left-0 bg-noite/90 px-2.5 py-1.5 text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-noite-texto-2">
              {estado}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-none text-texto-3">{bike.marca}</p>
          <h3 className="mt-2 font-display text-[1.375rem] leading-none font-bold tracking-[-0.02em] text-texto">
            <span className="underline-offset-[6px] group-hover:underline group-hover:decoration-marca/60">
              {modelo}
            </span>
          </h3>
          <p className="numeros mt-2.5 text-[13px] leading-none text-texto-3">
            <span className="font-medium text-texto-2">{bike.ano}</span>
            {bike.quilometragem != null ? `, ${formatKm(bike.quilometragem)}` : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-end gap-5">
          <div className="text-right">
            <p className="preco text-[1.375rem] leading-none">{formatPrice(bike.preco)}</p>
            {desconto != null ? (
              <p className="numeros mt-1.5 text-[12px] leading-none text-texto-3">
                de <s>{formatPrice(bike.precoAntes ?? bike.preco)}</s>
                <span className="text-marca-texto"> (−{desconto}%)</span>
              </p>
            ) : null}
            {precoRequerConfirmacao(bike.preco) ? (
              <p className="mt-1.5 text-[11px] text-texto-3">Confirme com a loja</p>
            ) : null}
          </div>
          {conversa(true)}
        </div>
      </article>
    )
  }

  if (variante === 'vitrine') {
    return (
      <article className="group relative flex h-full flex-col transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0">
        <Link
          to={`/moto/${bike.slug}`}
          aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
          className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-marca"
        />

        <div className="relative aspect-[4/3] overflow-hidden bg-noite-2">
          {foto}
          {/* Véu curto no pé da foto: as imagens vêm de celular, muitas
              em concreto claro, e sem isso o retângulo branco estoura
              no fundo escuro da página. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-1/3 bg-[linear-gradient(to_top,rgb(8_9_11/0.55),transparent)]"
          />
          <Selos lista={selosDaMoto(bike)} />

          {estado ? (
            <span className="absolute bottom-0 left-0 z-[5] bg-noite/90 px-2.5 py-1.5 text-[10px] font-medium uppercase leading-none tracking-[0.14em] text-noite-texto-2">
              {estado}
            </span>
          ) : null}
        </div>

        {/* A ficha sobe para cima do preço: o cartão passa a ler nome →
            ano/km → preço, e o preço fica na mesma linha em todos os
            cards, sem a linha miúda solta embaixo. */}
        <div className="flex flex-1 flex-col pt-4">
          <h3 className="line-clamp-2 min-h-[2.4em] font-display text-[1.1875rem] leading-[1.2] font-bold tracking-[-0.015em] text-texto">
            {modelo}
          </h3>

          <p className="numeros mt-2 text-[13px] leading-none text-texto-3">
            <span className="font-medium text-texto-2">{bike.marca}</span> {bike.ano}
            {bike.quilometragem != null ? `, ${formatKm(bike.quilometragem)}` : ''}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div className="min-w-0">
              <p className="preco text-[1.25rem] leading-none">{formatPrice(bike.preco)}</p>
              {desconto != null ? (
                <p className="numeros mt-1.5 text-[12px] leading-none text-texto-3">
                  de <s>{formatPrice(bike.precoAntes ?? bike.preco)}</s>
                  <span className="text-marca-texto"> (−{desconto}%)</span>
                </p>
              ) : null}
              {precoRequerConfirmacao(bike.preco) ? (
                <p className="mt-1.5 text-[11px] text-texto-3">Confirme com a loja</p>
              ) : null}
            </div>
            {conversa(true)}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group relative flex h-full flex-col border border-borda bg-painel transition-transform duration-200 hover:-translate-y-0.5 hover:border-borda-forte motion-reduce:hover:translate-y-0">
      <Link
        to={`/moto/${bike.slug}`}
        aria-label={`Ver a ficha de ${titulo} ${bike.ano}`}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-marca"
      />

      <div className="relative aspect-[4/3] overflow-hidden bg-noite-2">
        {foto}

        {desconto != null ? (
          <span className="absolute top-0 left-0 flex h-8 items-center bg-marca px-2.5 text-white">
            <span className="sr-only">Promoção: </span>
            <span className="numeros text-xs font-semibold">−{desconto}%</span>
          </span>
        ) : null}

        <Selos lista={selosDaMoto(bike)} direita />

        {estado ? (
          <span className="absolute bottom-0 left-0 bg-noite px-2.5 py-1.5 text-[11px] font-medium text-noite-texto">
            {estado}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-2 pt-2.5 pb-3 sm:px-4 sm:pt-3.5 sm:pb-4">
        <p className="text-[10px] font-medium text-texto-3 uppercase sm:text-[11px]">{bike.marca}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5em] font-display text-[13px] leading-tight font-bold tracking-[-0.01em] text-texto sm:text-[15px] md:text-base">
          {modelo}
        </h3>

        <p className="numeros mt-1.5 text-[11px] text-texto-2 sm:mt-2 sm:text-xs">
          {bike.ano}
          {bike.quilometragem != null ? ` · ${formatKm(bike.quilometragem)}` : ''}
        </p>

        <div className="mt-auto flex items-end justify-between gap-1.5 pt-3 sm:gap-3 sm:pt-4">
          <div className="min-w-0">
            {desconto != null ? (
              <p className="numeros text-[11px] leading-none text-texto-3 line-through">
                {formatPrice(bike.precoAntes ?? bike.preco)}
              </p>
            ) : null}
            <p className="numeros mt-0.5 font-display text-[15px] leading-none font-extrabold tracking-[-0.02em] text-marca-texto sm:text-lg md:text-xl">
              {formatPrice(bike.preco)}
            </p>
            {precoRequerConfirmacao(bike.preco) ? (
              <p className="mt-1 text-[11px] text-texto-3">Confirme com a loja</p>
            ) : null}
          </div>
          {conversa()}
        </div>
      </div>
    </article>
  )
}
