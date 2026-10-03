import { describe, expect, it } from 'vitest'
import type { AuthError } from '@supabase/supabase-js'
import { traduzirErroLogin } from './authErros'

const erro = (code: string, message = ''): AuthError =>
  ({ code, message, status: 400 }) as AuthError

describe('traduzirErroLogin', () => {
  it('não revela se o e-mail existe em credencial inválida', () => {
    // Enumerar contas seria o efeito colateral de dizer "e-mail não existe".
    expect(traduzirErroLogin(erro('invalid_credentials'))).not.toMatch(/não existe/i)
  })

  it('explica e-mail não confirmado, que só se resolve no painel', () => {
    const msg = traduzirErroLogin(erro('email_not_confirmed'))
    expect(msg).toMatch(/confirmado/i)
    expect(msg).toContain('Authentication')
  })

  it('aponta o cadastro desativado para o caminho certo', () => {
    const msg = traduzirErroLogin(erro('signup_disabled'))
    expect(msg).toMatch(/Authentication → Users/)
  })

  it('pede espera em caso de rate limit em vez de sugerir senha errada', () => {
    expect(traduzirErroLogin(erro('over_request_rate_limit'))).toMatch(/Espere um minuto/)
  })

  it('inclui o código em erros desconhecidos para não engolir a causa', () => {
    const msg = traduzirErroLogin(erro('algo_novo', 'detalhe do servidor'))
    expect(msg).toContain('algo_novo')
    expect(msg).toContain('detalhe do servidor')
  })
})