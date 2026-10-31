import { useParams } from 'react-router-dom'
import { useCatalogo } from '../hooks/useCatalogo'
import { useJsonLd } from '../hooks/useJsonLd'
import { useWhatsappLink } from '../hooks/useWhatsappLink'
import { usePageMeta } from '../hooks/usePageMeta'
import { vehicleSchema } from '../lib/schema'
import {
  bikeTitle,
  buildBikeMessage,
  descontoPercentual,
  formatPrice,
  precoEmConferencia,
  precoPareceIncompleto,
  precoRequerConfirmacao,
  resumoPublico,
} from '../lib/format'
import { descricaoDe, gruposDaFicha } from '../lib/ficha'
import { fichaDeReferencia } from '../data/fichasModelo'
import { Button } from '../components/ui/Button'
import { precoDeLista } from './bikedetail/comum'
import { VitrineApp } from './bikedetail/VitrineApp'
import { PalcoDesktop } from './bikedetail/PalcoDesktop'
import { SobreDestaque } from './bikedetail/SobreDestaque'
import { FichaTecnica } from './bikedetail/FichaTecnica'
import { OutrasMotos } from './bikedetail/OutrasMotos'
import { BarraConversao } from './bikedetail/BarraConversao'
import type { Motorcycle } from '../types'

/**
 * ============================================================
 * FICHA DA MOTO — /moto/:slug
 * ============================================================
 * A página orquestra: busca a moto, decide o estado (carregando,
 * não encontrada, sem catálogo), calcula o que a ficha precisa
 * dizer e monta as seções.
 *
 * Cada seção mora em `src/pages/bikedetail/` — o celular e o
 * desktop têm desenhos diferentes o suficiente para não caberem
 * num arquivo só.
 */
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
  const referencia = fichaDeReferencia(bike)
  const usandoReferencia = bike.descricao.trim().length === 0 && referencia != null
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

  return (
    <div className="bg-fundo pt-cabecalho pb-24 sm:pb-0">
      <VitrineApp
        bike={bike}
        titulo={titulo}
        paragrafos={paragrafos}
        usandoReferencia={usandoReferencia}
        referencia={referencia}
      />

      <PalcoDesktop
        bike={bike}
        titulo={titulo}
        valor={valor}
        desconto={desconto}
        precoIncompleto={precoIncompleto}
        precoParaConfirmar={precoParaConfirmar}
        waHref={waHref}
        temFicha={temFicha}
      />

      <SobreDestaque
        temFicha={temFicha}
        destaques={destaques}
        paragrafos={paragrafos}
        usandoReferencia={usandoReferencia}
        referencia={referencia}
      />

      {temFicha ? (
        <FichaTecnica
          titulo={titulo}
          ano={bike.ano}
          introFicha={introFicha}
          gradeGrupos={gradeGrupos}
          grupos={grupos}
          notaFicha={notaFicha}
        />
      ) : null}

      <OutrasMotos recomendadas={recomendadas} />

      <BarraConversao valor={valor} precoIncompleto={precoIncompleto} waHref={waHref} />
    </div>
  )
}
