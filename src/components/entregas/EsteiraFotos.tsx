import { useState, type CSSProperties } from 'react'
import { Pause, Play } from 'lucide-react'

interface EsteiraFotosProps {
  imagens: string[]
  /**
   * Na Home o botão sai de cena e a própria faixa pausa ao toque. Nas
   * páginas onde a esteira é o conteúdo principal, o botão continua.
   */
  controlePausa?: boolean
}

/**
 * Se uma sequência tiver poucas fotos, o trilho fica mais estreito que a
 * tela e a esteira mostraria um vazio no fim do ciclo. Repetir a lista
 * até 12 itens garante que uma volta cubra até telas largas — o clone
 * ao lado fecha o loop.
 */
const MINIMO_POR_SEQUENCIA = 12

function ListaDeFotos({
  imagens,
  unicas,
  clonagem = false,
}: {
  imagens: string[]
  unicas: number
  clonagem?: boolean
}) {
  return (
    <ul
      className={`flex shrink-0 items-center gap-3 pr-3${clonagem ? ' sonhos-clonagem' : ''}`}
      aria-hidden={clonagem || undefined}
    >
      {imagens.map((src, index) => (
        <li key={`${clonagem ? 'clone-' : ''}${index}`} className="w-[10.5rem] shrink-0 sm:w-[14rem]">
          <span className="relative block aspect-[4/5] overflow-hidden bg-painel-2">
            <img
              src={src}
              // A sequência repete as mesmas fotos para fechar o loop; só
              // a primeira volta recebe descrição para não duplicar a
              // leitura no leitor de tela.
              alt={
                !clonagem && index < unicas
                  ? `Entrega realizada pela DG Motos — foto ${index + 1}`
                  : ''
              }
              className="size-full object-cover"
              width={560}
              height={700}
              loading="lazy"
              decoding="async"
            />
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * ============================================================
 * ESTEIRA DE ENTREGAS
 * ============================================================
 * O carrossel grande deixa escolher; a esteira mostra o volume. O
 * movimento só existe quando há fotos suficientes para ele fazer
 * sentido. Pausa ao passar o mouse, ao focar a faixa e no botão —
 * e, com `prefers-reduced-motion`, vira uma fileira rolável.
 */
export function EsteiraFotos({ imagens, controlePausa = true }: EsteiraFotosProps) {
  const [pausada, setPausada] = useState(false)
  const continua = imagens.length >= 4

  const sequencia = continua
    ? Array.from(
        { length: Math.max(imagens.length, MINIMO_POR_SEQUENCIA) },
        (_, index) => imagens[index % imagens.length],
      )
    : imagens

  const estilo = {
    '--sonhos-duracao': `${Math.max(48, sequencia.length * 5)}s`,
  } as CSSProperties

  if (!continua) {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Fotos de entregas realizadas">
        {imagens.map((src, index) => (
          <li key={index} className="relative block aspect-[4/5] overflow-hidden bg-painel-2">
            <img
              src={src}
              alt={`Entrega realizada pela DG Motos — foto ${index + 1}`}
              className="size-full object-cover"
              width={560}
              height={700}
              loading="lazy"
              decoding="async"
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div>
      {controlePausa ? (
        <div className="sonhos-acoes mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setPausada((valor) => !valor)}
            aria-pressed={pausada}
            className="sonhos-controle foco-painel inline-flex min-h-10 items-center gap-2 border border-borda bg-fundo px-3 text-xs font-semibold text-texto-2 transition-colors hover:border-texto-3 hover:text-texto"
          >
            {pausada ? (
              <Play className="size-3.5" aria-hidden="true" />
            ) : (
              <Pause className="size-3.5" aria-hidden="true" />
            )}
            {pausada ? 'Retomar movimento' : 'Pausar movimento'}
          </button>
        </div>
      ) : null}

      <div
        className="sonhos-viewport no-scrollbar w-full overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marca"
        role="group"
        aria-label={
          controlePausa
            ? 'Esteira de fotos de entregas. O movimento pausa ao passar o mouse ou focar a faixa.'
            : 'Fotos de entregas em movimento. Toque ou pressione Enter para pausar ou retomar.'
        }
        tabIndex={0}
        onClick={controlePausa ? undefined : () => setPausada((valor) => !valor)}
        onKeyDown={
          controlePausa
            ? undefined
            : (evento) => {
                if (evento.key === 'Enter' || evento.key === ' ') {
                  evento.preventDefault()
                  setPausada((valor) => !valor)
                }
              }
        }
      >
        <div className="esteira-sonhos flex w-max items-center" style={estilo} data-pausada={pausada}>
          <ListaDeFotos imagens={sequencia} unicas={imagens.length} />
          <ListaDeFotos imagens={sequencia} unicas={imagens.length} clonagem />
        </div>
      </div>
    </div>
  )
}
