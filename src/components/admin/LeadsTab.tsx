import { useMemo, useState } from 'react'
import {
  ChevronDown,
  Download,
  Inbox,
  MessageCircle,
  Phone,
  SearchX,
  SlidersHorizontal,
  StickyNote,
} from 'lucide-react'
import type { Lead, LeadStatus } from '../../lib/leads'
import { atualizarLead, linkWhatsapp, STATUS_LEAD } from '../../lib/leads'
import { statusDoLead } from '../../lib/leads'
import {
  baixarCsv,
  camposLead,
  contarLeadsRecentes,
  filtrarLeads,
  filtrarLeadsPorStatus,
  linhaCsvLead,
  motoDoLead,
  ROTULO_STATUS_LEAD,
  tempoRelativo,
  VARIANTE_STATUS_LEAD,
} from '../../lib/painel'
import type { Motorcycle } from '../../types'
import { Badge } from '../ui/Badge'
import { CampoBusca } from '../ui/CampoBusca'
import { EstadoVazio } from '../ui/EstadoVazio'
import { EsqueletoCabecalho, EsqueletoLinha } from '../ui/Esqueleto'
import { PLACEHOLDER_CARD } from '../../lib/placeholder'

/**
 * Lista de clientes (mini-CRM em cima dos leads).
 *
 * Cada contato ganha status de acompanhamento (novo → negociando →
 * fechou/não fechou) e nota livre do dono. Quando um lead de
 * financiamento é marcado como "fechou negócio", o painel oferece
 * marcar a moto de interesse como vendida no estoque — CRM e estoque
 * ficam conectados sem o dono precisar ir atrás dos dois lugares.
 *
 * ============================================================
 * COMPOSIÇÃO EM TELAS PEQUENAS
 * ============================================================
 * O cartão original era uma linha com avatar, nome, select de status e
 * dois botões. Em 360px isso estourava: o `select` de 160px + avatar de
 * 40px + dois botões de 36px já passavam da largura.
 *
 * Agora o cartão tem duas faixas no celular:
 *  - identification (avatar, nome, telefone, data) e o WhatsApp, que é a
 *    ação que o dono executa 90% das vezes;
 *  - o select de situação e o toggle de detalhe, em 44px, numa linha só.
 *
 * No desktop continua a linha única, porque ali a densidade é aliada.
 */
export function LeadsTab({
  leads,
  motos,
  onMotoVendida,
}: {
  leads: Lead[] | null
  motos: Motorcycle[]
  /** Chamado quando o dono aceita marcar a moto como vendida. */
  onMotoVendida?: (moto: Motorcycle, leadNome: string) => void
}) {
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('todas')
  const [status, setStatus] = useState<LeadStatus | 'todos'>('todos')
  const [aberto, setAberto] = useState<string | null>(null)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  const visiveis = useMemo(
    () =>
      leads === null
        ? []
        : filtrarLeadsPorStatus(filtrarLeads(leads, busca, tipo), status),
    [leads, busca, tipo, status],
  )
  const recentes = useMemo(() => contarLeadsRecentes(leads ?? [], 30), [leads])
  const filtrando = busca.trim() !== '' || tipo !== 'todas' || status !== 'todos'

  const rotuloTipo = tipo === 'todas' ? 'Todos os tipos' : tipo === 'financiamento' ? 'Financiamento' : 'Troca'
  const rotuloStatus =
    status === 'todos' ? 'Todas as situações' : ROTULO_STATUS_LEAD[status]

  async function mudarStatus(lead: Lead, proximo: LeadStatus) {
    const atual = statusDoLead(lead)
    if (proximo === atual) return
    setSalvando(lead.id)
    const r = await atualizarLead(lead.id, { status: proximo })
    setSalvando(null)
    if (!r.ok) return
    // Estado local: evita recarregar a lista inteira do banco.
    lead.status = proximo
    if (proximo === 'fechado') {
      const moto = motoDoLead(lead, motos)
      if (moto && moto.disponibilidade === 'disponivel') {
        onMotoVendida?.(moto, lead.nome)
      }
    }
  }

  async function salvarNota(lead: Lead) {
    const texto = notas[lead.id] ?? ''
    setSalvando(lead.id)
    const r = await atualizarLead(lead.id, { nota: texto })
    setSalvando(null)
    if (r.ok) lead.nota = texto
  }

  function exportarCsv() {
    baixarCsv(
      `clientes-dgmotos-${new Date().toISOString().slice(0, 10)}.csv`,
      visiveis.map((l) => linhaCsvLead(l)),
    )
  }

  function limparFiltros() {
    setBusca('')
    setTipo('todas')
    setStatus('todos')
  }

  /* ---------------------------- Carregando --------------------------- */

  if (leads === null) {
    return (
      <div className="space-y-5">
        <EsqueletoCabecalho />
        <EsqueletoLinha itens={3} />
      </div>
    )
  }

  /* ------------------------------ Vazio ------------------------------ */

  if (leads.length === 0) {
    return (
      <div className="space-y-5">
        <header className="hidden sm:block">
          <h2 className="font-display text-2xl font-semibold tracking-wide text-paper uppercase">
            Clientes
          </h2>
          <p className="mt-1 text-sm text-steel-500">Nenhum contato registrado ainda.</p>
        </header>
        <div className="card">
          <EstadoVazio
            compacto
            icone={<Inbox className="size-4" aria-hidden="true" />}
            titulo="Nenhum cliente ainda"
            descricao="Os formulários de financiamento e troca registram o contato aqui antes de abrir o WhatsApp. Assim o interessado não se perde se a aba do navegador fechar."
            acao={
              /* Ação real, não decorativa: o lead nasce do formulário
                 público de financiamento. Mandar o dono para lá testar o
                 fluxo é o próximo passo concreto. */
              <a href="/financiamento" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                Testar o formulário
              </a>
            }
          />
        </div>
      </div>
    )
  }

  /* ----------------------------- Listagem ---------------------------- */

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div className="hidden sm:block">
          <h2 className="font-display text-2xl font-semibold tracking-wide text-paper uppercase">
            Clientes
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            {leads.length} {leads.length === 1 ? 'contato registrado' : 'contatos registrados'} ·{' '}
            {recentes} nos últimos 30 dias
          </p>
        </div>

        <p className="w-full text-xs text-steel-500 sm:hidden">
          {leads.length} {leads.length === 1 ? 'contato' : 'contatos'} · {recentes} em 30 dias
        </p>

        <button
          type="button"
          onClick={exportarCsv}
          className="btn btn-secondary h-11 w-full sm:h-auto sm:w-auto"
        >
          <Download className="size-4" aria-hidden="true" />
          Exportar CSV
        </button>
      </header>

      {/* Busca sempre visível (filtro de uso constante); tipo e situação
          vão para o painel expansível no celular. */}
      <div className="space-y-2.5">
        <CampoBusca
          value={busca}
          onChange={setBusca}
          placeholder="Buscar por nome ou telefone"
          rotulo="Buscar nos clientes"
        />

        <div className="hidden gap-2 sm:flex">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            aria-label="Filtrar por tipo de solicitação"
            className="select h-10 w-44"
          >
            <option value="todas">Todos os tipos</option>
            <option value="financiamento">Financiamento</option>
            <option value="troca">Troca</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus | 'todos')}
            aria-label="Filtrar por situação"
            className="select h-10 w-44"
          >
            <option value="todos">Todas as situações</option>
            {STATUS_LEAD.map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS_LEAD[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Painel expansível: dois selects de 44px, só quando o dono
            pediu. Fora do desktop porque ali há largura para os dois
            lado a lado. */}
        <div className="sm:hidden">
          <button
            type="button"
            onClick={() => setFiltrosAbertos((v) => !v)}
            aria-expanded={filtrosAbertos}
            aria-controls="clientes-filtros"
            className={`foco-painel flex h-11 w-full items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors ${
              tipo !== 'todas' || status !== 'todos'
                ? 'border-brand-500/40 bg-brand-500/5 text-brand-500'
                : 'border-white/10 bg-night-800 text-steel-300'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {tipo !== 'todas' || status !== 'todos'
                  ? `${rotuloTipo} · ${rotuloStatus}`
                  : 'Filtrar clientes'}
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`size-4 shrink-0 transition-transform ${filtrosAbertos ? 'rotate-180' : ''}`}
            />
          </button>

          {filtrosAbertos && (
            <div id="clientes-filtros" className="animate-fade mt-2 grid gap-2">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                aria-label="Filtrar por tipo de solicitação"
                className="select h-11"
              >
                <option value="todas">Todos os tipos</option>
                <option value="financiamento">Financiamento</option>
                <option value="troca">Troca</option>
              </select>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeadStatus | 'todos')}
                aria-label="Filtrar por situação"
                className="select h-11"
              >
                <option value="todos">Todas as situações</option>
                {STATUS_LEAD.map((s) => (
                  <option key={s} value={s}>
                    {ROTULO_STATUS_LEAD[s]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <div className="card">
          <EstadoVazio
            compacto
            icone={<SearchX className="size-4" aria-hidden="true" />}
            titulo="Nenhum cliente com esses filtros"
            descricao="Ajuste a busca, o tipo ou a situação para ver os outros contatos."
            acao={
              <button type="button" onClick={limparFiltros} className="btn btn-secondary btn-sm">
                Limpar filtros
              </button>
            }
          />
        </div>
      ) : (
        <>
          <p className="text-xs text-steel-600" aria-live="polite">
            {filtrando
              ? `${visiveis.length} de ${leads.length} contatos`
              : `${leads.length} contatos`}
          </p>
          <ul className="space-y-2.5 sm:space-y-2">
            {visiveis.map((lead) => {
              const linhas = camposLead(lead.dados)
              const expandido = aberto === lead.id
              const atual = statusDoLead(lead)
              const moto = motoDoLead(lead, motos)
              const notaSalva = lead.nota ?? ''
              const notaEditada = notas[lead.id] ?? notaSalva

              return (
                <li key={lead.id} className="card overflow-hidden">
                  <div className="p-3 sm:p-4">
                    {/* Faixa de identificação */}
                    <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                      <span
                        aria-hidden="true"
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-sm font-semibold text-steel-300"
                      >
                        {lead.nome.charAt(0).toUpperCase()}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-paper">{lead.nome}</p>
                          <Badge variante={VARIANTE_STATUS_LEAD[atual]} ponto>
                            {ROTULO_STATUS_LEAD[atual]}
                          </Badge>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-steel-500">
                          <a
                            href={linkWhatsapp(lead.telefone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="foco-painel inline-flex items-center gap-1 rounded tabular-nums transition-colors hover:text-paper"
                          >
                            <Phone className="size-3.5" aria-hidden="true" />
                            {lead.telefone}
                          </a>
                          <span aria-hidden="true">·</span>
                          <span>{tempoRelativo(lead.criado_em)}</span>
                          {lead.origem && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{lead.origem}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Ações: no desktop dividem a faixa com a
                          identificação; no celular ficam na faixa de
                          baixo, em tamanho de toque. */}
                      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                        <BotaoDetalhe
                          expandido={expandido}
                          nome={lead.nome}
                          onClick={() => setAberto(expandido ? null : lead.id)}
                        />
                        <a
                          href={linkWhatsapp(lead.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <MessageCircle className="size-4" aria-hidden="true" />
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Faixa de ação — só no celular */}
                    <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3 sm:hidden">
                      <select
                        value={atual}
                        disabled={salvando === lead.id}
                        onChange={(e) => void mudarStatus(lead, e.target.value as LeadStatus)}
                        aria-label={`Situação de ${lead.nome}`}
                        className="select h-11 flex-1 text-sm"
                      >
                        {STATUS_LEAD.map((s) => (
                          <option key={s} value={s}>
                            {ROTULO_STATUS_LEAD[s]}
                          </option>
                        ))}
                      </select>
                      <a
                        href={linkWhatsapp(lead.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Falar com ${lead.nome} no WhatsApp`}
                        className="btn btn-icone size-11 shrink-0"
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                      </a>
                      <BotaoDetalhe
                        expandido={expandido}
                        nome={lead.nome}
                        grande
                        onClick={() => setAberto(expandido ? null : lead.id)}
                      />
                    </div>
                  </div>

                  {expandido && (
                    <div className="space-y-4 border-t border-white/10 bg-night-950/40 px-4 py-4">
                      {/* Moto de interesse, quando dá para identificar */}
                      {moto && (
                        <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
                          <img
                            src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
                            alt=""
                            className="h-12 w-16 shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium tracking-[0.12em] text-steel-500 uppercase">
                              Moto de interesse
                            </p>
                            <p className="truncate text-sm text-paper">
                              {moto.marca} {moto.modelo} {moto.ano}
                            </p>
                          </div>
                          <Badge
                            variante={moto.disponibilidade === 'disponivel' ? 'ok' : 'apagado'}
                            ponto
                          >
                            {moto.disponibilidade === 'disponivel'
                              ? 'No estoque'
                              : moto.disponibilidade === 'reservada'
                                ? 'Reservada'
                                : 'Vendida'}
                          </Badge>
                        </div>
                      )}

                      {linhas.length > 0 && (
                        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                          {linhas.map((linha) => (
                            <div key={linha.chave} className="min-w-0">
                              <dt className="text-[11px] font-medium tracking-[0.12em] text-steel-500 uppercase">
                                {linha.rotulo}
                              </dt>
                              <dd className="mt-1 text-sm break-words text-steel-200">
                                {linha.valor}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      {/* Nota do dono */}
                      <div>
                        <label
                          htmlFor={`nota-${lead.id}`}
                          className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.12em] text-steel-500 uppercase"
                        >
                          <StickyNote className="size-3.5" aria-hidden="true" />
                          Anotação
                        </label>
                        <div className="mt-1.5 flex gap-2">
                          <input
                            id={`nota-${lead.id}`}
                            type="text"
                            className="input flex-1"
                            placeholder="Ex.: manda mensagem terça, entrada dia 5…"
                            value={notaEditada}
                            onChange={(e) =>
                              setNotas((n) => ({ ...n, [lead.id]: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            onClick={() => void salvarNota(lead)}
                            disabled={salvando === lead.id || notaEditada === notaSalva}
                            className="btn btn-secondary btn-sm shrink-0"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

/**
 * Toggle do detalhe do cliente.
 *
 * O `ChevronDown` gira quando expande — a seta é o único indicador de
 * estado, então ela precisa ficar alinhada com o botão de 44px, e não
 * centralizada no meio dele como acontece com `size-9`.
 */
function BotaoDetalhe({
  expandido,
  nome,
  onClick,
  grande = false,
}: {
  expandido: boolean
  nome: string
  onClick: () => void
  grande?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expandido}
      className={`foco-painel btn btn-icone shrink-0 ${grande ? 'size-11' : 'size-9'}`}
      aria-label={expandido ? `Ocultar detalhe de ${nome}` : `Ver detalhe de ${nome}`}
    >
      <ChevronDown
        aria-hidden="true"
        className={`size-4 transition-transform ${expandido ? 'rotate-180' : ''}`}
      />
    </button>
  )
}