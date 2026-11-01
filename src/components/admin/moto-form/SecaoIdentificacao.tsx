import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { MotoParaSalvar } from '../../../lib/catalog'
import type { Motorcycle } from '../../../types'
import { SeletorMarca } from '../SeletorMarca'
import { campoLinha } from '../campoLinha'
import { ANO_MAXIMO, ANO_MINIMO } from './validacao'
import { Secao } from './Secao'

/**
 * ============================================================
 * 1. IDENTIFICAÇÃO — marca, modelo, ano
 * ============================================================
 * Ordem de cadastro natural: marca, modelo, ano. A marca é o
 * campo grande que abre a folha — o resto são campos comuns.
 */

export function SecaoIdentificacao({
  form,
  onSet,
  estoque,
}: {
  form: MotoParaSalvar
  onSet: <K extends keyof MotoParaSalvar>(chave: K, valor: MotoParaSalvar[K]) => void
  /** Estoque atual — alimenta o seletor rápido de marcas. */
  estoque: Motorcycle[]
}) {
  // Folha de escolha de marca: campo grande → folha com busca.
  const [escolhendoMarca, setEscolhendoMarca] = useState(false)

  return (
    <Secao titulo="Identificação">
      <div>
        <span className="field-label">Marca *</span>
        {/* Campo-espaçoso: um toque abre a folha de marcas. Caixa alta
            de 56px, valor grande — cara de app, não de form de sistema. */}
        <button
          type="button"
          onClick={() => setEscolhendoMarca(true)}
          aria-haspopup="dialog"
          aria-expanded={escolhendoMarca}
          className="foco-painel mt-1 flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 border border-line bg-night-900/40 px-4 text-left transition-colors hover:border-line-forte"
        >
          <span className={`text-[15px] ${form.marca ? 'font-medium text-paper' : 'text-steel-500'}`}>
            {form.marca || 'Escolher a marca'}
          </span>
          <ChevronDown className="size-4 shrink-0 text-steel-500" aria-hidden="true" />
        </button>
        <SeletorMarca
          aberto={escolhendoMarca}
          onFechar={() => setEscolhendoMarca(false)}
          marcasDoEstoque={[...new Set(estoque.map((m) => m.marca))].sort((a, b) =>
            a.localeCompare(b, 'pt-BR'),
          )}
          marcaAtiva={form.marca}
          onEscolher={(marca) => onSet('marca', marca)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-modelo" className="field-label">Modelo *</label>
          <input id="f-modelo" className={campoLinha} value={form.modelo} onChange={(e) => onSet('modelo', e.target.value)} placeholder="XRE 300" />
        </div>
        <div>
          <label htmlFor="f-ano" className="field-label">Ano *</label>
          {/* Ano vazio aparece vazio, não como 0 — 0 é só o estado
              interno enquanto o campo não foi preenchido. */}
          <input
            id="f-ano"
            type="number"
            min={ANO_MINIMO}
            max={ANO_MAXIMO}
            inputMode="numeric"
            className={campoLinha}
            value={form.ano === 0 ? '' : form.ano}
            onChange={(e) => onSet('ano', e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="2022"
          />
        </div>
      </div>
    </Secao>
  )
}
