import { useCallback, useEffect, useMemo, useState } from 'react'
import { buscarCatalogo } from '../lib/catalog'
import type { ResultadoCatalogo } from '../lib/catalog'
import { motosAtivas, motosNaLixeira } from '../lib/painel'
import { buscarFotosNaLixeira } from '../lib/entregas'
import type { FotoNaLixeira } from '../data/entregas'
import type { Motorcycle } from '../types'

/**
 * ============================================================
 * DADOS DO PAINEL — catálogo, lixeira e revisão do mural
 * ============================================================
 * O que o painel mostra vem de duas listas: as motos (com a lixeira,
 * para Configurações) e as fotos do mural que estão na Lixeira. Elas
 * carregam juntas porque o selo do menu conta as duas.
 *
 * `revisao` sobe quando a Lixeira devolve uma foto: a aba Publicações
 * fica montada por baixo e usa o número para recarregar sozinha.
 */
export function useCatalogoAdmin() {
  const [motos, setMotos] = useState<Motorcycle[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [fotosLixeira, setFotosLixeira] = useState<FotoNaLixeira[] | null>(null)
  const [erroFotosLixeira, setErroFotosLixeira] = useState<string | null>(null)
  const [revisao, setRevisao] = useState(0)

  const aplicarResultado = useCallback((r: ResultadoCatalogo) => {
    if (!r.doBanco) {
      setErro(r.erro ?? 'Não foi possível carregar o estoque.')
      setMotos(null)
      return
    }
    setErro(null)
    setMotos(r.motos)
  }, [])

  const recarregar = useCallback(async () => {
    aplicarResultado(await buscarCatalogo({ incluirLixeira: true }))
  }, [aplicarResultado])

  /**
   * Busca as fotos da lixeira e devolve sempre um resultado utilizável:
   * falha vira lista vazia + mensagem (o resto do painel segue de pé),
   * nenhum erro cru passa batido. Quem guarda o resultado (efeito de
   * montagem e recarregamentos) aplica o estado depois da rede — um só
   * caminho de lógica para as duas entradas.
   */
  const buscarFotos = useCallback(async () => {
    try {
      return { lista: await buscarFotosNaLixeira(), erro: null as string | null }
    } catch (e) {
      // Lista vazia mantém a lixeira utilizável (e a limpeza automática
      // rodando); o dono vê o erro só no bloco de fotos.
      return {
        lista: [] as FotoNaLixeira[],
        erro: e instanceof Error
          ? e.message
          : 'Não foi possível abrir as fotos da lixeira.',
      }
    }
  }, [])

  const recarregarFotosLixeira = useCallback(async () => {
    const { lista, erro } = await buscarFotos()
    setFotosLixeira(lista)
    setErroFotosLixeira(erro)
  }, [buscarFotos])
  const recarregarLixeira = useCallback(async () => {
    await Promise.all([recarregar(), recarregarFotosLixeira()])
  }, [recarregar, recarregarFotosLixeira])

  const avisarRevisaoPublicacoes = useCallback(() => {
    setRevisao((atual) => atual + 1)
  }, [])

  useEffect(() => {
    let vivo = true
    void buscarCatalogo({ incluirLixeira: true }).then((r) => {
      if (vivo) aplicarResultado(r)
    })
    return () => {
      vivo = false
    }
  }, [aplicarResultado])

  useEffect(() => {
    let vivo = true
    void buscarFotos().then(({ lista, erro }) => {
      if (!vivo) return
      setFotosLixeira(lista)
      setErroFotosLixeira(erro)
    })
    return () => {
      vivo = false
    }
  }, [buscarFotos])

  // A lixeira sai da vida do painel: contas, pátio e Vendidas usam só as
  // ativas. Assim nenhuma aba precisa repetir essa regra.
  const ativas = useMemo(() => (motos === null ? null : motosAtivas(motos)), [motos])
  const naLixeira = useMemo(() => (motos === null ? null : motosNaLixeira(motos)), [motos])
  // O selo do menu conta motos e fotos: é o que o dono encontra ao abrir.
  const totalNaLixeira = (naLixeira?.length ?? 0) + (fotosLixeira?.length ?? 0)

  return {
    erro,
    fotosLixeira,
    erroFotosLixeira,
    ativas,
    naLixeira,
    totalNaLixeira,
    revisao,
    recarregar,
    recarregarFotosLixeira,
    recarregarLixeira,
    avisarRevisaoPublicacoes,
  }
}
