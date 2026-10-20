import { configPadrao } from './configLoja'
import type { ConfigLoja } from './configLoja'

/**
 * ============================================================
 * PERSISTÊNCIA DAS CONFIGURAÇÕES DA LOJA
 * ============================================================
 *
 * O painel do dono edita WhatsApp, Instagram, endereço e horários
 * diretamente em /admin. A mudança vale na hora para o navegador
 * onde foi salva — sem rebuild.
 *
 * O armazenamento é `localStorage`: um navegador isolado por máquina.
 * É uma escolha deliberada, com limitação conhecida: a config salva
 * aqui vale só para quem abriu o site neste dispositivo. Quando as
 * configurações migrarem para uma tabela do Supabase, a vitrine
 * inteira recebe as mudanças para todos os visitantes — o contrato
 * de `ConfigLoja` não muda, só a fonte.
 *
 * Os dados comerciais versionados em `src/data/site.ts` continuam
 * sendo o fallback de fábrica: `localStorage` vazio ou corrompido
 * degrada para eles, e o site nunca fica sem contato.
 */

const CHAVE = 'dg-motos:config-loja'

/** Config corrente: a salva no navegador ou, sem ela, a de fábrica. */
export function lerSiteConfig(): ConfigLoja {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return configPadrao()
    const salvo = JSON.parse(bruto) as Partial<ConfigLoja>
    // Merge por campo: um schema antigo com campo faltando não derruba
    // a config inteira — o campo ausente volta ao valor de fábrica.
    return { ...configPadrao(), ...salvo }
  } catch {
    // JSON inválido ou storage bloqueado: comportamento de fábrica.
    return configPadrao()
  }
}

/** Salva a config editada no painel. */
export function gravarSiteConfig(config: ConfigLoja): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(config))
  } catch {
    // Storage cheio ou bloqueado (modos privados): a edição ainda vale
    // nesta sessão porque o hook mantém o estado na memória — só não
    // sobrevive a um refresh. Sem exceção estourando na cara do dono.
  }
}

/** Restaura os valores de fábrica (src/data/site.ts). */
export function limparSiteConfig(): void {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // Sem storage não há nada a limpar.
  }
}
