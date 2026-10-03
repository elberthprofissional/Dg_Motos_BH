import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bike,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Inbox,
  Package,
  Plus,
  Settings,
  Store,
  Wallet,
} from 'lucide-react'
import type { Motorcycle } from '../../types'
import type { Lead } from '../../lib/leads'
import { linkWhatsapp } from '../../lib/leads'
import { contarLeadsRecentes, resumirEstoque, rotuloTipoLead, tempoRelativo } from '../../lib/painel'
import { formatPrice } from '../../lib/format'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'
import { Badge } from '../ui/Badge'
import { EstadoVazio } from '../ui/EstadoVazio'
import { EsqueletoIndicadores, EsqueletoSecao } from '../ui/Esqueleto'
import type { AbaAdmin } from './tiposAdmin'

/* ------------------------------------------------------------------
 * Indicadores
 *
 * A paleta é neutra de propósito. Só "Disponíveis" é verde, porque é o
 * único dos quatro que é um estado positivo; os demais são contagens, e
 * contagem não é sinal. O que organiza a leitura é a hierarquia — número
 * grande em `tabular-nums`, rótulo em caixa alta, nota discreta — não a
 * cor da caixa.
 *
 * ============================================================
 * COMPOSIÇÃO EM TELAS PEQUENAS
 * ============================================================
 * O card original era: ícone de 40px à esquerda, número em text-3xl, nota
 * embaixo, e um sublinhado decorativo. Em 320px isso dava um card de
 * ~140px de largura com "R$ 1.234.567,00" em 30px — o número estourava.
 *
 * Aqui o mobile tem um layout próprio:
 *  - `grid-cols-2` a partir de 380px, coluna única abaixo disso (360px e
 *    320px não dividem meia tela em dois com um valor monetário dentro);
 *  - o ícone encolhe para 32px e o número cai para text-2xl, porque em
 *    meia coluna o tamanho do número é o que decide se cabe;
 *  - o sublinhado decorativo some no mobile — ele ocupava 10px de altura
 *    para não dizer nada ali.
 * ------------------------------------------------------------------ */

function Indicador({
  rotulo,
  valor,
  nota,
  icone,
  destaque,
  compacto = true,
}: {
  rotulo: string
  valor: string
  nota: string
  icone: ReactNode
  destaque?: 'ok'
  compacto?: boolean
}) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-steel-300 sm:size-10"
        >
          {icone}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium tracking-[0.14em] text-steel-400 uppercase sm:text-[11px]">
            {rotulo}
          </p>
          {/* `valor-moeda` (tabular-nums + tracking apertado) é o que
              impede o "R$" de ser cortado em meia coluna. */}
          <p className="valor-moeda mt-1.5 font-display text-2xl leading-none font-semibold text-paper sm:mt-2 sm:text-3xl">
            {valor}
          </p>
          <p className="mt-1.5 text-[11px] leading-snug text-steel-500 sm:mt-2 sm:text-xs">
            {nota}
          </p>
        </div>
      </div>
      {compacto && (
        <span
          aria-hidden="true"
          className={`mt-3 hidden h-0.5 w-10 rounded-full sm:block ${destaque === 'ok' ? 'bg-ok' : 'bg-white/10'}`}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------
 * Atalhos
 *
 * No desktop é uma lista vertical estreita, ao lado do card de status.
 * No celular essa mesma lista vira um grid de dois: quatro itens de
 * ~150px de largura são maiores que a metade da tela, e o dono chega
 * neles com o polegar sem precisar rolar.
 * ------------------------------------------------------------------ */

function ItemAtalho({
  icone,
  rotulo,
  descricao,
  onClick,
  destaque,
  para,
}: {
  icone: ReactNode
  rotulo: string
  descricao: string
  onClick?: () => void
  destaque?: boolean
  para?: string
}) {
  const conteudo = (
    <>
      <span
        aria-hidden="true"
        className={`grid size-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 ${
          destaque ? 'text-brand-500' : 'text-steel-400'
        }`}
      >
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-steel-200">{rotulo}</span>
        <span className="block truncate text-[11px] text-steel-600">{descricao}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-steel-600" aria-hidden="true" />
    </>
  )

  const classes =
    'item-linha foco-painel flex-col items-start gap-2 border border-white/10 bg-night-800/40 p-3 transition-colors hover:border-white/20 hover:bg-white/5 sm:flex-row sm:items-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-2.5 sm:hover:bg-white/[0.04]'

  if (para) {
    return (
      <li>
        <Link to={para} className={classes}>
          {conteudo}
        </Link>
      </li>
    )
  }
  return (
    <li>
      <button type="button" onClick={onClick} className={classes}>
        {conteudo}
      </button>
    </li>
  )
}

/* ------------------------------------------------------------------
 * Dashboard
 * ------------------------------------------------------------------ */

export function DashboardTab({
  motos,
  leads,
  carregando,
  onNavegar,
  onNovaMoto,
}: {
  motos: Motorcycle[] | null
  leads: Lead[] | null
  carregando: boolean
  onNavegar: (aba: AbaAdmin) => void
  onNovaMoto: () => void
}) {
  const resumo = useMemo(() => resumirEstoque(motos ?? []), [motos])
  const leadsRecentes = useMemo(() => contarLeadsRecentes(leads ?? [], 30), [leads])

  const statusEstoque = useMemo(() => {
    const base = [
      { rotulo: 'Disponíveis', quantidade: resumo.disponiveis, cor: 'bg-ok', vazio: false },
      { rotulo: 'Reservadas', quantidade: resumo.reservadas, cor: 'bg-white/25', vazio: false },
      { rotulo: 'Vendidas', quantidade: resumo.vendidas, cor: 'bg-white/10', vazio: true },
    ]
    return base.map((linha) => ({
      ...linha,
      largura: resumo.total === 0 ? 0 : Math.round((linha.quantidade / resumo.total) * 100),
    }))
  }, [resumo])

  /**
   * Só entra no painel se o banco tiver `created_at`. O fallback de
   * `src/data/motorcycles.ts` não tem essa coluna — melhor esconder a
   * seção do que mostrar "recém cadastrada" com data inventada.
   */
  const recentes = useMemo(() => {
    if (!motos) return []
    const comData = motos
      .filter((m) => Boolean(m.criadoEm))
      .sort((a, b) => Date.parse(b.criadoEm ?? '') - Date.parse(a.criadoEm ?? ''))
    return comData.slice(0, 4)
  }, [motos])

  const mostrarIndicadores = motos !== null && leads !== null

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Cabeçalho da página.
          No celular o título some: a topbar já mostra "Painel" e repetir
          a palavra aqui empurrava os indicadores para baixo sem
          informar nada. */}
      <header className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div className="hidden min-w-0 sm:block">
          <h2 className="font-display text-2xl font-semibold tracking-wide text-paper uppercase">
            Visão geral
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            {carregando
              ? 'Carregando dados do estoque…'
              : `${resumo.total} ${resumo.total === 1 ? 'moto cadastrada' : 'motos cadastradas'} · ${leadsRecentes} ${leadsRecentes === 1 ? 'lead' : 'leads'} nos últimos 30 dias`}
          </p>
        </div>

        {/* No celular a contagem vira uma linha própria e o botão ocupa a
            largura toda — 44px de altura, fácil de acertar. */}
        <p
          className="order-2 w-full text-xs text-steel-500 sm:order-none sm:hidden"
          aria-live="polite"
        >
          {carregando
            ? 'Carregando…'
            : `${resumo.total} ${resumo.total === 1 ? 'moto' : 'motos'} · ${leadsRecentes} ${leadsRecentes === 1 ? 'lead' : 'leads'} em 30 dias`}
        </p>

        <button type="button" onClick={onNovaMoto} className="btn btn-primary w-full sm:w-auto">
          <Plus className="size-4" aria-hidden="true" />
          Nova moto
        </button>
      </header>

      {mostrarIndicadores ? (
        /* Duas colunas a partir de 380px. Abaixo disso, coluna única:
           320px dividido em duas deixa 136px por card, e "R$ 45.000,00"
           em text-2xl não cabe. */
        <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          <Indicador
            rotulo="Cadastradas"
            valor={String(resumo.total)}
            nota="no banco"
            icone={<Bike className="size-4 sm:size-5" aria-hidden="true" />}
          />
          <Indicador
            rotulo="Disponíveis"
            valor={String(resumo.disponiveis)}
            nota={resumo.total === 0 ? 'sem cadastro' : `${Math.round((resumo.disponiveis / resumo.total) * 100)}% do estoque`}
            icone={<Package className="size-4 sm:size-5" aria-hidden="true" />}
            destaque="ok"
          />
          <Indicador
            rotulo="Valor à venda"
            valor={formatPrice(resumo.valorDisponivel)}
            nota="somando as disponíveis"
            icone={<Wallet className="size-4 sm:size-5" aria-hidden="true" />}
          />
          <Indicador
            rotulo="Leads"
            valor={String(leadsRecentes)}
            nota="últimos 30 dias"
            icone={<CalendarDays className="size-4 sm:size-5" aria-hidden="true" />}
          />
        </div>
      ) : (
        <EsqueletoIndicadores />
      )}

      {/* No celular as seções empilham por frequência de uso: leads primeiro
          (é o que o dono abre para responder alguém), depois status,
          depois atalhos. No desktop voltam para a grade 2/1, que dá ao
          bloco principal o dobro de largura. */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Últimos leads */}
        <section className="painel-secao lg:col-span-2" aria-labelledby="ult-leads">
          <div className="painel-cabecalho">
            <h3 id="ult-leads" className="painel-titulo">
              Últimos leads
            </h3>
            {leads !== null && leads.length > 0 && (
              <button
                type="button"
                onClick={() => onNavegar('clientes')}
                className="foco-painel inline-flex shrink-0 items-center gap-1 rounded text-xs font-medium text-steel-400 transition-colors hover:text-paper"
              >
                Ver todos
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {leads === null ? (
            <EsqueletoSecao className="p-4 sm:p-5" linhas={3} />
          ) : leads.length === 0 ? (
            <EstadoVazio
              compacto
              icone={<Inbox className="size-4" aria-hidden="true" />}
              titulo="Nenhum lead ainda"
              descricao="Os contatos dos formulários de financiamento e troca aparecem aqui assim que chegam."
              acao={
                /* Ação contextual de verdade: a origem dos leads é o
                   formulário de financiamento. Mandar o dono para lá
                   fechar o cadastro do WhatsApp é o próximo passo real,
                   não um "saiba mais" decorativo. */
                <button
                  type="button"
                  onClick={() => onNavegar('config')}
                  className="btn btn-secondary btn-sm"
                >
                  <Settings className="size-3.5" aria-hidden="true" />
                  Cadastrar WhatsApp
                </button>
              }
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {leads.slice(0, 5).map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-white/5 text-xs font-semibold text-steel-300"
                  >
                    {lead.nome.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-paper">{lead.nome}</p>
                    <p className="truncate text-xs text-steel-500">
                      {rotuloTipoLead(lead.tipo)} · {tempoRelativo(lead.criado_em)}
                    </p>
                  </div>
                  <a
                    href={linkWhatsapp(lead.telefone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Falar com ${lead.nome} no WhatsApp`}
                    className="foco-painel btn btn-icone"
                  >
                    <span className="sr-only">Falar com {lead.nome} no WhatsApp</span>
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Distribuição + atalhos */}
        <div className="space-y-4">
          <section className="painel-secao" aria-labelledby="dist-status">
            <h3 id="dist-status" className="painel-cabecalho painel-titulo">
              Estoque por status
            </h3>
            {motos === null ? (
              <EsqueletoSecao className="p-4 sm:p-5" linhas={3} />
            ) : resumo.total === 0 ? (
              <EstadoVazio
                compacto
                icone={<Package className="size-4" aria-hidden="true" />}
                titulo="Sem motos cadastradas"
                descricao="Cadastre a primeira moto para o estoque aparecer aqui."
                className="!py-6"
              />
            ) : (
              /* Uma barra empilhada + legenda em vez de três barras
                 empilhadas: em 320px a versão anterior ocupava 180px de
                 altura para dizer "8 de 12". Aqui são 44px, com a mesma
                 informação. */
              <div className="p-4 sm:p-5">
                <div
                  className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/5"
                  role="img"
                  aria-label={statusEstoque
                    .map((l) => `${l.rotulo}: ${l.quantidade} de ${resumo.total}`)
                    .join(', ')}
                >
                  {statusEstoque
                    .filter((l) => l.quantidade > 0)
                    .map((linha) => (
                      <span
                        key={linha.rotulo}
                        className={`block h-full first:rounded-l-full last:rounded-r-full ${linha.cor}`}
                        style={{ width: `${linha.largura}%` }}
                      />
                    ))}
                </div>

                <ul className="mt-4 grid grid-cols-3 gap-2">
                  {statusEstoque.map((linha) => (
                    <li key={linha.rotulo}>
                      <span className="flex items-center gap-1.5 text-[11px] text-steel-500">
                        <span
                          aria-hidden="true"
                          className={`size-1.5 shrink-0 rounded-full ${linha.cor}`}
                        />
                        {linha.rotulo}
                      </span>
                      <span className="mt-0.5 block font-display text-lg font-semibold text-paper tabular-nums">
                        {linha.quantidade}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="painel-secao" aria-labelledby="acoes-rapidas">
            <h3 id="acoes-rapidas" className="painel-cabecalho painel-titulo">
              Atalhos
            </h3>
            <ul className="grid grid-cols-2 gap-2 p-3 sm:block sm:space-y-0.5 sm:p-2">
              <ItemAtalho
                icone={<Plus className="size-4" aria-hidden="true" />}
                rotulo="Nova moto"
                descricao="Cadastrar"
                destaque
                onClick={onNovaMoto}
              />
              <ItemAtalho
                icone={<Bike className="size-4" aria-hidden="true" />}
                rotulo="Estoque"
                descricao="Gerenciar"
                onClick={() => onNavegar('estoque')}
              />
              <ItemAtalho
                icone={<Store className="size-4" aria-hidden="true" />}
                rotulo="Dados da loja"
                descricao="Configurar"
                onClick={() => onNavegar('config')}
              />
              <ItemAtalho
                icone={<ExternalLink className="size-4" aria-hidden="true" />}
                rotulo="Vitrine"
                descricao="Ver no site"
                para="/estoque"
              />
            </ul>
          </section>
        </div>
      </div>

      {/* Últimas cadastradas — só com dado real de created_at */}
      {recentes.length > 0 && (
        <section className="painel-secao" aria-labelledby="ult-cadastradas">
          <div className="painel-cabecalho">
            <h3 id="ult-cadastradas" className="painel-titulo">
              Últimas cadastradas
            </h3>
            <button
              type="button"
              onClick={() => onNavegar('estoque')}
              className="foco-painel inline-flex shrink-0 items-center gap-1 rounded text-xs font-medium text-steel-400 transition-colors hover:text-paper"
            >
              Ver estoque
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <ul className="divide-y divide-white/5">
            {recentes.map((moto) => (
              <li key={moto.id}>
                {/* A linha inteira é o alvo do toque. Antes era só a
                    miniatura que não levava a lugar nenhum. */}
                <Link
                  to={`/moto/${moto.slug}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] sm:px-5"
                >
                  <img
                    src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                    alt=""
                    loading="lazy"
                    className="h-12 w-16 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-paper">
                      {moto.marca} {moto.modelo}
                      <span className="ml-1.5 font-normal text-steel-500">{moto.ano}</span>
                    </p>
                    <p className="truncate text-xs text-steel-500">
                      {moto.criadoEm ? `cadastrada ${tempoRelativo(moto.criadoEm)}` : ''}
                    </p>
                  </div>
                  <Badge variante={moto.disponibilidade === 'disponivel' ? 'ok' : 'apagado'} ponto>
                    {moto.disponibilidade === 'disponivel'
                      ? 'Disponível'
                      : moto.disponibilidade === 'reservada'
                        ? 'Reservada'
                        : 'Vendida'}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}