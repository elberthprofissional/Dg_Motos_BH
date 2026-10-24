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
 * em memória. A aba Vendas e o diálogo de registrar venda leem daqui.
 */
interface VendasContextoValor {
  vendas: Venda[]
  resumo: ResumoVendas
  carregando: boolean
  erro: string | null
  /** Salva (insere) e devolve erro para o diálogo mostrar. */
  salvarVenda: (dados: VendaParaSalvar) => Promise<string | null>
  excluirVenda: (id: string) => Promise<string | null>
}

const VendasContexto = createContext<VendasContextoValor | null>(null)

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

      const { data, error } = await sb
        .from('sales')
        .insert({
          motorcycle_id: dados.motoId,
          marca: dados.marca,
          modelo: dados.modelo,
          ano: dados.ano,
          valor: dados.valor,
          forma_pagamento: dados.formaPagamento,
          comprador: dados.comprador,
          telefone: dados.telefone,
          custo: dados.custo,
          // `vendida_em` tem default now(), mas mandamos explícito para
          // o teste unitário e o mundo baterem no mesmo instante —
          // e o histórico não depende do fuso do servidor.
          vendida_em: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (error) return error.message

      const nova = linhaParaVenda(data as LinhaVenda)
      setVendas((atuais) => [nova, ...atuais])
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
    () => ({ vendas, resumo, carregando, erro, salvarVenda, excluirVenda }),
    [vendas, resumo, carregando, erro, salvarVenda, excluirVenda],
  )

  return <VendasContexto.Provider value={valor}>{children}</VendasContexto.Provider>
}

export function useVendas(): VendasContextoValor {
  const ctx = useContext(VendasContexto)
  if (!ctx) throw new Error('useVendas deve ser usado dentro de VendasProvider')
  return ctx
}
