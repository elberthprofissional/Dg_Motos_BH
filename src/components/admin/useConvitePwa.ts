import { useCallback, useState } from 'react'
import { ehIos, useInstalarPwa } from '../../hooks/useInstalarPwa'

/**
 * ============================================================
 * CONVITE AUTOMÁTICO DE INSTALAÇÃO
 * ============================================================
 * O dono não vai procurar "Instalar" em Configurações — o convite
 * encontra ele. Regra simples e educada: aparece UMA vez, quando há
 * algo a dizer; quem ignorar ou fechar nunca mais vê.
 *
 *  - Android/Chrome: quando o navegador dispara `beforeinstallprompt`
 *    (o hook `useInstalarPwa` guarda o evento), o cartão aparece com o
 *    botão que dispara o prompt nativo. Sem convite na tela, o próprio
 *    Chrome mostra o banner dele — a "pergunta automática" do Android.
 *  - iOS/Safari: não existe pergunta automática — a Apple não expõe
 *    evento algum. O máximo honesto é o passo a passo (Compartilhar →
 *    Adicionar à Tela de Início) num cartão que some depois de fechado.
 *
 * A recusa é respeitada em dois níveis: fechar o cartão ou dispensar
 * o prompt nativo guardam a decisão no `localStorage`. O app instalado
 * (standalone) nem vê o cartão.
 */

const CHAVE_FECHADO = 'dg-convite-pwa-fechado'

/** O usuário dispensou/fechou o convite em algum momento? */
function jaFechado(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_FECHADO) === '1'
  } catch {
    // Sem localStorage (modo privado restrito): tratamos como não fechado
    // e deixamos a persistência de lado — o pior caso é o cartão voltar.
    return false
  }
}

function guardarFechado(): void {
  try {
    window.localStorage.setItem(CHAVE_FECHADO, '1')
  } catch {
    // Sem persistência, o convite pode reaparecer na próxima sessão.
  }
}

export interface EstadoConvitePwa {
  /** Há convite a mostrar (não instalado, não dispensado, com motivo). */
  visivel: boolean
  /** iOS: sem prompt nativo, só o passo a passo manual. */
  ios: boolean
  /** Dispara o prompt nativo (no-op quando não há — ex.: iOS). */
  instalar: () => Promise<void>
  /** Some para sempre (guarda a recusa no dispositivo). */
  fechar: () => void
}

export function useConvitePwa(): EstadoConvitePwa {
  // `descartado` cobre o clique em "fechar" na hora; `jaFechado()` cobre
  // a sessão seguinte (localStorage). O convite não depende do
  // `podeInstalar`: no Android o cartão aparece quando o navegador
  // oferece o prompt; no iOS, o motivo nasce sozinho.
  const [descartado, setDescartado] = useState(false)
  const { instalado, podeInstalar, instalar } = useInstalarPwa({ conviteAberto: descartado })

  const recusou = descartado || jaFechado()
  const ios = !instalado && !recusou && ehIos()
  const android = !instalado && !recusou && podeInstalar
  const visivel = ios || android

  const fechar = useCallback(() => {
    guardarFechado()
    setDescartado(true)
  }, [])

  const instalarEVigiar = useCallback(async () => {
    await instalar()
    // O Chrome encerra o `beforeinstallprompt` quando o prompt é
    // dispensado (não instalou). Aí o cartão some — e, se o dono
    // tocou no convite e ainda assim dispensou, guardamos a recusa.
    if (!podeInstalar) {
      guardarFechado()
      setDescartado(true)
    }
  }, [instalar, podeInstalar])

  return { visivel, ios, instalar: instalarEVigiar, fechar }
}
