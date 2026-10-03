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
 */
export function useJsonLd(data: object): void {
  const payload = JSON.stringify(data)

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'dgmotos-jsonld'
    script.textContent = payload
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [payload])
}
