/**
 * Resolve a promessa pendente de uma mensagem CDP.
 *
 * Devolve `true` quando a mensagem era uma resposta (tem `id`) e `false`
 * quando é um evento — aí o chamador repassa aos listeners.
 */
export function resolverPendente(pendentes, mensagem) {
  if (!mensagem.id) return false

  const pendente = pendentes.get(mensagem.id)
  if (!pendente) return false

  pendentes.delete(mensagem.id)
  if (mensagem.error) pendente.reject(new Error(JSON.stringify(mensagem.error)))
  else pendente.resolve(mensagem.result)
  return true
}
