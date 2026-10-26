import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getSupabase } from '../lib/supabase'
import { resumirVendas, type ResumoVendas } from '../lib/painel'
import type { Venda, VendaParaSalvar } from '../types'

/**
 * Estado das vendas no painel.
 *
 * Carrega uma vez quando o Admin monta; salvar/excluir atualiza a lista
 * em memória. A aba Vendidas e o diálogo da venda leem daqui.
 */
interface VendasContextoValor {
  vendas: Venda[]
  resumo: ResumoVendas
  carregando: boolean
  erro: string | null
  /** Salva (insere ou corrige) e devolve erro para o diálogo mostrar. */
  salvarVenda: (dados: VendaParaSalvar) => Promise<string | null>
  excluirVenda: (id: string) => Promise<string | null>
  /**
   * Desvincula a venda de uma moto que voltou pro pátio. O registro
   * fica no histórico — só deixa de apontar para a moto ativa.
   */
  desvincularVenda: (motoId: string) => Promise<string | null>
}

const VendasContexto = createContext<VendasContextoValor | null>(null)

/**
 * Texto quando a edição de `sales` é recusada em silêncio.
 *
 * A política de UPDATE só existe desde a migração 10: sem ela, o
 * PostgREST devolve 0 linhas (ou `PGRST116` no `.single()`) sem erro
 * nenhum — e o painel mostraria "salvo" sem ter salvo nada.
 */
const ERRO_EDICAO_VENDA =
  'O banco recusou a alteração: aplique a migração 10 (supabase/migrations/10_edicao_de_vendas.sql) no Supabase e tente de novo.'

/** Erro de escrita em `sales` traduzido para algo que dê para seguir. */
function erroDeVenda(error: { code?: string; message: string }, acao: string): string {
  if (error.code === 'PGRST116') return ERRO_EDICAO_VENDA
  return `Não foi possível ${acao}: ${error.message}`
}

interface LinhaVenda {
  id: string
  motorcycle_id: string | null
  marca: string
  modelo: string
  ano: number
  valor: number | string
  forma_pagamento: string
  comprador: string | null
  telefone: string | null
  custo: number | string | null
  vendida_em: string
}

function linhaParaVenda(l: LinhaVenda): Venda {
  return {
    id: l.id,
    motoId: l.motorcycle_id ?? null,
    marca: l.marca,
    modelo: l.modelo,
    ano: Number(l.ano),
    valor: Number(l.valor),
    formaPagamento: l.forma_pagamento as Venda['formaPagamento'],
    comprador: l.comprador ?? null,
    telefone: l.telefone ?? null,
    custo: l.custo == null || l.custo === '' ? null : Number(l.custo),
    vendidaEm: l.vendida_em,
  }
}

export function VendasProvider({ children }: { children: ReactNode }) {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const sb = getSupabase()

  useEffect(() => {
    let vivo = true
    if (!sb) {
      setCarregando(false)
      setErro('Supabase não configurado neste deploy.')
      return
    }

    sb.from('sales')
      .select('*')
      .order('vendida_em', { ascending: false })
      .then(({ data, error }) => {
        if (!vivo) return
        setCarregando(false)
        if (error) {
          setErro(error.message)
          return
        }
        setVendas(((data ?? []) as LinhaVenda[]).map(linhaParaVenda))
      })

    return () => {
      vivo = false
    }
  }, [sb])

  const salvarVenda = useCallback(
    async (dados: VendaParaSalvar): Promise<string | null> => {
      if (!sb) return 'Supabase não configurado.'

      const linha = {
        motorcycle_id: dados.motoId,
        marca: dados.marca,
        modelo: dados.modelo,
        ano: dados.ano,
        valor: dados.valor,
        forma_pagamento: dados.formaPagamento,
        comprador: dados.comprador,
        telefone: dados.telefone,
        custo: dados.custo,
        // `vendida_em` tem default now(), mas mandamos explícito na criação
        // para o teste unitário e o mundo baterem no mesmo instante — e o
        // histórico não depende do fuso do servidor. Na correção a data
        // original é preservada.
        ...(dados.id ? {} : { vendida_em: new Date().toISOString() }),
      }

      const resultado = dados.id
        ? await sb.from('sales').update(linha).eq('id', dados.id).select('*').single()
        : await sb.from('sales').insert(linha).select('*').single()

      if (resultado.error) return erroDeVenda(resultado.error, 'corrigir a venda')

      const salva = linhaParaVenda(resultado.data as LinhaVenda)
      setVendas((atuais) =>
        dados.id ? atuais.map((v) => (v.id === salva.id ? salva : v)) : [salva, ...atuais],
      )
      return null
    },
    [sb],
  )

  const desvincularVenda = useCallback(
    async (motoId: string): Promise<string | null> => {
      if (!sb) return 'Supabase não configurado.'
      if (!motoId) return null

      // `.select` devolve as linhas tocadas: sem ele, uma atualização
      // barrada pelo RLS devolve sucesso silencioso (0 linhas).
      const { data, error } = await sb
        .from('sales')
        .update({ motorcycle_id: null })
        .eq('motorcycle_id', motoId)
        .select('id')

      if (error) return erroDeVenda(error, 'desvincular a venda')
      if (!data || data.length === 0) return ERRO_EDICAO_VENDA

      setVendas((atuais) => atuais.map((v) => (v.motoId === motoId ? { ...v, motoId: null } : v)))
      return null
    },
    [sb],
  )

  const excluirVenda = useCallback(
    async (id: string): Promise<string | null> => {
      if (!sb) return 'Supabase não configurado.'

      const { error } = await sb.from('sales').delete().eq('id', id)
      if (error) return error.message

      setVendas((atuais) => atuais.filter((v) => v.id !== id))
      return null
    },
    [sb],
  )

  const resumo = useMemo(() => resumirVendas(vendas), [vendas])

  const valor = useMemo(
    () => ({ vendas, resumo, carregando, erro, salvarVenda, excluirVenda, desvincularVenda }),
    [vendas, resumo, carregando, erro, salvarVenda, excluirVenda, desvincularVenda],
  )

  return <VendasContexto.Provider value={valor}>{children}</VendasContexto.Provider>
}

export function useVendas(): VendasContextoValor {
  const ctx = useContext(VendasContexto)
  if (!ctx) throw new Error('useVendas deve ser usado dentro de VendasProvider')
  return ctx
}
