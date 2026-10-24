import { Link, useParams } from 'react-router-dom'
import { ChevronRight, MapPin } from 'lucide-react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useJsonLd } from '../hooks/useJsonLd'
import { useWhatsappLink } from '../hooks/useWhatsappLink'
import { vehicleSchema } from '../lib/schema'
import { buildBikeMessage, descontoPercentual, formatKm, formatPrice } from '../lib/format'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSiteConfig } from '../hooks/siteConfigContexto'
import { BikeGallery } from '../components/motorcycles/BikeGallery'
import { IconeWhatsapp } from '../components/ui/IconeWhatsapp'
import { Button } from '../components/ui/Button'
import { BikeCard } from '../components/motorcycles/BikeCard'
import { Revelar } from '../components/ui/Revelar'

interface LinhaFicha {
  label: string
  value: string
}

function TabelaFicha({ titulo, itens }: { titulo: string; itens: LinhaFicha[] }) {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="pb-2 text-left text-[13px] leading-none font-medium text-texto-3">
        {titulo}
      </caption>
      <tbody>
        {itens.map((item) => (
          <tr key={item.label}>
            <th
              scope="row"
              className="w-[7.5rem] border-t border-borda py-3.5 pr-5 align-top text-[13px] leading-snug font-normal text-texto-3"
            >
              {item.label}
            </th>
            <td
              className={`border-t border-borda py-3.5 align-top text-[15px] leading-snug ${
                item.value === 'Km a confirmar' ? 'text-texto-2' : 'text-texto'
              }`}
            >
              {item.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function BikeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { motos, carregando } = useCatalogo()
  const { config } = useSiteConfig()
  const bike = motos.find((m) => m.slug === slug)

  useJsonLd(bike ? vehicleSchema(bike) : {})

  usePageMeta(
    bike
      ? `${bike.marca} ${bike.modelo} ${bike.ano} | DG Motos`
      : 'Motocicleta não encontrada | DG Motos',
    bike
      ? `${bike.marca} ${bike.modelo} ${bike.ano} seminova na DG Motos, Belo Horizonte. ${formatPrice(bike.preco)}.`
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
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-cabecalho text-center">
        <h1 className="titulo mt-4 text-3xl text-texto sm:text-4xl">
          Motocicleta não encontrada
        </h1>
        <p className="corpo mt-4 max-w-md text-texto-2">
          Essa moto pode já ter sido vendida, ou o endereço do link está errado.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button to="/estoque">Ver as outras motos do estoque</Button>
          <Button to="/contato" variant="outline">
            Falar com a loja
          </Button>
        </div>
      </div>
    )
  }

  const titulo = `${bike.marca} ${bike.modelo}`
  const disponivel = bike.status === 'disponivel'
  const temDescricao = bike.descricao.trim().length > 0
  const desconto = descontoPercentual(bike)
  const precoValor = bike.preco.toLocaleString('pt-BR')
  const resumo = `Motocicleta ${bike.categoria.toLocaleLowerCase('pt-BR')} ${bike.ano}${
    bike.cilindrada ? `, ${bike.cilindrada} cc` : ''
  }, em ${config.enderecoCidadeUf}.`

  const mecanica = bike.especificacoes ?? []
  const temFicha = mecanica.length > 0 || temDescricao
  const recomendadas = motos
    .filter((m) => m.id !== bike.id && m.status === 'disponivel')
    .slice(0, 3)
  return (
    <div className="pt-cabecalho">
      <div className="container-site pt-7 pb-12 lg:pt-10 lg:pb-16">
        <nav
          aria-label="Navegação estrutural"
          className="mb-7 flex flex-wrap items-center gap-1.5 text-[13px] text-texto-3"
        >
          <Link
            to="/"
            className="inline-flex min-h-6 items-center transition-colors hover:text-texto"
          >
            Início
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <Link
            to="/estoque"
            className="inline-flex min-h-6 items-center transition-colors hover:text-texto"
          >
            Estoque
          </Link>
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="text-texto-2">
            {bike.modelo} {bike.ano}
          </span>
        </nav>

        <div className="grid gap-9 md:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] md:items-start md:gap-10 lg:gap-12 xl:gap-16">
          <div className="order-2 md:order-none">
            <BikeGallery
              key={bike.id}
              imagens={bike.imagens}
              titulo={`${titulo} ${bike.ano}`}
            />
          </div>

          <div className="contents md:sticky md:top-[5.75rem] md:col-start-2 md:row-start-1 md:flex md:flex-col md:gap-8">
            <div className="order-1 md:order-none">
              <h1 className="text-balance font-display text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.03em] text-texto lg:text-[3.25rem] xl:text-[3.5rem]">
                {bike.marca} {bike.modelo}
              </h1>
              <p className="mt-3 max-w-[38ch] text-lg leading-relaxed text-texto-2">
                {resumo}
              </p>

              <div className="mt-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
                <div>
                  {/* Em promoção: o "de" riscado por cima e o selo de
                      desconto ao lado do "por" — a oferta lê de longe. */}
                  {desconto != null ? (
                    <p className="numeros mb-1.5 text-base font-medium text-texto-3">
                      <span className="line-through">de {formatPrice(bike.precoAntes ?? bike.preco)}</span>
                    </p>
                  ) : null}
                  <p className="flex flex-wrap items-center gap-3 font-display text-[2.5rem] leading-none font-semibold tracking-[-0.035em] text-texto lg:text-[2.75rem]">
                    <span>
                      <span className="text-[0.44em] font-semibold tracking-normal text-marca-texto">
                        R$
                      </span>
                      <span className="numeros">{precoValor}</span>
                    </span>
                    {desconto != null ? (
                      <span className="numeros rounded-full bg-marca px-2.5 py-1 font-sans text-sm font-bold text-white">
                        -{desconto}%
                      </span>
                    ) : null}
                  </p>
                </div>

                <p className="inline-flex items-center gap-2 pb-1 text-sm text-texto-2">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${disponivel ? 'bg-marca' : 'bg-texto-3'}`}
                  />
                  <span>{disponivel ? 'Disponível no pátio' : 'Indisponível no momento'}</span>
                </p>
              </div>
            </div>

            <div className="order-3 md:order-none">
              {/* Os dados da moto sobem pra cá, em blocos — a tabela lá em
                  baixo não repetia marca/ano/categoria à toa. */}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                <div>
                  <dt className="text-[13px] leading-none text-texto-3">Ano</dt>
                  <dd className="numeros mt-1.5 text-[15px] leading-none font-medium text-texto">
                    {bike.ano}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] leading-none text-texto-3">Quilometragem</dt>
                  <dd className="numeros mt-1.5 text-[15px] leading-none font-medium text-texto">
                    {formatKm(bike.quilometragem)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] leading-none text-texto-3">Categoria</dt>
                  <dd className="mt-1.5 text-[15px] leading-none font-medium text-texto">
                    {bike.categoria}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] leading-none text-texto-3">Cilindrada</dt>
                  <dd className="numeros mt-1.5 text-[15px] leading-none font-medium text-texto">
                    {bike.cilindrada ? `${bike.cilindrada} cc` : 'A confirmar'}
                  </dd>
                </div>
              </dl>

              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-6 h-12 w-full gap-2.5 px-5 text-sm"
                >
                  <IconeWhatsapp className="size-[18px] shrink-0" />
                  Falar no WhatsApp
                </a>
              ) : (
                <Link
                  to="/contato"
                  className="btn btn-primary mt-6 h-12 w-full gap-2.5 px-5 text-sm"
                >
                  <IconeWhatsapp className="size-[18px] shrink-0" />
                  Falar com a loja
                </Link>
              )}

              <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-texto-2">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-texto-3"
                  aria-hidden="true"
                />
                <span>
                  {config.enderecoRua}
                  <br />
                  <span className="text-texto-3">{config.enderecoCidadeUf}</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-painel py-12 sm:py-16">
        <div className="container-site">
          <Revelar className="max-w-[44ch]">
            <h2 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-texto">
              Ficha da moto
            </h2>
            <p className="mt-3 text-base leading-relaxed text-texto-2">
              Detalhes técnicos e observações da loja sobre esta unidade.
            </p>
          </Revelar>

          {temFicha ? (
            <div
              className={`mt-8 grid gap-10 sm:mt-10 ${
                temDescricao && mecanica.length > 0
                  ? 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)] lg:gap-16'
                  : ''
              }`}
            >
              {mecanica.length > 0 ? (
                <Revelar>
                  <TabelaFicha titulo="Conjunto" itens={mecanica} />
                </Revelar>
              ) : null}

              {temDescricao ? (
                <Revelar className="max-w-[52ch]" atraso={mecanica.length > 0 ? 140 : 0}>
                  <h3 className="font-display text-lg leading-tight font-semibold text-texto">
                    Sobre esta moto
                  </h3>
                  <p className="mt-3 text-base leading-[1.65] text-texto-2">
                    {bike.descricao}
                  </p>
                </Revelar>
              ) : null}
            </div>
          ) : (
            <Revelar className="mt-10">
              <div className="max-w-xl rounded-2xl border border-borda bg-fundo/60 p-6">
                <p className="text-sm leading-relaxed text-texto-2">
                  A ficha detalhada dessa unidade ainda não foi publicada.
                  Chama a loja que a gente conta tudo: estado do motor,
                  documentação e histórico.
                </p>
                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary mt-4 h-10 gap-2 px-5 text-sm"
                  >
                    <IconeWhatsapp className="size-4 shrink-0" />
                    Perguntar no WhatsApp
                  </a>
                ) : (
                  <Link to="/contato" className="btn btn-primary mt-4 h-10 px-5 text-sm">
                    Perguntar à loja
                  </Link>
                )}
              </div>
            </Revelar>
          )}
        </div>
      </section>

      {recomendadas.length > 0 ? (
        <section className="bg-fundo py-14 sm:py-20">
          <div className="container-site">
            <Revelar className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-[38ch]">
                <h2 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-texto">
                  Outras motos no pátio
                </h2>
                <p className="mt-3 text-base leading-relaxed text-texto-2">
                  Disponíveis na DG Motos agora.
                </p>
              </div>
              <Link to="/estoque" className="link-acao shrink-0">
                <span>Ver todo o estoque</span>
              </Link>
            </Revelar>

            {/* 3 colunas fixas no desktop: card menor, sem o gigantão
                que sobrava quando só 2 motos estavam disponíveis. */}
            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {recomendadas.map((m, i) => (
                <Revelar key={m.id} className="h-full" atraso={i * 70}>
                  <BikeCard bike={m} />
                </Revelar>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

