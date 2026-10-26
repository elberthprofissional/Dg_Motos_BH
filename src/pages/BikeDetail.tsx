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
  precoPareceIncompleto,
  precoRequerConfirmacao,
} from '../lib/format'
import { fichaDeReferencia, type GrupoFicha } from '../data/fichasModelo'
import { SITE } from '../data/site'
import { BikeGallery } from '../components/motorcycles/BikeGallery'
import { IconeWhatsapp } from '../components/ui/IconeWhatsapp'
import { Button } from '../components/ui/Button'
import { Revelar } from '../components/ui/Revelar'
import type { Motorcycle, MotorcycleSpec, MotorcycleStatus } from '../types'

/** Preço fora do anúncio público: valor incompleto ou alto demais. */
function precoEmConferencia(preco: number): boolean {
  return precoPareceIncompleto(preco) || precoRequerConfirmacao(preco)
}

function precoDeLista(preco: number): string {
  return precoEmConferencia(preco) ? 'Sob consulta' : formatPrice(preco)
}

function rotuloStatus(status: MotorcycleStatus): string {
  if (status === 'disponivel') return 'No pátio'
  if (status === 'vendida') return 'Vendida'
  return 'Indisponível'
}

function statusLongo(status: MotorcycleStatus): string {
  if (status === 'disponivel') return 'Disponível no pátio'
  if (status === 'vendida') return 'Vendida'
  return 'Indisponível no momento'
}

/**
 * Texto de apoio quando a unidade não tem descrição nem ficha de linha.
 * Só afirma o que está cadastrado — nada sobre estado, revisão ou dono.
 */
function textoDeApoio(bike: Motorcycle): string {
  const km =
    bike.quilometragem != null
      ? ` O odômetro marca ${formatKm(bike.quilometragem)}.`
      : ''
  const cilindrada = bike.cilindrada ? `, ${bike.cilindrada} cc` : ''
  return `${bikeTitle(bike)} ${bike.ano}${cilindrada}, cadastrada no estoque da DG Motos em Belo Horizonte.${km} Fale com a loja para conferir o estado, a documentação e as condições de pagamento.`
}

function descricaoDe(bike: Motorcycle): string[] {
  const daLoja = bike.descricao.trim()
  if (daLoja) {
    return daLoja
      .split(/\n{2,}/)
      .map((paragrafo) => paragrafo.trim())
      .filter(Boolean)
  }

  return fichaDeReferencia(bike)?.descricao ?? [textoDeApoio(bike)]
}

function metaDescricaoDe(bike: Motorcycle): string {
  const km =
    bike.quilometragem != null ? ` com ${formatKm(bike.quilometragem)}` : ''
  return `${bikeTitle(bike)} ${bike.ano}${km} na DG Motos, em Belo Horizonte. ${precoDeLista(bike.preco)}.`
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
            ? 'O catálogo não respondeu. Tente de novo em instantes — ou fale com a loja que a gente confirma a moto pra você.'
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
  const fotoContato = bike.imagens[bike.imagens.length - 1] ?? bike.imagens[0]

  const precoIncompleto = precoPareceIncompleto(bike.preco)
  const precoParaConfirmar = precoRequerConfirmacao(bike.preco)
  const desconto = precoEmConferencia(bike.preco) ? null : descontoPercentual(bike)
  const valor = precoIncompleto ? 'Preço sob consulta' : formatPrice(bike.preco)

  const lead = referencia
    ? referencia.resumo
    : `${bike.categoria} ${bike.ano}${
        bike.quilometragem != null ? ` com ${formatKm(bike.quilometragem)}` : ''
      } no pátio da DG Motos, em Belo Horizonte.`

  const especificacoesLoja = (bike.especificacoes ?? []).filter(
    (spec) => spec?.label?.trim() && spec?.value?.trim(),
  )

  const itensUnidade: MotorcycleSpec[] = [
    { label: 'Ano', value: String(bike.ano) },
    { label: 'Quilometragem', value: formatKm(bike.quilometragem) },
    ...(bike.cilindrada
      ? [{ label: 'Cilindrada', value: `${bike.cilindrada} cc` }]
      : []),
    { label: 'Categoria', value: bike.categoria },
    { label: 'Situação', value: statusLongo(bike.status) },
  ]

  // Observações escritas pela loja para esta unidade entram na mesma
  // coluna, sem repetir um rótulo que os dados do cadastro já cobrem.
  const rotulosUnidade = new Set(
    itensUnidade.map((item) => item.label.toLocaleLowerCase('pt-BR')),
  )
  for (const spec of especificacoesLoja) {
    const chave = spec.label.toLocaleLowerCase('pt-BR')
    if (rotulosUnidade.has(chave)) continue
    itensUnidade.push(spec)
    rotulosUnidade.add(chave)
  }

  const grupos: GrupoFicha[] = [
    { titulo: 'Esta unidade', itens: itensUnidade },
    ...(referencia?.grupos ?? []),
  ]

  const gradeGrupos =
    grupos.length >= 4
      ? 'xl:grid-cols-4'
      : grupos.length === 3
        ? 'xl:grid-cols-3'
        : ''

  const introFicha = referencia
    ? `Esta unidade em cima; abaixo, as especificações públicas da linha ${referencia.modelo}.`
    : 'Os dados cadastrados pela loja para esta unidade.'

  const notaFicha = referencia
    ? `${referencia.nota} Os campos de “Esta unidade” foram cadastrados pela loja.`
    : 'Dados cadastrados pela loja para esta unidade. Confirme os detalhes com o atendimento antes de fechar negócio.'

  const recomendadas = motos
    .filter((m) => m.id !== bike.id && m.status === 'disponivel')
    .slice(0, 6)

  return (
    <div className="bg-fundo pt-cabecalho">
      {/* ============================================================
          PALCO PARTIDO

          No desktop a foto fica presa ao lado da leitura do começo ao
          fim do bloco — o pátio da DG como cenário fixo da ficha. No
          celular a mesma galeria entra depois do preço e libera a
          rolagem. Um só DOM: o CSS decide onde cada peça cai.
          ============================================================ */}
      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)]">
        <header className="px-[var(--margem)] pt-5 pb-6 sm:pt-8 sm:pb-10 lg:min-h-[calc(100svh-4.25rem)] lg:py-14 lg:pr-12 lg:pl-[max(2rem,calc((100vw-1760px)/2+2rem))] xl:pr-16">
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

            <h1 className="mt-8 max-w-full font-display text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.94] font-bold tracking-[-0.045em] break-words text-balance text-texto sm:mt-10">
              {titulo}
            </h1>

            <p className="mt-4 max-w-[38ch] text-[1.0625rem] leading-[1.6] text-texto-2">
              {lead}
            </p>

            <div className="mt-7">
              {desconto != null ? (
                <p className="numeros mb-1.5 text-sm text-texto-3">
                  de {formatPrice(bike.precoAntes ?? bike.preco)}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <p
                  className={`font-display text-[clamp(2rem,3vw,2.5rem)] leading-none font-bold tracking-[-0.03em] ${
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
                  className={`inline-flex h-8 items-center px-3 text-sm font-semibold ${
                    disponivel ? 'bg-marca text-white' : 'bg-painel-3 text-texto-2'
                  }`}
                >
                  {rotuloStatus(bike.status)}
                </p>
              </div>

              {precoIncompleto ? (
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-texto-2">
                  O valor desta unidade está em conferência na loja. Fale com a
                  equipe para confirmar.
                </p>
              ) : precoParaConfirmar ? (
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-texto-2">
                  Valor cadastrado. Confirme o preço com a loja antes de negociar.
                </p>
              ) : null}
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {[
                ['Ano', String(bike.ano)],
                ['Quilometragem', formatKm(bike.quilometragem)],
                ['Categoria', bike.categoria],
                ['Cilindrada', bike.cilindrada ? `${bike.cilindrada} cc` : 'A confirmar'],
              ].map(([rotulo, valorItem]) => (
                <div key={rotulo}>
                  <dt className="text-sm leading-none text-texto-3">{rotulo}</dt>
                  <dd className="numeros mt-2 text-[1.0625rem] leading-none font-semibold text-texto">
                    {valorItem}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary h-[3.25rem] flex-1 gap-2.5 px-5 text-sm"
                >
                  <IconeWhatsapp className="size-[18px] shrink-0" />
                  Falar no WhatsApp
                </a>
              ) : (
                <Link
                  to="/contato"
                  className="btn btn-primary h-[3.25rem] flex-1 gap-2.5 px-5 text-sm"
                >
                  <IconeWhatsapp className="size-[18px] shrink-0" />
                  Falar com a loja
                </Link>
              )}

              <a
                href="#ficha"
                className="btn btn-secondary h-[3.25rem] flex-1 gap-2.5 px-5 text-sm"
              >
                Ver ficha técnica
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </header>

        <aside
          aria-label={`Fotos de ${titulo} ${bike.ano}`}
          className="order-first lg:order-none lg:sticky lg:top-[4.25rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-[calc(100svh-4.25rem)] lg:self-start lg:overflow-hidden"
        >
          <BikeGallery
            key={bike.id}
            imagens={bike.imagens}
            titulo={`${titulo} ${bike.ano}`}
          />
        </aside>

        <div className="px-[var(--margem)] pb-16 lg:pb-24 lg:pr-12 lg:pl-[max(2rem,calc((100vw-1760px)/2+2rem))] xl:pr-16">
          <div className="max-w-[42rem]">
            {destaques.length > 0 ? (
              <Revelar
                as="section"
                aria-labelledby="destaques-titulo"
                className="pt-4 sm:pt-6"
              >
                <h2
                  id="destaques-titulo"
                  className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-texto"
                >
                  A linha em três pontos
                </h2>

                <dl className="mt-8 space-y-8">
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

            <Revelar
              as="section"
              aria-labelledby="sobre-titulo"
              className="mt-16"
            >
              <h2
                id="sobre-titulo"
                className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-texto"
              >
                {usandoReferencia && referencia
                  ? `Sobre a ${referencia.modelo}`
                  : 'Sobre esta moto'}
              </h2>

              <div className="mt-6 max-w-[36rem] space-y-5">
                {paragrafos.map((paragrafo, indice) => (
                  <p
                    key={`${indice}-${paragrafo.slice(0, 24)}`}
                    className={`text-[1.0625rem] leading-[1.7] text-texto-2 ${
                      indice === 0
                        ? 'first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-display first-letter:text-[3.5rem] first-letter:leading-[0.75] first-letter:font-bold first-letter:text-marca-texto'
                        : ''
                    }`}
                  >
                    {paragrafo}
                  </p>
                ))}
              </div>

              {usandoReferencia && referencia ? (
                <p className="mt-6 text-sm leading-relaxed text-texto-3">
                  Texto e especificações da linha {referencia.modelo}. O estado
                  desta unidade é conferido com a loja.
                </p>
              ) : null}
            </Revelar>
          </div>
        </div>
      </div>

      {/* ============================================================
          FICHA DE PAPEL

          O bloco rompe o palco e ocupa a página inteira, como uma ficha
          impressa apoiada na bancada. Primeiro o que é desta unidade;
          depois, quando existe, a referência pública da linha.
          ============================================================ */}
      <section
        id="ficha"
        aria-labelledby="ficha-titulo"
        className="scroll-mt-20 border-t-2 border-marca bg-[#f1f2f3] text-[#161513] sm:scroll-mt-[4.25rem]"
      >
        <div className="container-site py-16 lg:py-24">
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

      {/* ============================================================
          CONTATO — a foto pequena é a única coisa clara no breu.
          ============================================================ */}
      <section aria-labelledby="contato-titulo" className="bg-painel">
        <div className="container-site py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
            <Revelar className="lg:col-span-6">
              <h2 id="contato-titulo" className="sr-only">
                Fale com a loja
              </h2>
              <p className="max-w-[17ch] font-display text-[clamp(2.25rem,3.4vw,3.25rem)] leading-[1.02] font-bold tracking-[-0.035em] text-texto">
                Tire dúvidas e veja a moto de perto.
              </p>
              <p className="mt-5 max-w-[42ch] text-[1.0625rem] leading-relaxed text-texto-2">
                Atendimento direto com a loja. Peça mais fotos e confirme o preço
                desta unidade com a equipe.
              </p>
            </Revelar>

            {fotoContato ? (
              <Revelar className="lg:col-span-2" atraso={80}>
                <img
                  src={fotoContato.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={1600}
                  className="aspect-[16/9] w-full object-cover object-center lg:aspect-square"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              </Revelar>
            ) : null}

            <Revelar className="lg:col-span-4" atraso={140}>
              <div className="flex flex-col items-start gap-5">
                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary h-12 w-full gap-2.5 px-5 text-sm"
                  >
                    <IconeWhatsapp className="size-[18px] shrink-0" />
                    Falar no WhatsApp
                  </a>
                ) : (
                  <Link
                    to="/contato"
                    className="btn btn-primary h-12 w-full gap-2.5 px-5 text-sm"
                  >
                    <IconeWhatsapp className="size-[18px] shrink-0" />
                    Falar com a loja
                  </Link>
                )}

                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/estoque"
                      className="inline-flex items-center gap-1.5 text-[1.0625rem] font-semibold text-texto underline decoration-borda-forte underline-offset-4 transition-colors hover:decoration-texto"
                    >
                      Ver outras motos do estoque
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contato"
                      className="inline-flex items-center gap-1.5 text-[1.0625rem] font-semibold text-texto underline decoration-borda-forte underline-offset-4 transition-colors hover:decoration-texto"
                    >
                      Endereço e atendimento
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </li>
                </ul>

                <p className="numeros text-sm text-texto-3">
                  {SITE.endereco.bairro} · {SITE.cidade}, {SITE.estado}
                </p>
              </div>
            </Revelar>
          </div>
        </div>
      </section>

      {/* ============================================================
          OUTRAS MOTOS — lista de duas pontas, sem cartão: nome à
          esquerda, preço à direita, do jeito de um índice de pátio.
          ============================================================ */}
      {recomendadas.length > 0 ? (
        <section aria-labelledby="outras-titulo" className="bg-fundo">
          <div className="container-site py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
              <div>
                <div className="flex items-end justify-between gap-6 lg:block">
                  <h2
                    id="outras-titulo"
                    className="max-w-[12ch] font-display text-[2rem] leading-[1.02] font-bold tracking-[-0.035em] text-texto lg:text-[2.5rem]"
                  >
                    Outras motos no pátio
                  </h2>
                  <Link
                    to="/estoque"
                    className="link-acao inline-flex shrink-0 items-center gap-1.5 lg:mt-7"
                  >
                    Ver estoque
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <ul className="space-y-1">
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
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
