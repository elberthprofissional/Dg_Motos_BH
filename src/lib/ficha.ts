import type { Motorcycle, MotorcycleSpec, MotorcycleStatus } from '../types'
import { fichaDeReferencia } from '../data/fichasModelo.ts'
import type { GrupoFicha } from '../data/fichasModelo.ts'
import { formatKm } from './format.ts'

/**
 * ============================================================
 * FICHA PÚBLICA — descrição, situação e grupos
 * ============================================================
 * A página em React e o prerender precisam dizer exatamente a mesma
 * coisa sobre a moto. As regras moram aqui, e os dois lados importam
 * daqui — antes o script de build reimplementava tudo por conta própria
 * e podia divergir sem ninguém notar.
 */

/**
 * Parágrafos da descrição pública: o que a loja escreveu manda.
 * Sem texto da loja, entra a ficha da linha; sem ficha, fica em
 * branco — nenhum texto “de apoio” no lugar de quem estava calado.
 */
export function descricaoDe(bike: Motorcycle): string[] {
  const daLoja = String(bike.descricao ?? '').trim()
  if (daLoja) {
    return daLoja
      .split(/\n{2,}/)
      .map((paragrafo) => paragrafo.trim())
      .filter(Boolean)
  }

  return fichaDeReferencia(bike)?.descricao ?? []
}

/** Situação por extenso, para a ficha técnica. */
export function statusLongo(status: MotorcycleStatus): string {
  if (status === 'disponivel') return 'Disponível no pátio'
  if (status === 'vendida') return 'Vendida'
  return 'Indisponível no momento'
}

/**
 * Grupos da ficha: primeiro a unidade, depois a referência da linha.
 *
 * Observações escritas pela loja entram na mesma coluna da unidade,
 * sem repetir um rótulo que os dados do cadastro já cobrem.
 */
export function gruposDaFicha(bike: Motorcycle): GrupoFicha[] {
  const especificacoes = (bike.especificacoes ?? []).filter(
    (spec) => spec?.label?.trim() && spec?.value?.trim(),
  )
  const itens: MotorcycleSpec[] = [
    { label: 'Ano', value: String(bike.ano) },
    { label: 'Quilometragem', value: formatKm(bike.quilometragem) },
    ...(bike.cilindrada ? [{ label: 'Cilindrada', value: `${bike.cilindrada} cc` }] : []),
    { label: 'Situação', value: statusLongo(bike.status) },
  ]

  const rotulos = new Set(itens.map((item) => item.label.toLocaleLowerCase('pt-BR')))
  for (const spec of especificacoes) {
    const chave = spec.label.toLocaleLowerCase('pt-BR')
    if (rotulos.has(chave)) continue
    itens.push({ label: spec.label, value: spec.value })
    rotulos.add(chave)
  }

  return [
    { titulo: 'Esta unidade', itens },
    ...(fichaDeReferencia(bike)?.grupos ?? []),
  ]
}
