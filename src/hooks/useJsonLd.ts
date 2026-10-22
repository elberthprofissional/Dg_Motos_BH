import { useEffect } from 'react'

/**
 * Injeta um bloco JSON-LD (schema.org) na <head> enquanto a
 * página estiver montada. Dados estruturados para Google.
 *
 * O script é atualizado sempre que o conteúdo muda de verdade — por
 * exemplo, navegar de /moto/xre-300-2021 para /moto/fazer-150-2020
 * reaproveita o mesmo componente e precisa trocar o schema no <head>,
 * senão o rich snippet do Google descreve a moto anterior.
 *
 * A dependência é o JSON serializado: os schemas são objetos novos a
 * cada render, então comparar por referência reescreveria o <head>
 * sem parar. O payload é pequeno (umas centenas de bytes).
 *
 * O script é reaproveitado pelo `id`, nunca duplicado: as fichas
 * prerenderizadas já chegam com o JSON-LD no HTML (mesmo `id`), e o
 * React atualiza esse bloco em vez de acrescentar um segundo.
 */
const ID_JSON_LD = 'dgmotos-jsonld'

export function useJsonLd(data: object): void {
  const payload = JSON.stringify(data)

  useEffect(() => {
    const existente = document.getElementById(ID_JSON_LD)
    // Página sem dados estruturados (ex.: ficha não encontrada): não
    // deixa no <head> o schema da página anterior.
    if (payload === '{}') {
      existente?.remove()
      return
    }

    const script =
      existente instanceof HTMLScriptElement ? existente : document.createElement('script')

    if (!existente) {
      script.type = 'application/ld+json'
      script.id = ID_JSON_LD
      document.head.appendChild(script)
    }

    script.textContent = payload
    return () => {
      script.remove()
    }
  }, [payload])
}
