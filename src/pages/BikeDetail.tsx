import { Link, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUpRight } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useJsonLd } from '../hooks/useJsonLd'
import { useWhatsappLink } from '../hooks/useWhatsappLink'
import { usePageMeta } from '../hooks/usePageMeta'
import { vehicleSchema } from '../lib/schema'
import {
  bikeTitle,
  buildBikeMessage,
  descontoPercentual,
  formatKm,
  formatPrice,
  precoEmConferencia,
  precoPareceIncompleto,
  precoRequerConfirmacao,
  resumoPublico,
} from '../lib/format'
import { descricaoDe, gruposDaFicha } from '../lib/ficha'
import { fichaDeReferencia } from '../data/fichasModelo'
import { BikeGallery } from '../components/motorcycles/BikeGallery'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { IconeWhatsapp } from '../components/ui/IconeWhatsapp'
import { Button } from '../components/ui/Button'
import { Revelar } from '../components/ui/Revelar'
import type { Motorcycle, MotorcycleStatus } from '../types'

/** Preço do anúncio compacto (lista de "outras motos"). */
function precoDeLista(preco: number): string {
  return precoEmConferencia(preco) ? 'Sob consulta' : formatPrice(preco)
}

function rotuloStatus(status: MotorcycleStatus): string {
  if (status === 'disponivel') return 'No pátio'
  if (status === 'vendida') return 'Vendida'
  return 'Indisponível'
}

function metaDescricaoDe(bike: Motorcycle): string {
  return `${resumoPublico(bike)} ${precoDeLista(bike.preco)}.`
}

export function BikeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { motos, carregando, doBanco } = useCatalogo()
  const bike = motos.find((m) => m.slug === slug)

  const descricao = bike ? descricaoDe(bike) : []

  useJsonLd(bike ? vehicleSchema(bike, descricao.join(' ')) : {})

  usePageMeta(
    bike
      ? `${bikeTitle(bike)} ${bike.ano} | DG Motos`
      : 'Motocicleta não encontrada | DG Motos',
    bike
      ? metaDescricaoDe(bike)
      : 'Esta motocicleta não está mais no catálogo da DG Motos.',
  )

  const waHref = useWhatsappLink(
    bike ? buildBikeMessage(bike.marca, bike.modelo, bike.ano) : '',
  )

  if (!bike && carregando) {
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center pt-cabecalho"
        role="status"
      >
        <span className="sr-only">Carregando</span>
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-2 border-borda-forte border-t-marca"
        />
      </div>
    )
  }

  if (!bike) {
    // Sem o banco, a lista é o catálogo antigo: dizer "foi vendida" aqui
    // seria mentira numa queda do Supabase.
    const semCatalogo = !doBanco
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-cabecalho text-center">
        <h1 className="titulo mt-4 max-w-[22ch] text-3xl text-balance text-texto sm:text-4xl">
          {semCatalogo ? 'Não conseguimos abrir o estoque agora' : 'Motocicleta não encontrada'}
        </h1>
        <p className="corpo mt-4 max-w-md text-texto-2">
          {semCatalogo
            ? 'O catálogo não respondeu. Tente de novo em instantes ou fale com a loja para confirmar a moto.'
            : 'Essa moto pode já ter sido vendida, ou o endereço do link está errado.'}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {semCatalogo ? (
            <Button onClick={() => window.location.reload()}>Tentar de novo</Button>
          ) : (
            <Button to="/estoque">Ver as outras motos do estoque</Button>
          )}
          <Button to="/contato" variant="outline">
            Falar com a loja
          </Button>
        </div>
      </div>
    )
  }

  const titulo = bikeTitle(bike)
  const disponivel = bike.status === 'disponivel'
  const referencia = fichaDeReferencia(bike)
  const descricaoDaLoja = bike.descricao.trim().length > 0
  const usandoReferencia = !descricaoDaLoja && referencia != null
  const paragrafos = descricao
  const destaques = referencia?.destaques ?? []

  const precoIncompleto = precoPareceIncompleto(bike.preco)
  const precoParaConfirmar = precoRequerConfirmacao(bike.preco)
  const desconto = precoEmConferencia(bike.preco) ? null : descontoPercentual(bike)
  const valor = precoIncompleto ? 'Preço sob consulta' : formatPrice(bike.preco)

  const especificacoesLoja = (bike.especificacoes ?? []).filter(
    (spec) => spec?.label?.trim() && spec?.value?.trim(),
  )

  // Sem ficha da linha e sem nada escrito pela loja, o bloco inteiro
  // sai da página: o que sobra é o resumo que o herói já mostra.
  const temFicha = referencia != null || especificacoesLoja.length > 0

  const grupos = gruposDaFicha(bike)

  const gradeGrupos =
    grupos.length >= 4
      ? 'xl:grid-cols-4'
      : grupos.length === 3
        ? 'xl:grid-cols-3'
        : ''

  const introFicha = referencia
    ? `Os dados desta unidade abrem a ficha; o restante é a especificação da linha ${referencia.modelo}.`
    : 'Os dados cadastrados pela loja para esta unidade.'

  const notaFicha = referencia
    ? `${referencia.nota} Os campos de “Esta unidade” foram cadastrados pela loja.`
    : 'Dados cadastrados pela loja para esta unidade. Confirme os detalhes com o atendimento antes de fechar negócio.'

  const recomendadas = motos
    .filter((m) => m.id !== bike.id && m.status === 'disponivel')
    .slice(0, 6)

  const semDestaques = destaques.length === 0

  const tituloSobre = (
    <h2
      id="sobre-titulo"
      className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-texto"
    >
      {usandoReferencia && referencia
        ? `Sobre a ${referencia.modelo}`
        : 'Sobre esta moto'}
    </h2>
  )

  const textoSobre = (
    <div
      className={`mt-6 max-w-[36rem] space-y-5 lg:max-w-[62ch] ${semDestaques ? 'lg:mt-1' : ''}`}
    >
      {paragrafos.map((paragrafo, indice) => (
        <p
          key={`${indice}-${paragrafo.slice(0, 24)}`}
          className={`text-[1.0625rem] leading-[1.7] text-texto-2 ${
            indice === 0
              ? 'first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-display first-letter:text-[3.5rem] first-letter:leading-[0.75] first-letter:font-bold first-letter:text-marca-texto lg:first-letter:float-none lg:first-letter:mt-0 lg:first-letter:mr-0 lg:first-letter:font-sans lg:first-letter:text-[1.0625rem] lg:first-letter:leading-[1.7] lg:first-letter:font-normal lg:first-letter:text-texto-2'
              : ''
          }`}
        >
          {paragrafo}
        </p>
      ))}
    </div>
  )

  const notaSobre =
    usandoReferencia && referencia ? (
      <p className="mt-6 text-sm leading-relaxed text-texto-3">
        Texto e ficha da linha {referencia.modelo}. O estado desta unidade, você
        confere com a loja.
      </p>
    ) : null

  return (
    <div className="bg-fundo pt-cabecalho pb-24 sm:pb-0">
      {/* ============================================================
          VITRINE DE APP — celular

          A foto abre a página, seguida das miniaturas e do título; as
          especificações viram cartões e a descrição fecha o bloco. O
          preço e o WhatsApp vivem na barra fixa do rodapé.
          ============================================================ */}
      <div className="block pb-6 sm:hidden">
        <div className="relative">
          <BikeGallery
            key={`${bike.id}-app`}
            variante="app"
            imagens={bike.imagens}
            titulo={`${titulo} ${bike.ano}`}
          />
          <Link
            to="/estoque"
            aria-label="Voltar ao estoque"
            title="Voltar ao estoque"
            className="absolute top-3 left-7 z-10 grid size-10 place-items-center rounded-full bg-neutral-950/70 text-white backdrop-blur-md transition-colors hover:bg-marca focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
        </div>

        <h1 className="mt-3 px-4 text-2xl font-black tracking-tight text-white uppercase">
          {titulo}
        </h1>

        <dl className="mt-4 grid grid-cols-2 gap-2 px-4">
          {[
            ['Ano', String(bike.ano)],
            ['Quilometragem', formatKm(bike.quilometragem)],
            ['Cilindrada', bike.cilindrada ? `${bike.cilindrada} cc` : 'A confirmar'],
          ].map(([rotulo, valorItem]) => (
            <div
              key={rotulo}
              className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3"
            >
              <dt className="text-xs leading-none font-medium text-neutral-400">{rotulo}</dt>
              <dd className="numeros mt-1.5 text-sm leading-none font-bold text-white">
                {valorItem}
              </dd>
            </div>
          ))}
        </dl>

        {/* Sem texto da loja e sem ficha da linha, o bloco nem existe:
            nada no lugar de um sobre que ninguém escreveu. */}
        {paragrafos.length > 0 ? (
        <section
          aria-labelledby="sobre-mobile-titulo"
          className="mx-4 mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4"
        >
          <h2 id="sobre-mobile-titulo" className="text-base font-bold text-white">
            {usandoReferencia && referencia
              ? `Sobre a ${referencia.modelo}`
              : 'Sobre esta moto'}
          </h2>
          <div className="mt-2 space-y-3">
            {paragrafos.map((paragrafo, indice) => (
              <p
                key={`mobile-${indice}-${paragrafo.slice(0, 24)}`}
                className="text-sm leading-relaxed text-neutral-300"
              >
                {paragrafo}
              </p>
            ))}
          </div>
        </section>
        ) : null}
      </div>

      {/* ============================================================
          PALCO PARTIDO

          No desktop a foto vira a peça grande à esquerda e o painel de
          compra acompanha a rolagem à direita, os dois na mesma bancada.
          ============================================================ */}
      <div className="hidden flex-col sm:flex lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-12 lg:items-start lg:gap-10 lg:px-6 lg:py-8">
        <div className="contents lg:sticky lg:top-24 lg:col-span-5 lg:flex lg:min-w-0 lg:flex-col lg:self-start">
          <header className="order-1 px-4 pt-5 sm:pt-8 lg:order-none lg:px-0 lg:pt-0">
            <div className="max-w-[42rem]">
              <div>
                <Link
                  to="/estoque"
                  aria-label="Voltar ao estoque"
                  title="Voltar ao estoque"
                  className="grid size-11 -ml-2 place-items-center text-texto-2 transition-colors hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
                >
                  <ArrowLeft className="size-5" aria-hidden="true" />
                </Link>
              </div>

              <h1 className="mt-8 max-w-full font-display text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.94] font-bold tracking-[-0.045em] break-words text-balance text-texto sm:mt-10 lg:mt-6 lg:text-4xl lg:leading-[0.98] lg:font-extrabold lg:tracking-[-0.02em] lg:uppercase xl:text-5xl">
                {titulo}
              </h1>

              <div className="mt-7 lg:mt-5 lg:border-t lg:border-borda lg:pt-5">
                {desconto != null ? (
                  <p className="numeros mb-1.5 text-sm text-texto-3">
                    de {formatPrice(bike.precoAntes ?? bike.preco)}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <p
                    className={`font-display text-[clamp(2rem,3vw,2.5rem)] leading-none font-bold tracking-[-0.03em] lg:text-[3rem] lg:font-black xl:text-[3.25rem] ${
                      precoIncompleto ? 'text-texto' : 'numeros text-marca-viva'
                    }`}
                  >
                    {valor}
                  </p>

                  {desconto != null ? (
                    <span className="numeros bg-marca px-2.5 py-1 font-sans text-sm font-bold text-white">
                      −{desconto}%
                    </span>
                  ) : null}

                  <p
                    className={`inline-flex h-8 items-center px-3 text-sm font-semibold lg:hidden ${
                      disponivel ? 'bg-marca text-white' : 'bg-painel-3 text-texto-2'
                    }`}
                  >
                    {rotuloStatus(bike.status)}
                  </p>
                </div>

                {precoIncompleto ? (
                  <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-texto-2">
                    O preço desta moto está em conferência na loja. Fale com a
                    equipe para confirmar.
                  </p>
                ) : precoParaConfirmar ? (
                  <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-texto-2">
                    Confirme o preço com a loja antes de negociar.
                  </p>
                ) : null}
              </div>
            </div>
          </header>

          <dl className="order-4 mt-8 mb-6 grid grid-cols-2 gap-x-6 gap-y-5 px-4 sm:mb-8 sm:grid-cols-4 lg:order-none lg:mt-6 lg:mb-0 lg:grid-cols-2 lg:gap-3 lg:rounded-xl lg:border lg:border-borda lg:bg-painel/60 lg:p-4 lg:backdrop-blur-md">
            {[
              ['Ano', String(bike.ano)],
              ['Quilometragem', formatKm(bike.quilometragem)],
              ['Cilindrada', bike.cilindrada ? `${bike.cilindrada} cc` : 'A confirmar'],
            ].map(([rotulo, valorItem]) => (
              <div
                key={rotulo}
                className="lg:min-w-0 lg:rounded-lg lg:border lg:border-borda/70 lg:bg-fundo/40 lg:px-3.5 lg:py-3"
              >
                <dt className="text-sm leading-none text-texto-3">{rotulo}</dt>
                <dd className="numeros mt-2 text-[1.0625rem] leading-none font-semibold text-texto">
                  {valorItem}
                </dd>
              </div>
            ))}
          </dl>

          <div className="order-2 mt-5 flex flex-col gap-3 px-4 sm:flex-row lg:order-none lg:mt-6 lg:flex-col lg:gap-2.5 lg:px-0">
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary h-[3.25rem] flex-1 gap-2.5 px-5 text-sm lg:h-auto lg:w-full lg:rounded-xl lg:bg-emerald-600 lg:py-4 lg:text-lg lg:font-bold lg:text-white lg:shadow-lg lg:shadow-emerald-950/40 lg:hover:bg-emerald-500 lg:hover:text-white"
              >
                <IconeWhatsapp className="size-[18px] shrink-0" />
                Falar no WhatsApp
              </a>
            ) : (
              <Link
                to="/contato"
                className="btn btn-primary h-[3.25rem] flex-1 gap-2.5 px-5 text-sm lg:h-auto lg:w-full lg:rounded-xl lg:bg-emerald-600 lg:py-4 lg:text-lg lg:font-bold lg:text-white lg:shadow-lg lg:shadow-emerald-950/40 lg:hover:bg-emerald-500 lg:hover:text-white"
              >
                <IconeWhatsapp className="size-[18px] shrink-0" />
                Falar com a loja
              </Link>
            )}

            {temFicha ? (
              <a
                href="#ficha"
                className="btn btn-secondary h-[3.25rem] flex-1 gap-2.5 px-5 text-sm lg:h-12 lg:w-full lg:rounded-xl lg:border-borda lg:text-texto-2"
              >
                Ver ficha técnica
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>

        <aside
          aria-label={`Fotos de ${titulo} ${bike.ano}`}
          className="order-3 mt-8 px-4 lg:order-first lg:col-span-7 lg:mt-0 lg:w-full lg:px-0"
        >
          <BikeGallery
            key={bike.id}
            imagens={bike.imagens}
            titulo={`${titulo} ${bike.ano}`}
          />
        </aside>
      </div>

      {/* O cartão só fica de pé com matéria dentro: destaque da linha
          ou texto da loja. Sem os dois, nem a borda aparecem — vazio
          ele virava um retângulo órfão na página. */}
      {destaques.length > 0 || paragrafos.length > 0 || temFicha ? (
      <div
        className={`hidden px-4 sm:block lg:mx-auto lg:w-full lg:max-w-7xl lg:px-6 lg:pb-0 ${
          temFicha ? 'pb-16' : ''
        }`}
      >
        {destaques.length > 0 || paragrafos.length > 0 ? (
        <div className="max-w-[42rem] lg:mt-12 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-x-12 lg:rounded-2xl lg:border lg:border-borda lg:bg-painel/40 lg:p-8 xl:gap-x-16 xl:p-10">
          {destaques.length > 0 ? (
            <Revelar
              as="section"
              aria-labelledby="destaques-titulo"
              className="pt-4 sm:pt-6 lg:border-t lg:border-borda lg:pt-8"
            >
              <h2
                id="destaques-titulo"
                className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-texto"
              >
                A linha em três pontos
              </h2>

              <dl className="mt-8 space-y-8 lg:mt-6 lg:space-y-6">
                {destaques.map((destaque) => (
                  <div key={destaque.rotulo}>
                    <dt>
                      <span className="block font-display text-[1.75rem] leading-none font-semibold tracking-[-0.025em] text-texto">
                        {destaque.valor}
                      </span>
                      <span className="mt-2 block text-sm font-medium text-texto">
                        {destaque.rotulo}
                      </span>
                    </dt>
                    <dd className="mt-2 text-[1.0625rem] leading-relaxed text-texto-2">
                      {destaque.texto}
                    </dd>
                  </div>
                ))}
              </dl>
            </Revelar>
          ) : null}

          {/* Sem descrição escrita, a seção inteira sai da página: o
              título “Sobre esta moto” não dita conversa de ninguém. */}
          {paragrafos.length > 0 ? (
            <Revelar
              as="section"
              aria-labelledby="sobre-titulo"
              className={`mt-16 lg:mt-0 lg:border-t lg:border-borda lg:pt-8 ${
                semDestaques ? 'lg:col-span-2' : ''
              }`}
            >
              {semDestaques ? (
                <div className="lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-x-12 xl:gap-x-16">
                  {tituloSobre}
                  {textoSobre}
                </div>
              ) : (
                <>
                  {tituloSobre}
                  {textoSobre}
                </>
              )}

              {notaSobre}
            </Revelar>
          ) : null}
        </div>
        ) : null}
      </div>
      ) : null}

      {/* ============================================================
          FICHA DE PAPEL

          O bloco rompe o palco e ocupa a página inteira, como uma ficha
          impressa apoiada na bancada. Primeiro o que é desta unidade;
          depois, quando existe, a referência pública da linha.
          ============================================================ */}
      {temFicha ? (
        <section
          id="ficha"
          aria-labelledby="ficha-titulo"
          className="scroll-mt-20 border-t-2 border-marca bg-[#f1f2f3] text-[#161513] sm:scroll-mt-[4.25rem] lg:mt-12"
        >
          <div className="container-site px-4 py-16 lg:max-w-7xl lg:px-6 lg:py-24">
            <Revelar>
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                <h2
                  id="ficha-titulo"
                  className="font-display text-[3rem] leading-none font-bold tracking-[-0.04em]"
                >
                  Ficha técnica
                </h2>
                <p className="numeros pb-1 text-sm font-semibold text-[#5d5952]">
                  {titulo} · {bike.ano}
                </p>
              </div>
              <p className="mt-5 max-w-[54ch] text-[1.0625rem] leading-relaxed text-[#4f4b44]">
                {introFicha}
              </p>
            </Revelar>

            <div
              className={`mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 ${gradeGrupos}`}
            >
              {grupos.map((grupo, indiceGrupo) => {
                const itens = grupo.itens.filter(
                  (item) => item?.label?.trim() && item?.value?.trim(),
                )
                if (itens.length === 0) return null

                return (
                  <Revelar key={grupo.titulo} atraso={indiceGrupo * 70}>
                    <div className="border-t-2 border-[#161513]/80 pt-4">
                      <h3 className="font-display text-[1.0625rem] font-bold text-[#161513]">
                        {grupo.titulo}
                      </h3>

                      <dl className="mt-4">
                        {itens.map((item) => (
                          <div key={item.label} className="py-2.5">
                            <dt className="text-sm leading-snug text-[#6a655c]">
                              {item.label}
                            </dt>
                            <dd className="numeros mt-1 text-[1.0625rem] leading-snug font-medium text-[#161513]">
                              {item.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </Revelar>
                )
              })}
            </div>

            <Revelar>
              <p className="mt-14 max-w-[80ch] border-t-2 border-[#9e211b]/40 pt-5 text-sm leading-relaxed text-[#5d5952]">
                {notaFicha}
              </p>
            </Revelar>
          </div>
        </section>
      ) : null}

      {/* ============================================================
          OUTRAS MOTOS — no desktop, a mesma vitrine do catálogo em
          quatro colunas; no celular, a lista compacta de sempre.
          ============================================================ */}
      {recomendadas.length > 0 ? (
        <section aria-labelledby="outras-titulo" className="mt-12 mb-16 bg-fundo">
          <div className="container-site px-4 lg:max-w-7xl lg:px-6">
            <div className="grid gap-10 lg:block">
              <div className="flex items-end justify-between gap-6">
                <h2
                  id="outras-titulo"
                  className="max-w-[12ch] font-display text-[2rem] leading-[1.02] font-bold tracking-[-0.035em] text-texto lg:text-[2.5rem]"
                >
                  Outras motos no pátio
                </h2>
                <Link
                  to="/estoque"
                  className="link-acao inline-flex shrink-0 items-center gap-1.5"
                >
                  Ver estoque
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <ul className="space-y-1 lg:hidden">
                {recomendadas.map((outra, indice) => {
                  const capa =
                    outra.imagens.find((imagem) => /vista lateral/i.test(imagem.alt)) ??
                    outra.imagens[0]

                  return (
                    <Revelar as="li" key={outra.id} atraso={indice * 50}>
                      <Link
                        to={`/moto/${outra.slug}`}
                        className="group -mx-3 grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-3 py-4 transition-colors hover:bg-painel-2/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:gap-x-5 lg:gap-x-8"
                      >
                        <span className="relative row-span-2 w-16 shrink-0 self-center overflow-hidden bg-painel-2 sm:row-span-1 sm:w-20">
                          {capa ? (
                            <img
                              src={capa.src}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              width={1200}
                              height={1600}
                              className="aspect-[3/4] size-full object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-105"
                            />
                          ) : null}
                        </span>

                        <span className="min-w-0">
                          <span className="block truncate font-display text-[1.125rem] font-semibold text-texto sm:text-xl">
                            {bikeTitle(outra)}
                          </span>
                          <span className="numeros mt-1 block truncate text-sm text-texto-3">
                            {outra.ano}
                            {outra.quilometragem != null
                              ? ` · ${formatKm(outra.quilometragem)}`
                              : ''}
                          </span>
                        </span>

                        <span className="numeros col-start-2 text-base font-semibold text-texto sm:col-start-3 sm:row-start-1 sm:text-right sm:text-[1.0625rem]">
                          {precoDeLista(outra.preco)}
                        </span>
                      </Link>
                    </Revelar>
                  )
                })}
              </ul>

              <div className="mt-8 hidden lg:grid lg:grid-cols-4 lg:gap-6">
                {recomendadas.slice(0, 4).map((outra, indice) => (
                  <Revelar key={outra.id} atraso={indice * 60} className="h-full">
                    <BikeCard bike={outra} />
                  </Revelar>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ============================================================
          BARRA DE CONVERSÃO — celular

          Preço e WhatsApp sempre à mão, sem empurrar o conteúdo: a
          página ganha respiro inferior (pb-24) para a última vitrine
          não ficar escondida atrás da barra.
          ============================================================ */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur-md sm:hidden">
        <p
          className={`numeros min-w-0 truncate font-extrabold text-red-500 ${
            precoIncompleto ? 'text-base' : 'text-xl'
          }`}
        >
          {valor}
        </p>

        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-colors active:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <IconeWhatsapp className="size-[18px] shrink-0" />
            Falar no WhatsApp
          </a>
        ) : (
          <Link
            to="/contato"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-colors active:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <IconeWhatsapp className="size-[18px] shrink-0" />
            Falar com a loja
          </Link>
        )}
      </div>
    </div>
  )
}
