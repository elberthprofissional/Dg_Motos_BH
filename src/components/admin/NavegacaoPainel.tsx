import { CircleDollarSign, Images, Package, Settings } from 'lucide-react'

export type Aba = 'estoque' | 'vendidas' | 'publicacoes' | 'configuracoes'

interface ItemAba {
  id: Aba
  rotulo: string
  icone: typeof Package
}

/* "Vendidas" é o eco do estoque: toda moto vendida entra aqui, com a
   ficha editável. As fotos de entrega vivem em "Publicações". */
const ABAS: ItemAba[] = [
  { id: 'estoque', rotulo: 'Estoque', icone: Package },
  { id: 'vendidas', rotulo: 'Vendidas', icone: CircleDollarSign },
  { id: 'publicacoes', rotulo: 'Publicações', icone: Images },
  { id: 'configuracoes', rotulo: 'Configurações', icone: Settings },
]

/* Barra inferior do celular: as três áreas de trabalho. Configurações
   — e a Lixeira, dentro dela — vive no menu do avatar, no topo. */
const ABAS_CELLULAR = ABAS.filter((item) => item.id !== 'configuracoes')

interface NavegacaoPainelProps {
  /** Lateral fixa no desktop; barra inferior no celular. */
  variante: 'lateral' | 'inferior'
  aba: Aba
  totalNaLixeira: number
  onTrocarAba: (aba: Aba) => void
}

/**
 * ============================================================
 * NAVEGAÇÃO DO PAINEL
 * ============================================================
 * As duas orientações leem a mesma lista de áreas e o mesmo estado —
 * só o desenho muda: item com rótulo ao lado na lateral, item com
 * indicador superior na barra inferior. Antes eram dois blocos quase
 * iguais, e uma área nova precisava ser lembrada nos dois.
 */
export function NavegacaoPainel({
  variante,
  aba,
  totalNaLixeira,
  onTrocarAba,
}: NavegacaoPainelProps) {
  const itens = variante === 'lateral' ? ABAS : ABAS_CELLULAR

  return (
    <div className={variante === 'lateral' ? 'space-y-0.5' : 'grid grid-cols-3'}>
      {itens.map(({ id, rotulo, icone: Icone }) => {
        const ativa = aba === id
        const selo = id === 'configuracoes' ? totalNaLixeira : 0

        if (variante === 'inferior') {
          // Um item da barra: 64px de área de toque, rótulo no mínimo
          // legível da casa (13px) e indicador superior no ativo.
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTrocarAba(id)}
              aria-current={ativa ? 'page' : undefined}
              className={`foco-painel relative flex min-h-[4rem] flex-1 flex-col items-center justify-center gap-1 pt-2 pb-3 transition-colors ${
                ativa ? 'text-paper' : 'text-steel-500'
              }`}
            >
              {ativa ? (
                <span aria-hidden="true" className="absolute top-0 h-[2px] w-9 bg-brand-500" />
              ) : null}
              <span className="relative">
                <Icone
                  className={`size-[22px] ${ativa ? 'text-steel-300' : ''}`}
                  strokeWidth={ativa ? 2.2 : 1.8}
                  aria-hidden="true"
                />
              </span>
              <span className="text-[13px] leading-none font-medium">{rotulo}</span>
            </button>
          )
        }

        return (
          <button
            key={id}
            type="button"
            onClick={() => onTrocarAba(id)}
            aria-current={ativa ? 'page' : undefined}
            className={`foco-painel nav-item ${
              ativa
                ? 'nav-item-ativo text-paper'
                : 'text-steel-400 hover:bg-claro/[0.03] hover:text-paper'
            }`}
          >
            <Icone
              className={`size-[17px] shrink-0 ${ativa ? 'text-steel-300' : 'text-steel-500'}`}
              strokeWidth={ativa ? 2.2 : 1.8}
              aria-hidden="true"
            />
            <span className="flex-1 truncate">{rotulo}</span>
            {selo > 0 ? <SeloLixeira total={selo} /> : null}
          </button>
        )
      })}
    </div>
  )
}

/** Contador de itens na lixeira, preso ao item de Configurações. */
export function SeloLixeira({ total }: { total: number }) {
  return (
    <span
      title={`${total} na lixeira`}
      className="min-w-5 rounded-full bg-claro/10 px-1.5 py-0.5 text-center text-[11px] leading-none text-steel-300"
    >
      {total}
      <span className="sr-only"> na lixeira</span>
    </span>
  )
}
