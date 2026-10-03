import type { AuthError } from '@supabase/supabase-js'

/**
 * Mensagens de erro do login.
 *
 * O Supabase responde HTTP 400 para várias causas diferentes (senha
 * errada, e-mail não confirmado, login por e-mail desativado). Mostrar
 * sempre "e-mail ou senha incorretos" deixava o dono sem saber o que
 * fazer — e a causa mais comum aqui é o e-mail não confirmado, que só se
 * resolve no painel do Supabase.
 *
 * `invalid_credentials` continua genérico de propósito: revelar se o
 * e-mail existe permitiria enumerar contas.
 */
export function traduzirErroLogin(error: AuthError): string {
  switch (error.code) {
    case 'email_not_confirmed':
      return 'E-mail ainda não confirmado. Abra o e-mail de confirmação ou marque a conta como confirmada em Authentication → Users, no painel do Supabase.'

    case 'invalid_credentials':
      return 'E-mail ou senha incorretos. Confira se o e-mail é o mesmo usado em Authentication → Users (o login não aceita e-mail com maiúsculas diferentes).'

    case 'email_address_invalid':
    case 'email_address_not_authorized':
      return 'O Supabase não aceitou esse e-mail. Use um e-mail comum (Gmail, Outlook) ou habilite o provedor em Authentication → Providers → Email.'

    case 'signup_disabled':
      return 'O cadastro está desativado neste projeto — o que está correto. A conta do dono precisa ser criada em Authentication → Users.'

    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.'

    case 'user_not_found':
      return 'Não existe usuário com esse e-mail em Authentication → Users.'

    default:
      return `Não foi possível entrar (${error.code}). ${error.message}`
  }
}