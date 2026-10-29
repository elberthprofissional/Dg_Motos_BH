import { useEffect, useRef } from 'react'
import { excluirMotosDefinitivamente } from '../lib/catalog'
import { apagarFotosDaLixeira } from '../lib/entregas'
import type { FotoNaLixeira } from '../data/entregas'
import {
  DIAS_NA_LIXEIRA,
  diasAteApagarDesde,
  motosVencidasNaLixeira,
} from '../lib/painel'
import type { Feedback } from '../components/ui/Toast'
import type { Motorcycle } from '../types'

interface Opcoes {
  naLixeira: Motorcycle[] | null
  fotosLixeira: FotoNaLixeira[] | null
  recarregar: () => Promise<void>
  recarregarFotosLixeira: () => Promise<void>
  onFeedback: (feedback: Feedback) => void
}

/**
 * ============================================================
 * LIMPEZA DA LIXEIRA — o prazo de 30 dias
 * ============================================================
 * Passados 30 dias, motos e fotos do mural saem de vez. A limpeza
 * roda ao abrir o painel — é o único momento em que a sessão do dono
 * tem permissão para apagar no banco e no Storage. A ref garante uma
 * passada por montagem, mesmo com as listas recarregando.
 */
export function useLimpezaLixeira({
  naLixeira,
  fotosLixeira,
  recarregar,
  recarregarFotosLixeira,
  onFeedback,
}: Opcoes) {
  const limpouLixeira = useRef(false)

  useEffect(() => {
    if (limpouLixeira.current || naLixeira === null || fotosLixeira === null) return
    limpouLixeira.current = true

    const motosVencidas = motosVencidasNaLixeira(naLixeira)
    const fotosVencidas = fotosLixeira.filter(
      (foto) => diasAteApagarDesde(foto.apagadaEm) === 0,
    )
    if (motosVencidas.length === 0 && fotosVencidas.length === 0) return

    void (async () => {
      const partes: string[] = []
      const avisos: string[] = []
      let apagados = 0

      if (motosVencidas.length > 0) {
        const r = await excluirMotosDefinitivamente(motosVencidas.map((moto) => moto.id))
        if (r.ok) {
          partes.push(
            motosVencidas.length === 1 ? 'uma moto' : `${motosVencidas.length} motos`,
          )
          apagados += motosVencidas.length
          if (r.aviso) avisos.push(r.aviso)
          await recarregar()
        } else if (r.erro) {
          avisos.push(r.erro)
        }
      }

      if (fotosVencidas.length > 0) {
        try {
          const r = await apagarFotosDaLixeira(fotosVencidas)
          partes.push(
            fotosVencidas.length === 1
              ? '1 foto do mural'
              : `${fotosVencidas.length} fotos do mural`,
          )
          apagados += fotosVencidas.length
          if (r.aviso) avisos.push(r.aviso)
          await recarregarFotosLixeira()
        } catch (e) {
          avisos.push(
            e instanceof Error ? e.message : 'As fotos vencidas não puderam ser apagadas.',
          )
        }
      }

      if (partes.length > 0) {
        const texto = `O prazo de ${DIAS_NA_LIXEIRA} dias venceu: ${partes.join(' e ')} ${
          apagados === 1 ? 'foi apagada' : 'foram apagadas'
        } de vez.`
        onFeedback({
          tipo: avisos.length > 0 ? 'erro' : 'ok',
          texto: avisos.length > 0 ? `${texto} ${avisos.join(' ')}` : texto,
        })
      } else if (avisos.length > 0) {
        onFeedback({ tipo: 'erro', texto: avisos.join(' ') })
      }
    })()
  }, [naLixeira, fotosLixeira, recarregar, recarregarFotosLixeira, onFeedback])
}
