/**
 * ============================================================
 * CATÁLOGO — fachada
 * ============================================================
 * O catálogo é grande demais para um arquivo só. A implementação
 * mora em `catalogo/`:
 *
 *   leitura → buscarCatalogo, linhaParaMotos, custo de compra
 *   escrita → salvarMoto, slug, status e lixeira
 *   fotos   → exclusão definitiva e limpeza do bucket
 *
 * Este arquivo existe para os imports não terem que saber disso:
 * `lib/catalog` continua sendo o nome público do módulo.
 */

export type { ResultadoCatalogo } from './catalogo/leitura'
export { buscarCatalogo, buscarCustoCompra, linhaParaMotos } from './catalogo/leitura'

export type { MotoParaSalvar } from './catalogo/escrita'
export {
  atualizarStatus,
  montarSlug,
  motoParaFormulario,
  moverParaLixeira,
  proximoSlug,
  restaurarMoto,
  salvarMoto,
  slugificar,
} from './catalogo/escrita'

export type { ResultadoExclusao } from './catalogo/fotos'
export {
  excluirFotosAdicionadas,
  excluirFotosRemovidas,
  excluirMotoDefinitivamente,
  excluirMotosDefinitivamente,
} from './catalogo/fotos'

export { urlPublica } from './supabase'
