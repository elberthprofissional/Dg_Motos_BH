import { MAPS_EMBED_URL } from '../../lib/maps'

interface MapaLojaProps {
  /** Endereço usado no `title` do iframe e no texto alternativo. */
  rotulo: string
  /** Altura do iframe. A home e o /contato usam valores diferentes. */
  className?: string
}

/**
 * Google Maps da loja, em iframe.
 *
 * Compartilhado pela home e pelo /contato para que o mapa, o `title` e as
 * permissões fiquem iguais nos dois lugares. Sem API key: o embed público
 * do Google não precisa de uma, e nada de segredo vai para o bundle.
 */
export function MapaLoja({ rotulo, className = 'h-[300px] sm:h-[400px]' }: MapaLojaProps) {
  return (
    <iframe
      src={MAPS_EMBED_URL}
      title={`Mapa da localização da DG Motos — ${rotulo}`}
      loading="lazy"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className={`block w-full border-0 ${className}`}
    />
  )
}