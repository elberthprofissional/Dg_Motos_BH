import type { Motorcycle } from '../types'

/**
 * ============================================================
 * CATÁLOGO DE MOTOCICLETAS — DG MOTOS
 * ============================================================
 * A fonte de verdade do estoque é o Supabase (tabela `motorcycles`,
 * lida por `lib/catalogo/leitura.ts`). Este arquivo ficou vazio de
 * propósito: nenhuma moto é setada no código, e a vitrine mostra
 * apenas o que existe no banco.
 *
 * Histórico: os registros de exemplo que viviam aqui foram movidos
 * para `src/test/motos-fixture.ts`, onde servem de fixture para os
 * testes de filtros, formatação e painel.
 *
 * Sem Supabase configurado, o site exibe o estado vazio com
 * honestidade — sem inventar estoque.
 */
export const motorcycles: Motorcycle[] = []
