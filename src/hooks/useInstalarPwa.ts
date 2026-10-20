import { useCallback, useEffect, useState } from 'react'

/**
 * ============================================================
 * INSTALAÇÃO DO APP (PWA)
 * ============================================================
 * O navegador só permite abrir o prompt nativo de instalação a partir
 * de um gesto do usuário. O caminho é: capturar o `beforeinstallprompt`
 * (o Chrome/Edge disparam e nós seguramos), guardar o evento e chamar
 * `prompt()` quando o dono tocar em "Instalar".
 *
 * O iOS/Safari não dispara esse evento — lá a instalação é manual
 * (Compartilhar → Adicionar à Tela de Início). Por isso o hook expõe
 * `instrucoesIos` para a tela mostrar o passo a passo em vez de um
 * botão que não faria nada.
 */

/** O evento não está no lib.dom do TypeScript; tipamos o que usamos. */
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface EstadoInstalacao {
  /** O app já está rodando instalado (standalone). */
  instalado: boolean
  /** Há prompt nativo guardado, pronto para usar. */
  podeInstalar: boolean
  /** É iOS/Safari: instalação é manual (Compartilhar → Adicionar). */
  instrucoesIos: boolean
  /** Dispara o prompt nativo (ou no-op quando não há). */
  instalar: () => Promise<void>
}

/** App aberto fora do navegador? (instalado, atalho ou standalone). */
export function estaInstalado(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS expõe isto em vez de `standalone` no matchMedia antigo.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function ehIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS 13+ se passa por Mac; o touch é o desempate.
  const ipad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  return /iPhone|iPad|iPod/.test(ua) || ipad
}

export function useInstalarPwa(): EstadoInstalacao {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null)
  const [instalado, setInstalado] = useState(estaInstalado)
  // iOS é derivado na inicialização: lá não há evento de instalação,
  // então já nasce com as instruções manuais (se ainda não instalado).
  const [instrucoesIos, setInstrucoesIos] = useState(() => ehIos() && !estaInstalado())

  useEffect(() => {
    function onPrompt(e: Event) {
      // Segura o prompt: sem preventDefault o navegador mostraria o
      // próprio banner no momento dele.
      e.preventDefault()
      setEvento(e as EventoInstalacao)
    }

    function onInstalado() {
      setInstalado(true)
      setEvento(null)
      setInstrucoesIos(false)
    }

    // Detecta instalação feita depois do load (ex.: voltou ao app).
    const mq = window.matchMedia('(display-mode: standalone)')
    function onDisplay() {
      if (mq.matches) onInstalado()
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalado)
    mq.addEventListener('change', onDisplay)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalado)
      mq.removeEventListener('change', onDisplay)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!evento) return
    await evento.prompt()
    const escolha = await evento.userChoice
    // Se recusou, o evento não pode ser reaproveitado; o próximo
    // beforeinstallprompt (se vier) recria.
    if (escolha.outcome !== 'accepted') setEvento(null)
  }, [evento])

  return {
    instalado,
    podeInstalar: evento !== null,
    instrucoesIos,
    instalar,
  }
}
