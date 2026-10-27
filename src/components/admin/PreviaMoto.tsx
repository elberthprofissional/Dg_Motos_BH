import {
  ArrowLeft,
  CircleDollarSign,
  ExternalLink,
  Lock,
  Pencil,
  Trash2,
} from 'lucide-react'
import type { Motorcycle, MotorcycleSpec, MotorcycleStatus } from '../../types'
import {
  bikeTitle,
  descontoPercentual,
  formatKm,
  formatPrice,
  precoPareceIncompleto,
  precoRequerConfirmacao,
} from '../../lib/format'
import { descricaoDe } from '../../lib/ficha'
import { fichaDeReferencia } from '../../data/fichasModelo'
import { SITE_URL } from '../../data/site'
import { BikeGallery } from '../motorcycles/BikeGallery'

interface PreviaMotoProps {
  moto: Motorcycle
  onVoltar: () => void
  onEditar: () => void
  onVender: () => void
  onExcluir: () => void
}

/** Preço fora do anúncio público: valor incompleto ou alto demais. */
function precoEmConferencia(preco: number): boolean {
  return precoPareceIncompleto(preco) || precoRequerConfirmacao(preco)
}

function rotuloStatus(status: MotorcycleStatus): string {
  if (status === 'disponivel') return 'No pátio'
  if (status === 'vendida') return 'Vendida'
  return 'Indisponível'
}

/**
 * ============================================================
 * PRÉVIA DA MOTO — a ficha pública vista de dentro do painel
 * ============================================================
 * Clicar numa linha do Estoque abre esta tela em vez de mandar o
 * dono para o site. O anúncio é remontado com os mesmos tokens da
 * vitrine (`data-tema="publico"`), dentro de uma moldura de prova,
 * para ele conferir foto, preço, ficha e descrição sem perder o
 * contexto do painel. As ações de gestão ficam fora da moldura: o
 * que está em cima é o que o cliente vê; embaixo, o que o dono pode
 * fazer com a moto.
 */
export function PreviaMoto({ moto, onVoltar, onEditar, onVender, onExcluir }: PreviaMotoProps) {
  const titulo = bikeTitle(moto)
  const referencia = fichaDeReferencia(moto)
  const paragrafos = descricaoDe(moto)
  const usandoReferencia = moto.descricao.trim().length === 0 && referencia != null

  const precoIncompleto = precoPareceIncompleto(moto.preco)
  const precoParaConfirmar = precoRequerConfirmacao(moto.preco)
  const desconto = precoEmConferencia(moto.preco) ? null : descontoPercentual(moto)
  const valor = precoIncompleto ? 'Preço sob consulta' : formatPrice(moto.preco)
  const disponivel = moto.status === 'disponivel'

  const lead = referencia
    ? referencia.resumo
    : `${moto.categoria} ${moto.ano}${
        moto.quilometragem != null ? ` com ${formatKm(moto.quilometragem)}` : ''
      } no pátio da DG Motos, em Belo Horizonte.`

  const itensUnidade: MotorcycleSpec[] = [
    { label: 'Ano', value: String(moto.ano) },
    { label: 'Quilometragem', value: formatKm(moto.quilometragem) },
    ...(moto.cilindrada ? [{ label: 'Cilindrada', value: `${moto.cilindrada} cc` }] : []),
    { label: 'Categoria', value: moto.categoria },
    { label: 'Situação', value: rotuloStatus(moto.status) },
  ]

  const especificacoesLoja = (moto.especificacoes ?? []).filter(
    (item) => item?.label?.trim() && item?.value?.trim(),
  )

  // Mesma regra da ficha pública: sem referência e sem nada escrito
  // pela loja, a coluna de ficha não entra — nem aqui na prévia.
  const temFicha = referencia != null || especificacoesLoja.length > 0

  const rotulosUnidade = new Set(itensUnidade.map((item) => item.label.toLocaleLowerCase('pt-BR')))
  for (const spec of especificacoesLoja) {
    const chave = spec.label.toLocaleLowerCase('pt-BR')
    if (rotulosUnidade.has(chave)) continue
    itensUnidade.push(spec)
    rotulosUnidade.add(chave)
  }

  const endereco = `${SITE_URL.replace(/^https?:\/\//, '')}/moto/${moto.slug}`

  /* Resumo técnico do topo: quem é a moto em quatro dados. Um valor
     que a loja ainda não cadastrou trava o tom de "confirmado" —
     entra mais claro, como remissão, e não como dado. */
  const resumoTecnico: { rotulo: string; valor: string; incerto?: boolean }[] = [
    { rotulo: 'Ano', valor: String(moto.ano) },
    { rotulo: 'Quilometragem', valor: formatKm(moto.quilometragem) },
    { rotulo: 'Categoria', valor: moto.categoria },
    {
      rotulo: 'Cilindrada',
      valor: moto.cilindrada ? `${moto.cilindrada} cc` : 'A confirmar',
      incerto: !moto.cilindrada,
    },
  ]

  return (
    <section className="mx-auto flex w-full max-w-[76rem] flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar ao estoque"
            title="Voltar ao estoque"
            className="foco-painel grid size-10 shrink-0 place-items-center border border-line text-steel-400 transition-colors hover:border-claro/25 hover:text-paper"
          >
            <ArrowLeft className="size-5" strokeWidth={1.8} aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <p className="font-sans text-[11px] font-semibold tracking-[0.14em] text-steel-500 uppercase">
              Prévia no site
            </p>
            {/* No celular o título quebra em vez de truncar: saber qual
                moto é vale mais que economizar duas linhas. */}
            <h1
              id="previa-titulo"
              className="mt-1 break-words font-display text-xl font-semibold text-paper sm:truncate sm:text-2xl"
            >
              {titulo} · {moto.ano}
            </h1>
            <p className="mt-1 text-sm text-steel-400">
              É assim que o anúncio aparece para quem visita a loja.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onEditar} className="estoque-btn-primario">
            <Pencil className="size-4" strokeWidth={1.8} aria-hidden="true" />
            Editar moto
          </button>
          <a
            href={`/moto/${moto.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="foco-painel inline-flex h-10 items-center gap-2 border border-line px-4 text-sm font-semibold text-steel-300 transition-colors hover:border-claro/25 hover:text-paper"
          >
            <ExternalLink className="size-4" strokeWidth={1.8} aria-hidden="true" />
            Ver no site
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>
      </header>

      {/* Moldura de prova: tokens do site público dentro do painel,
          para a prévia não herdar os cinzas azulados da ferramenta. */}
      <div
        data-tema="publico"
        className="overflow-hidden border border-borda-forte bg-fundo"
        aria-labelledby="previa-titulo"
      >
        <div className="flex items-center gap-3 border-b border-borda bg-painel-2 px-4 py-2.5">
          <span className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-texto-3/30" />
            <span className="size-2 rounded-full bg-texto-3/30" />
            <span className="size-2 rounded-full bg-texto-3/30" />
          </span>
          <span className="mx-auto inline-flex min-w-0 items-center gap-1.5 text-[11px] text-texto-3">
            <Lock className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{endereco}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-texto-3 uppercase">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
            No ar
          </span>
        </div>

        <div className="px-4 py-5 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
          {/* No celular a ordem conta: primeiro o anúncio em texto (o que
              é, quanto custa), depois a foto — contida, sem dominar a
              página — e por último as fichas. No desktop a composição
              aprovada fica intocada: texto e ficha à esquerda, foto à
              direita, os dois no mesmo eixo. */}
          <div className="flex flex-col gap-7 sm:gap-8 lg:grid lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:items-center lg:gap-10 xl:gap-14">
            <div className="order-1 min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-texto-3 uppercase">
                {moto.categoria} · {moto.ano}
              </p>

              <h2 className="mt-3 font-display text-[clamp(2rem,3.4vw,3.25rem)] leading-[0.98] font-bold tracking-[-0.035em] break-words text-balance text-texto">
                {titulo}
              </h2>

              <p className="mt-3 max-w-[38ch] text-[0.95rem] leading-relaxed text-texto-2">
                {lead}
              </p>

              <div className="mt-5">
                {desconto != null ? (
                  <p className="numeros mb-1 text-xs text-texto-3">
                    de {formatPrice(moto.precoAntes ?? moto.preco)}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p
                    className={`font-display text-[clamp(1.75rem,2.6vw,2.25rem)] leading-none font-bold tracking-[-0.03em] ${
                      precoIncompleto ? 'text-texto' : 'numeros text-marca-viva'
                    }`}
                  >
                    {valor}
                  </p>

                  {desconto != null ? (
                    <span className="numeros bg-marca px-2 py-1 text-xs font-bold text-white">
                      −{desconto}%
                    </span>
                  ) : null}

                  <span
                    className={`inline-flex h-7 items-center px-2.5 text-xs font-semibold ${
                      disponivel ? 'bg-marca text-white' : 'bg-painel-3 text-texto-2'
                    }`}
                  >
                    {rotuloStatus(moto.status)}
                  </span>
                </div>

                {precoIncompleto ? (
                  <p className="mt-2 max-w-[40ch] text-xs leading-relaxed text-texto-2">
                    O valor desta unidade está em conferência na loja.
                  </p>
                ) : precoParaConfirmar ? (
                  <p className="mt-2 max-w-[40ch] text-xs leading-relaxed text-texto-2">
                    Valor cadastrado. Confirme o preço com a loja antes de negociar.
                  </p>
                ) : null}
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
                {resumoTecnico.map((item) => (
                  <div key={item.rotulo}>
                    <dt className="text-[11px] leading-none text-texto-3">{item.rotulo}</dt>
                    <dd
                      className={`numeros mt-1.5 text-sm leading-none ${
                        item.incerto ? 'font-medium text-texto-3' : 'font-semibold text-texto'
                      }`}
                    >
                      {item.valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="order-2 min-w-0 lg:h-[26rem] xl:h-[30rem]">
              <aside aria-label={`Fotos de ${titulo} ${moto.ano}`} className="h-full">
                <BikeGallery
                  key={moto.id}
                  imagens={moto.imagens}
                  titulo={`${titulo} ${moto.ano}`}
                  preencherAltura
                />
              </aside>
            </div>
          </div>

          {/* Nada de sobre nem ficha: nem a régua que dividia fica. */}
          {paragrafos.length === 0 && !temFicha ? null : (
          <div
            className={`mt-10 grid gap-9 border-t border-borda pt-9 ${
              paragrafos.length > 0 && temFicha ? 'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12' : ''
            }`}
          >
            {/* Prévia segue a página: sem texto escrito, sem bloco. */}
            {paragrafos.length > 0 ? (
            <section aria-labelledby="previa-sobre">
              <h2
                id="previa-sobre"
                className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-texto"
              >
                {usandoReferencia && referencia ? `Sobre a ${referencia.modelo}` : 'Sobre esta moto'}
              </h2>

              <div className="mt-4 max-w-[58ch] space-y-4">
                {paragrafos.map((paragrafo, indice) => (
                  <p
                    key={`${indice}-${paragrafo.slice(0, 24)}`}
                    className={`text-[0.95rem] leading-relaxed text-texto-2 ${
                      indice === 0
                        ? 'first-letter:float-left first-letter:mt-1 first-letter:mr-2 first-letter:font-display first-letter:text-4xl first-letter:leading-[0.8] first-letter:font-bold first-letter:text-marca-texto'
                        : ''
                    }`}
                  >
                    {paragrafo}
                  </p>
                ))}
              </div>

              {usandoReferencia && referencia ? (
                <p className="mt-4 text-xs leading-relaxed text-texto-3">
                  Texto e especificações da linha {referencia.modelo}. O estado desta unidade é
                  conferido com a loja.
                </p>
              ) : null}
            </section>
            ) : null}

            {temFicha ? (
              <section aria-labelledby="previa-ficha">
                <h2
                  id="previa-ficha"
                  className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-texto"
                >
                  Ficha desta unidade
                </h2>

                <dl className="mt-4 border-t border-borda">
                  {itensUnidade.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-baseline justify-between gap-4 border-b border-borda py-2.5"
                    >
                      <dt className="text-sm text-texto-3">{item.label}</dt>
                      <dd className="numeros text-right text-sm font-medium text-texto">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
          )}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="max-w-[58ch] text-xs leading-relaxed text-steel-500">
          A prévia mostra o anúncio como está agora. Mudar o status ou excluir vale na hora, para o
          site e para o painel.
        </p>

        {/* Cada ação ocupa a linha que precisa e as duas compartilham a
            largura no celular — botão de 44px de altura, label nunca
            cortado. A exclusão mantém o carimbo vermelho do painel. */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onVender}
            className="foco-painel inline-flex h-11 w-full items-center justify-center gap-2 border border-line px-4 text-sm font-medium text-steel-300 transition-colors hover:border-claro/25 hover:text-paper sm:h-10 sm:w-auto"
          >
            <CircleDollarSign className="size-4" strokeWidth={1.8} aria-hidden="true" />
            Marcar como vendida
          </button>
          <button
            type="button"
            onClick={onExcluir}
            className="foco-painel inline-flex h-11 w-full items-center justify-center gap-2 border border-marca/35 px-4 text-sm font-medium text-marca-texto transition-colors hover:border-marca/60 hover:bg-marca/10 sm:h-10 sm:w-auto"
          >
            <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
            Excluir moto
          </button>
        </div>
      </footer>
    </section>
  )
}
