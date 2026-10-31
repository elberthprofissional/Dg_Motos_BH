// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { AuthContexto } from '../hooks/authContexto'
import type { EstadoAuth } from '../hooks/authContexto'
import { RotaAdmin } from './AdminGuard'

/**
 * A guarda do /admin é a única barreira de interface do painel — o RLS
 * do banco é a barreira de verdade, mas é aqui que o dono é
 * redirecionado, esperado ou informado. Cada ramo de decisão vira um
 * teste: sem Supabase, sessão carregando, sem sessão, banco que não
 * respondeu, conta que não é admin e admin de verdade.
 */

function sessaoDe(email = 'dono@dgmotos.test'): Session {
  return { user: { id: 'u1', email } } as unknown as Session
}

function estadoDe(parcial: Partial<EstadoAuth> = {}): EstadoAuth {
  return {
    sessao: null,
    carregando: false,
    disponivel: true,
    admin: null,
    acessoIncerto: false,
    reverificarAcesso: vi.fn(),
    entrar: vi.fn(async () => null),
    sair: vi.fn(async () => undefined),
    enviarReset: vi.fn(async () => null),
    redefinirSenha: vi.fn(async () => null),
    ...parcial,
  }
}

/** Renderiza a guarda dentro das rotas que ela pode alcançar. */
function montar(estado: EstadoAuth, conteudo = 'conteúdo do painel') {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthContexto.Provider value={estado}>
        <Routes>
          <Route
            path="/admin"
            element={
              <RotaAdmin>
                <div>{conteudo}</div>
              </RotaAdmin>
            }
          />
          <Route path="/admin/login" element={<div>tela de login</div>} />
        </Routes>
      </AuthContexto.Provider>
    </MemoryRouter>,
  )
}

describe('RotaAdmin', () => {
  afterEach(cleanup)

  it('sem Supabase configurado explica como habilitar, sem redirecionar', () => {
    montar(estadoDe({ disponivel: false }), 'painel privado')

    expect(screen.getByText('Área restrita desativada')).toBeTruthy()
    expect(screen.getByText('.env.example')).toBeTruthy()
    // Nada de mandar o dev para o login: ali ele acharia que o login quebrou.
    expect(screen.queryByText('tela de login')).toBeNull()
    expect(screen.queryByText('painel privado')).toBeNull()
    expect(screen.getByRole('link', { name: 'Voltar ao site' })).toBeTruthy()
  })

  it('sessão ainda sendo verificada mostra espera e não redireciona', () => {
    montar(estadoDe({ carregando: true }), 'painel privado')

    expect(screen.getByText('Verificando sessão')).toBeTruthy()
    expect(screen.queryByText('tela de login')).toBeNull()
    expect(screen.queryByText('painel privado')).toBeNull()
  })

  it('sem sessão vai para o login', () => {
    montar(estadoDe({ sessao: null, admin: false }), 'painel privado')

    expect(screen.getByText('tela de login')).toBeTruthy()
    expect(screen.queryByText('painel privado')).toBeNull()
  })

  it('sessão válida aguardando a resposta do banco não cai no login', () => {
    montar(estadoDe({ sessao: sessaoDe(), admin: null }), 'painel privado')

    expect(screen.getByText('Verificando acesso ao painel')).toBeTruthy()
    expect(screen.queryByText('tela de login')).toBeNull()
    expect(screen.queryByText('painel privado')).toBeNull()
  })

  it('banco que não respondeu não abre o painel e oferece nova tentativa', () => {
    // Falha fechada: sem "sim" do banco, a conta autenticada não vê o
    // painel — mas também não é expulsa, porque não é um "não".
    const estado = estadoDe({
      sessao: sessaoDe(),
      admin: null,
      acessoIncerto: true,
      reverificarAcesso: vi.fn(),
    })
    montar(estado, 'painel privado')

    expect(screen.getByText('Não consegui confirmar seu acesso')).toBeTruthy()
    expect(screen.queryByText('painel privado')).toBeNull()
    expect(screen.queryByText('tela de login')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(estado.reverificarAcesso).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Sair desta conta' }))
    expect(estado.sair).toHaveBeenCalledTimes(1)
  })

  it('conta autenticada fora da lista de admins não abre o painel e pode sair', () => {
    const estado = estadoDe({ sessao: sessaoDe('fora@dgmotos.test'), admin: false })
    montar(estado, 'painel privado')

    expect(screen.getByText('Esta conta não abre o painel')).toBeTruthy()
    expect(screen.getByText('fora@dgmotos.test')).toBeTruthy()
    expect(screen.queryByText('painel privado')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Sair desta conta' }))
    expect(estado.sair).toHaveBeenCalledTimes(1)
  })

  it('admin de verdade recebe o painel', () => {
    montar(estadoDe({ sessao: sessaoDe(), admin: true }), 'painel privado')

    expect(screen.getByText('painel privado')).toBeTruthy()
    expect(screen.queryByText('tela de login')).toBeNull()
    expect(screen.queryByText('Verificando sessão')).toBeNull()
  })
})
