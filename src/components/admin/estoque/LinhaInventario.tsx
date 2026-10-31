import { Link } from 'react-router-dom'
import { ArchiveRestore, CircleDollarSign, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Motorcycle, MotorcycleStatus } from '../../../types'
import { motoParaFormulario } from '../../../lib/catalog'
import type { MotoParaSalvar } from '../../../lib/catalog'
import { descontoPercentual, formatPrice } from '../../../lib/format'
import { PLACEHOLDER_CARD } from '../../../lib/placeholder'
import { fichaTecnica, rotuloNaLoja } from './comum'

/**
 * ============================================================
 * LINHA DO INVENTÓRIO — uma moto na tabela do painel
 * ============================================================
 * Foto, nome, ficha curta e as ações (vender, editar, excluir). O
 * menu ⋯ vive só no celular (o CSS esconde na mesa); o estado dele
 * fica na aba, para que só um menu fique aberto por vez.
 */
interface LinhaInventarioProps {
  moto: Motorcycle
  menuAberto: boolean
  /** Abre ou fecha o menu ⋯ desta linha. */
  onAlternarMenu: () => void
  /** Fecha o menu antes de a ação ser executada. */
  onFecharMenu: () => void
  onAlterarStatus: (moto: Motorcycle, status: MotorcycleStatus) => void
  onEditando: (v: { id?: string; dados?: MotoParaSalvar } | null) => void
  onPedirExclusao: (moto: Motorcycle) => void
}

export function LinhaInventario({
  moto,
  menuAberto,
  onAlternarMenu,
  onFecharMenu,
  onAlterarStatus,
  onEditando,
  onPedirExclusao,
}: LinhaInventarioProps) {
  const ficha = fichaTecnica(moto)
  const vendida = moto.status === 'vendida'
  // Mesmo selo que o cliente vê no site: no inventário é o que
  // mostra, sem abrir a ficha, que aquela moto está com oferta.
  const desconto = descontoPercentual(moto)
  return (
    <div key={moto.id} className="estoque-linha" role="row">
      <div className="estoque-celula-veiculo" role="cell">
        <div className="estoque-foto">
          <img
            src={moto.imagens[0]?.src ?? PLACEHOLDER_CARD}
            alt={`${moto.marca} ${moto.modelo}, ${moto.ano}`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = PLACEHOLDER_CARD
            }}
          />
        </div>
        <div className="estoque-veiculo-texto">
          {/* O nome é o link da linha inteira: o ::after dele
              cobre o cartão, então qualquer clique fora das
              ações abre a prévia. Menu e ícones ficam acima. */}
          <Link
            to={`/admin/estoque/${moto.id}`}
            className="estoque-nome estoque-nome-link"
            title={`Abrir a prévia de ${moto.marca} ${moto.modelo}`}
          >
            {moto.marca} {moto.modelo}
          </Link>
          <p className="estoque-ficha">
            {ficha.map((item, i) => (
              <span key={i}>
                {item}
                {i < ficha.length - 1 ? (
                  <>
                    {' '}
                    <span className="estoque-ficha-sep" aria-hidden="true">
                      ·
                    </span>{' '}
                  </>
                ) : null}
              </span>
            ))}
          </p>
          {desconto != null ? (
            <span className="mt-1.5 inline-flex items-center gap-1 bg-marca px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
              Oferta
              <span className="numeros" aria-hidden="true">
                −{desconto}%
              </span>
              <span className="sr-only"> {desconto}% de desconto</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Menu ⋯ do cartão: vive só no celular (o CSS esconde
          na mesa). `role="none"` porque é um agrupamento de layout
          dentro da linha, e não uma célula — as ações de verdade
          continuam na coluna Ações. Cada item fecha o menu antes de
          agir, e Excluir passa pela confirmação global. */}
      <div className="estoque-menu-acoes" data-estoque-menu role="none">
        <button
          type="button"
          onClick={() =>
            onAlternarMenu()
          }
          aria-expanded={menuAberto}
          aria-label={`Mais ações de ${moto.marca} ${moto.modelo}`}
          className="estoque-menu-botao"
        >
          <MoreHorizontal className="size-5" strokeWidth={1.7} aria-hidden="true" />
        </button>

        {menuAberto ? (
          <div
            role="group"
            aria-label={`Ações de ${moto.marca} ${moto.modelo}`}
            className="estoque-menu-painel"
          >
            <button
              type="button"
              onClick={() => {
                onFecharMenu()
                onAlterarStatus(moto, vendida ? 'disponivel' : 'vendida')
              }}
              className="estoque-menu-item"
            >
              {vendida ? (
                <ArchiveRestore className="size-4" strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <CircleDollarSign className="size-4" strokeWidth={1.7} aria-hidden="true" />
              )}
              {vendida ? 'Reativar moto' : 'Marcar como vendida'}
            </button>
            <button
              type="button"
              onClick={() => {
                onFecharMenu()
                onEditando({ id: moto.id, dados: motoParaFormulario(moto) })
              }}
              className="estoque-menu-item"
            >
              <Pencil className="size-4" strokeWidth={1.7} aria-hidden="true" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                onFecharMenu()
                onPedirExclusao(moto)
              }}
              className="estoque-menu-item estoque-menu-item-perigo"
            >
              <Trash2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
              Excluir
            </button>
          </div>
        ) : null}
      </div>

      <div className="estoque-celula-loja" role="cell">
        <span className="estoque-loja">{rotuloNaLoja(moto)}</span>
      </div>

      <div className="estoque-celula-valor" role="cell">
        <span className="estoque-preco">{formatPrice(moto.preco)}</span>
      </div>

      <div className="estoque-celula-acoes" role="cell">
        <div className="estoque-acoes">
          <button
            type="button"
            onClick={() => onAlterarStatus(moto, vendida ? 'disponivel' : 'vendida')}
            className="estoque-acao"
            aria-label={
              vendida
                ? `Reativar ${moto.marca} ${moto.modelo}`
                : `Marcar ${moto.marca} ${moto.modelo} como vendida`
            }
            title={vendida ? 'Reativar' : 'Marcar como vendida'}
          >
            {vendida ? (
              <ArchiveRestore className="size-4" strokeWidth={1.7} aria-hidden="true" />
            ) : (
              <CircleDollarSign className="size-4" strokeWidth={1.7} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEditando({ id: moto.id, dados: motoParaFormulario(moto) })}
            className="estoque-acao"
            aria-label={`Editar ${moto.marca} ${moto.modelo}`}
            title="Editar"
          >
            <Pencil className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onPedirExclusao(moto)}
            className="estoque-acao estoque-acao-perigo"
            aria-label={`Excluir ${moto.marca} ${moto.modelo}`}
            title="Excluir"
          >
            <Trash2 className="size-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
