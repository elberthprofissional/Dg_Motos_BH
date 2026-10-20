import { useCallback, useState } from 'react'
import { useInstalarPwa } from '../../hooks/useInstalarPwa'

/**
 * Estado compartilhado do "instalar app".
 *
 * Fica num módulo próprio (e não junto dos componentes) porque é um hook:
 * misturar hooks e componentes no mesmo arquivo quebra o Fast Refresh.
 * Desktop e mobile usam este mesmo estado — a lógica de instalação não se
 * duplica entre os dois layouts.
 */
export interface EstadoInstalarApp {
  instalado: boolean
  podeInstalar: boolean
  instrucoesIos: boolean
  instalar: () => Promise<void>
  aberto: boolean
  abrir: () => void
  fechar: () => void
}

export function useInstalarApp(): EstadoInstalarApp {
  const { instalado, podeInstalar, instrucoesIos, instalar } = useInstalarPwa()
  const [aberto, setAberto] = useState(false)
  // `abrir`/`fechar` estáveis: o modal depende de `fechar` na lista de
  // efeito (Esc), e uma função nova a cada render re-registraria o
  // listener sem necessidade.
  const abrir = useCallback(() => setAberto(true), [])
  const fechar = useCallback(() => setAberto(false), [])
  return { instalado, podeInstalar, instrucoesIos, instalar, aberto, abrir, fechar }
}
