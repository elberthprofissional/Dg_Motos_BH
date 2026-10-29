/**
 * Depois de um deploy, o index novo aponta para chunks com hash novo e
 * a aba que ficou aberta pede um arquivo que não existe mais. Não é um
 * bug da página: recarregar resolve. Detectamos a mensagem do bundler
 * (Chrome, Firefox e Safari têm textos diferentes) para tentar isso
 * antes de mostrar o fallback.
 */
export function falhaDeCarregamento(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \S+ failed/i.test(
    mensagem,
  )
}
