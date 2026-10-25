import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Images, X } from 'lucide-react'
import type { EntregaPublicada } from '../data/entregas'
import { useEntregasPublicadas } from '../hooks/useEntregasPublicadas'
import { usePageMeta } from '../hooks/usePageMeta'
import { mesDaEntrega } from '../lib/format'
import { CarrosselFotos } from '../components/entregas/CarrosselFotos'
import { CartaoEntrega } from '../components/entregas/CartaoEntrega'

/**
 * ============================================================
 * ENTREGAS — o mural completo
 * ============================================================
 * A Home mostra só o começo do mural (ver LIMITE_MURAL). Aqui ficam
 * todas as entregas publicadas, e cada post abre num leitor com as
 * fotos no tamanho grande: quem abre um post quer ver a entrega
 * inteira, não a miniatura.
 */
export function Sonhos() {
  const entregas = useEntregasPublicadas()
  const [aberta, setAberta] = useState<EntregaPublicada | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  usePageMeta(
    'Entregas | DG Motos — motos entregues em Belo Horizonte',
    'Veja as motos que a DG Motos já entregou em Belo Horizonte, com as fotos de cada venda.',
  )

  // O <dialog> nativo cuida do modal: foco preso, Esc e retorno de foco.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (aberta && !dialog.open) dialog.showModal()
    if (!aberta && dialog.open) dialog.close()
  }, [aberta])

  // Leitor aberto trava a rolagem do fundo.
  useEffect(() => {
    if (!aberta) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [aberta])

  const mesDaAberta = aberta ? mesDaEntrega(aberta.entregueEm) : null

  return (
    <div className="pt-cabecalho">
      <section className="bg-fundo">
        <div className="container-site pt-10 pb-6 sm:pt-12 sm:pb-8">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-texto-3 uppercase">
            <Images className="size-4" aria-hidden="true" />
            Entregas
          </p>
          <h1 className="display mt-4">Sonhos realizados</h1>
          <p className="lead mt-4 text-texto-2">
            Cada moto que sai daqui vira uma página deste mural.
          </p>
        </div>
      </section>

      <section className="section bg-painel">
        <div className="container-site">
          {entregas.length === 0 ? (
            <div className="border border-borda bg-painel-2 px-6 py-14 text-center">
              <Images className="mx-auto size-7 text-texto-3" aria-hidden="true" />
              <p className="titulo mt-4 text-2xl text-texto">Nenhuma entrega publicada ainda.</p>
              <p className="corpo mx-auto mt-3 max-w-[44ch] text-sm text-texto-2">
                As fotos das entregas aparecem aqui assim que a loja publica cada venda.
              </p>
              <Link to="/estoque" className="btn btn-secondary mt-6 min-h-11 px-5">
                Ver motos disponíveis
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-8 text-sm text-texto-3">
                {entregas.length} {entregas.length === 1 ? 'entrega publicada' : 'entregas publicadas'}
              </p>
              <ul className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {entregas.map((entrega) => (
                  <li key={entrega.id}>
                    <CartaoEntrega entrega={entrega} onVer={setAberta} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <dialog
        ref={dialogRef}
        aria-label={aberta ? `Entrega da ${aberta.moto}` : 'Entrega'}
        onClose={() => setAberta(null)}
        onClick={(evento) => {
          // Clique no fundo (::backdrop) fecha; clique no conteúdo, não.
          if (evento.target === dialogRef.current) setAberta(null)
        }}
        className="m-auto max-h-[92dvh] w-[min(92vw,26rem)] overflow-y-auto border border-borda bg-painel p-0 text-texto backdrop:bg-black/80"
      >
        {aberta ? (
          <article className="relative">
            <button
              type="button"
              onClick={() => setAberta(null)}
              className="absolute top-2 right-2 z-10 grid size-11 place-items-center bg-black/60 text-white transition-colors hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="size-5" aria-hidden="true" />
              <span className="sr-only">Fechar</span>
            </button>

            <div className="aspect-[4/5] w-full">
              <CarrosselFotos imagens={aberta.imagens} moto={aberta.moto} />
            </div>

            <div className="p-4">
              {mesDaAberta ? (
                <p className="text-[11px] font-semibold tracking-[0.12em] text-texto-3 uppercase">
                  {mesDaAberta}
                </p>
              ) : null}
              <h2 className="mt-1.5 font-display text-xl font-semibold text-texto">{aberta.moto}</h2>
              {aberta.nomeCliente ? (
                <p className="mt-1 text-sm text-texto-2">{aberta.nomeCliente}</p>
              ) : null}
              {aberta.depoimento ? (
                <p className="mt-3 text-sm leading-relaxed text-texto-2">{aberta.depoimento}</p>
              ) : null}
            </div>
          </article>
        ) : null}
      </dialog>
    </div>
  )
}
