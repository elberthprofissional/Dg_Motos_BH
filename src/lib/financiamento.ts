/**
 * ============================================================
 * CONTEÚDO DA PÁGINA /financiamento — leitura e escrita
 * ============================================================
 *
 * O texto da página de financiamento é editável pelo dono em
 * /admin -> Configurações -> "Página de financiamento". A fonte
 * de verdade é a coluna jsonb `financiamento` da tabela
 * `config_loja` (linha id = 1).
 *
 * Filosofia de fallback (a mesma de configLoja.ts): o site nunca
 * fica quebrado. Campo vazio, ausente ou malformado no jsonb cai
 * no texto padrão abaixo — que é exatamente o texto que vive na
 * página hoje. Assim o dono pode editar o que quiser sem jamais
 * derrubar a página.
 */

export interface ConfigFinanciamento {
  /** Título principal (h1) da página. */
  titulo: string
  /** Parágrafo de apoio abaixo do título. */
  subtitulo: string
  /** Título da seção "Como funciona". */
  etapasTitulo: string
  /** As quatro etapas do processo (uma por slot; os ícones são fixos). */
  etapas: { titulo: string; texto: string }[]
  /** Título da seção de transparência. */
  transparenciaTitulo: string
  /** Bullets de transparência. */
  transparenciaItens: string[]
}

/** Texto padrão da página — também é o fallback quando o banco não tem nada. */
export const FINANCIAMENTO_PADRAO: ConfigFinanciamento = {
  titulo: 'Financie com quem conduz o processo com você',
  subtitulo:
    'Trabalhamos com instituições parceiras e acompanhamos cada etapa — da simulação à entrega. Sem prometer o que não depende da gente.',
  etapasTitulo: 'Quatro etapas, sem surpresa',
  etapas: [
    {
      titulo: 'Você escolhe a moto',
      texto: 'Defina o modelo do estoque e nos diga o valor que pretende dar de entrada.',
    },
    {
      titulo: 'Análise de crédito',
      texto:
        'Enviamos seus dados para as instituições parceiras. A aprovação depende da análise delas — sem promessa de aprovação garantida.',
    },
    {
      titulo: 'Condições na mesa',
      texto: 'Você recebe as opções de prazo e parcela e decide com calma, sem pressão.',
    },
    {
      titulo: 'Documentação e entrega',
      texto: 'Com a aprovação, cuidamos da transferência e da entrega da moto.',
    },
  ],
  transparenciaTitulo: 'Sobre a análise de crédito',
  transparenciaItens: [
    'A análise é feita por instituições financeiras parceiras; a DG Motos não aprova crédito.',
    'Consultamos mais de uma instituição para buscar a melhor condição disponível para o seu perfil.',
    'Você recebe as condições por escrito antes de assinar qualquer coisa.',
    'Não há custo para solicitar a análise.',
  ],
}

/** A página sempre tem 4 slots de etapa (um por ícone). */
export const QTD_ETAPAS = 4

/** Campo textual: trim; vazio volta para o padrão. */
function textoOu(valor: unknown, padrao: string): string {
  const t = typeof valor === 'string' ? valor.trim() : ''
  return t === '' ? padrao : t
}

/** Etapa isolada: título e texto têm fallback independentes. */
function etapaOu(valor: unknown, i: number): { titulo: string; texto: string } {
  const obj = (typeof valor === 'object' && valor !== null ? valor : {}) as Record<
    string,
    unknown
  >
  const padrao = FINANCIAMENTO_PADRAO.etapas[i] ?? { titulo: '', texto: '' }
  return {
    titulo: textoOu(obj.titulo, padrao.titulo),
    texto: textoOu(obj.texto, padrao.texto),
  }
}

/**
 * Lê a coluna jsonb e devolve a config completa. Qualquer coisa
 * faltando ou malformada cai no padrão — a página nunca fica sem texto.
 */
export function linhaParaFinanciamento(jsonb: unknown): ConfigFinanciamento {
  const obj = (typeof jsonb === 'object' && jsonb !== null ? jsonb : {}) as Record<
    string,
    unknown
  >

  const etapasBrutas = Array.isArray(obj.etapas) ? obj.etapas : []
  const etapas = Array.from({ length: QTD_ETAPAS }, (_, i) => etapaOu(etapasBrutas[i], i))

  const itensBrutos = Array.isArray(obj.transparenciaItens) ? obj.transparenciaItens : []
  const itens = itensBrutos
    .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    .map((item) => item.trim())

  return {
    titulo: textoOu(obj.titulo, FINANCIAMENTO_PADRAO.titulo),
    subtitulo: textoOu(obj.subtitulo, FINANCIAMENTO_PADRAO.subtitulo),
    etapasTitulo: textoOu(obj.etapasTitulo, FINANCIAMENTO_PADRAO.etapasTitulo),
    etapas,
    transparenciaTitulo: textoOu(
      obj.transparenciaTitulo,
      FINANCIAMENTO_PADRAO.transparenciaTitulo,
    ),
    transparenciaItens: itens.length > 0 ? itens : FINANCIAMENTO_PADRAO.transparenciaItens,
  }
}

/** Formato do formulário do admin (tudo string; vazio = usar o padrão). */
export interface FormFinanciamento {
  titulo: string
  subtitulo: string
  etapasTitulo: string
  etapas: { titulo: string; texto: string }[]
  transparenciaTitulo: string
  /** Um item por linha; linhas vazias são ignoradas. */
  transparenciaItens: string
}

/** Formulário vazio (estado inicial do painel antes de carregar). */
export function formFinanciamentoVazio(): FormFinanciamento {
  return {
    titulo: '',
    subtitulo: '',
    etapasTitulo: '',
    etapas: Array.from({ length: QTD_ETAPAS }, () => ({ titulo: '', texto: '' })),
    transparenciaTitulo: '',
    transparenciaItens: '',
  }
}

/** Popula o formulário do admin a partir da config atual. */
export function financiamentoFormDeConfig(c: ConfigFinanciamento): FormFinanciamento {
  return {
    titulo: c.titulo,
    subtitulo: c.subtitulo,
    etapasTitulo: c.etapasTitulo,
    etapas: c.etapas.map((e) => ({ titulo: e.titulo, texto: e.texto })),
    transparenciaTitulo: c.transparenciaTitulo,
    transparenciaItens: c.transparenciaItens.join('\n'),
  }
}

/** Converte o formulário no jsonb a salvar (string vazia = usa o padrão). */
export function financiamentoFormParaJsonb(f: FormFinanciamento): Record<string, unknown> {
  return {
    titulo: f.titulo.trim(),
    subtitulo: f.subtitulo.trim(),
    etapasTitulo: f.etapasTitulo.trim(),
    etapas: Array.from({ length: QTD_ETAPAS }, (_, i) => {
      const e = f.etapas[i] ?? { titulo: '', texto: '' }
      return { titulo: e.titulo.trim(), texto: e.texto.trim() }
    }),
    transparenciaTitulo: f.transparenciaTitulo.trim(),
    transparenciaItens: f.transparenciaItens
      .split('\n')
      .map((linha) => linha.trim())
      .filter((linha) => linha !== ''),
  }
}
