import { carregarSupabase } from './supabase'

/**
 * Pergunta ao banco se a conta logada está na lista de administradores.
 *
 * `sou_admin()` (02_seguranca_e_storage.sql) responde só sobre quem
 * está chamando — a lista em `public.admins` continua invisível para a
 * API. Serve para fechar a porta do painel logo no login; a barreira de
 * verdade segue sendo o RLS, que já barra escrita e leitura de quem não
 * é admin.
 *
 * Devolve `null` quando não é possível saber (Supabase fora do ar ou
 * função ainda não criada). Esse `null` é uma falha de leitura, não um
 * "pode entrar": quem chama trata como acesso sem confirmar, e o
 * `AuthProvider` mantém o painel fechado até vir `true`.
 */
export async function consultarSeAdmin(): Promise<boolean | null> {
  const sb = await carregarSupabase()
  if (!sb) return null

  const { data, error } = await sb.rpc('sou_admin')

  if (error) {
    const faltaMigracao = error.code === 'PGRST202' || error.code === '42883'
    console.warn(
      faltaMigracao
        ? 'Checagem de admin indisponível: rode supabase/migrations/02_seguranca_e_storage.sql.'
        : `Não foi possível verificar se a conta é admin: ${error.message}`,
    )
    return null
  }

  return data === true
}
