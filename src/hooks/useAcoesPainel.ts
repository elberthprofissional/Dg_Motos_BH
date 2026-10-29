import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  atualizarStatus,
  excluirMotoDefinitivamente,
  excluirMotosDefinitivamente,
  moverParaLixeira,
  restaurarMoto,
} from '../lib/catalog'
import { apagarFotosDaLixeira, restaurarFotoDaLixeira } from '../lib/entregas'
import { useAuth } from './authContexto'
import { useVendas } from './vendasContexto'
import type { Feedback } from '../components/ui/Toast'
import type { PedidoConfirmacao } from '../components/ui/DialogoConfirmacao'
import type { FotoNaLixeira } from '../data/entregas'
import type { Motorcycle, MotorcycleStatus, Venda } from '../types'

interface Opcoes {
  /** Motos na Lixeira — a única lista que o dono pode apagar? */
  naLixeira: Motorcycle[] | null
  fotosLixeira: FotoNaLixeira[] | null
  /** Prévia aberta (`/admin/estoque/:id`) fecha quando a moto sai da lista. */
  previaId: string | null
  recarregar: () => Promise<void>
  recarregarFotosLixeira: () => Promise<void>
  avisar: (feedback: Feedback) => void
}

/**
 * ============================================================
 * AÇÕES DO PAINEL — o que passa por confirmação
 * ============================================================
 * Lixeira (mover, restaurar, apagar de vez, esvaziar), fotos do mural
 * removidas, mudança de status e sair da conta: tudo que mostra um
 * "tem certeza?" e termina num aviso mora neste hook. Admin.tsx fica
 * com só a montagem das telas; o comportamento fica junto e testável.
 *
 * Estado que as telas precisam ver (o pedido de confirmação, o sensor
 * de ocupado, a venda em edição) sai destaqui — pode consumir direto
 * na página e no diálogo.
 */
export function useAcoesPainel({
  naLixeira,
  fotosLixeira,
  previaId,
  recarregar,
  recarregarFotosLixeira,
  avisar,
}: Opcoes) {
  const { sair } = useAuth()
  const { vendas, desvincularVenda } = useVendas()
  const navigate = useNavigate()
  const [confirmacao, setConfirmacao] = useState<PedidoConfirmacao | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  // Venda no diálogo: lançamento logo após sair do pátio, ou correção
  // vinda da aba Vendidas.
  const [vendaAberta, setVendaAberta] = useState<{
    moto: Motorcycle
    venda: Venda | null
  } | null>(null)

  async function concluirAcao(texto: string, aviso?: string | null) {
    await recarregar()
    // Aviso é sucesso parcial (fotos órfãs, linha que já não estava na
    // lixeira): o dono precisa ver, então usa o canal de erro.
    avisar(aviso ? { tipo: 'erro', texto: `${texto} ${aviso}` } : { tipo: 'ok', texto })
  }

  /** Venda lançada para uma moto (null = nunca registrada). */
  const vendaDaMoto = useCallback(
    (motoId: string) => vendas.find((venda) => venda.motoId === motoId) ?? null,
    [vendas],
  )

  /** Clique em "Comprou…" na aba Vendidas. */
  function abrirVenda(moto: Motorcycle) {
    setVendaAberta({ moto, venda: vendaDaMoto(moto.id) })
  }

  /** Excluir no Estoque agora é reversível: a moto vai para a Lixeira. */
  function pedirExclusao(moto: Motorcycle) {
    setConfirmacao({
      titulo: 'Excluir moto',
      descricao: `"${moto.marca} ${moto.modelo} ${moto.ano}" vai para a Lixeira, em Configurações, e pode ser restaurada depois.`,
      rotuloConfirmar: 'Sim',
      rotuloCancelar: 'Não',
      rotuloOcupado: 'Movendo...',
      onConfirmar: async () => {
        setExcluindo(true)
        const r = await moverParaLixeira(moto.id)
        setExcluindo(false)
        setConfirmacao(null)
        if (!r.ok) {
          avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível mover a moto para a lixeira.' })
          return
        }
        if (previaId) navigate('/admin')
        await concluirAcao(`${moto.marca} ${moto.modelo} foi para a Lixeira em Configurações.`)
      },
    })
  }

  async function restaurarDaLixeira(moto: Motorcycle) {
    const r = await restaurarMoto(moto.id)
    if (!r.ok) {
      avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível restaurar a moto.' })
      return
    }
    const destino = moto.status === 'vendida' ? 'Vendidas' : 'o estoque'
    await concluirAcao(`${moto.marca} ${moto.modelo} voltou para ${destino}.`)
  }

  function pedirExclusaoDefinitiva(moto: Motorcycle) {
    setConfirmacao({
      titulo: 'Apagar de vez',
      descricao: `"${moto.marca} ${moto.modelo} ${moto.ano}" e as fotos serão apagadas de vez. Não dá para restaurar depois.`,
      rotuloConfirmar: 'Apagar de vez',
      rotuloOcupado: 'Apagando...',
      onConfirmar: async () => {
        setExcluindo(true)
        const r = await excluirMotoDefinitivamente(moto.id)
        setExcluindo(false)
        setConfirmacao(null)
        if (!r.ok) {
          avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível apagar a moto.' })
          return
        }
        await concluirAcao(`${moto.marca} ${moto.modelo} foi apagada de vez.`, r.aviso)
      },
    })
  }

  /** A foto volta para a publicação de origem e o mural é recarregado. */
  async function restaurarFotoExcluida(foto: FotoNaLixeira) {
    try {
      await restaurarFotoDaLixeira(foto.id)
      await recarregarFotosLixeira()
      avisar({ tipo: 'ok', texto: 'A foto voltou para o mural.' })
    } catch (e) {
      avisar({
        tipo: 'erro',
        texto: e instanceof Error ? e.message : 'Não foi possível restaurar a foto.',
      })
    }
  }

  function pedirApagarFoto(foto: FotoNaLixeira) {
    setConfirmacao({
      titulo: 'Apagar foto de vez',
      descricao:
        'A foto sai do mural e do site. Não dá para restaurar depois.',
      rotuloConfirmar: 'Apagar de vez',
      rotuloOcupado: 'Apagando...',
      onConfirmar: async () => {
        setExcluindo(true)
        try {
          const r = await apagarFotosDaLixeira([foto])
          await recarregarFotosLixeira()
          avisar(
            r.aviso
              ? { tipo: 'erro', texto: `A foto foi apagada de vez. ${r.aviso}` }
              : { tipo: 'ok', texto: 'A foto foi apagada de vez.' },
          )
        } catch (e) {
          avisar({
            tipo: 'erro',
            texto: e instanceof Error ? e.message : 'Não foi possível apagar a foto.',
          })
        } finally {
          setExcluindo(false)
          setConfirmacao(null)
        }
      },
    })
  }

  function pedirEsvaziarLixeira() {
    const motosAlvo = naLixeira ?? []
    const fotosAlvo = fotosLixeira ?? []
    if (motosAlvo.length + fotosAlvo.length === 0) return

    const alvos: string[] = []
    if (motosAlvo.length > 0) {
      alvos.push(
        motosAlvo.length === 1
          ? 'a moto e as fotos dela'
          : `as ${motosAlvo.length} motos e as fotos delas`,
      )
    }
    if (fotosAlvo.length > 0) {
      alvos.push(
        fotosAlvo.length === 1 ? 'a foto do mural' : `as ${fotosAlvo.length} fotos do mural`,
      )
    }

    setConfirmacao({
      titulo: 'Esvaziar a lixeira',
      descricao: `Apaga de vez ${alvos.join(', ')}. Não dá para restaurar depois.`,
      rotuloConfirmar: 'Esvaziar lixeira',
      rotuloOcupado: 'Apagando...',
      onConfirmar: async () => {
        setExcluindo(true)
        const avisos: string[] = []
        let motosOk = true
        let fotosOk = true

        if (motosAlvo.length > 0) {
          const r = await excluirMotosDefinitivamente(motosAlvo.map((moto) => moto.id))
          motosOk = r.ok
          if (r.erro) avisos.push(r.erro)
          if (r.aviso) avisos.push(r.aviso)
          if (r.ok) await recarregar()
        }

        if (fotosAlvo.length > 0) {
          try {
            const r = await apagarFotosDaLixeira(fotosAlvo)
            if (r.aviso) avisos.push(r.aviso)
            await recarregarFotosLixeira()
          } catch (e) {
            fotosOk = false
            avisos.push(
              e instanceof Error ? e.message : 'As fotos não puderam ser apagadas.',
            )
          }
        }

        setExcluindo(false)
        setConfirmacao(null)

        const texto =
          motosOk && fotosOk
            ? 'A lixeira foi esvaziada.'
            : 'A lixeira não foi esvaziada por completo.'
        avisar(
          avisos.length > 0
            ? { tipo: 'erro', texto: `${texto} ${avisos.join(' ')}` }
            : { tipo: 'ok', texto },
        )
      },
    })
  }

  /** Atalho de status: vender ou reativar. */
  async function alterarStatus(moto: Motorcycle, status: MotorcycleStatus) {
    // Vender: o dono confirma antes — a moto sai do site na hora, e
    // o clique errado acontecia sem freio. Errar ainda vira nada:
    // em Vendidas a moto volta com "Devolver ao estoque".
    if (status === 'vendida') {
      setConfirmacao({
        titulo: 'Marcar como vendida',
        descricao: `"${moto.marca} ${moto.modelo} ${moto.ano}" sai do estoque e vai para a aba Vendidas. Se foi clique errado, dá para reverter lá mesmo, com "Devolver ao estoque".`,
        rotuloConfirmar: 'Marcar como vendida',
        rotuloOcupado: 'Marcando...',
        tom: 'neutro',
        onConfirmar: async () => {
          const r = await atualizarStatus(moto.id, 'vendida')
          setConfirmacao(null)
          if (!r.ok) {
            avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível alterar o status.' })
            return
          }
          if (previaId) navigate('/admin')
          await concluirAcao(`${moto.marca} ${moto.modelo} saiu do pátio e já está em Vendidas.`)
          setVendaAberta({ moto, venda: vendaDaMoto(moto.id) })
        },
      })
      return
    }

    const eraVendida = moto.status === 'vendida'
    const r = await atualizarStatus(moto.id, status)
    if (!r.ok) {
      avisar({ tipo: 'erro', texto: r.erro ?? 'Não foi possível alterar o status.' })
      return
    }

    // Vender sai antes, pelo diálogo de confirmação. Aqui só chegam
    // reativação e indisponibilidade.

    // Voltou pro pátio: a venda continua no histórico com a foto dos
    // dados do dia, só sem apontar para a moto à venda de novo.
    if (eraVendida) {
      const motivoDesvinculo = await desvincularVenda(moto.id)
      if (motivoDesvinculo) {
        await recarregar()
        avisar({
          tipo: 'erro',
          texto: `A moto voltou ao pátio, mas a venda não foi desvinculada: ${motivoDesvinculo}`,
        })
        return
      }
    }

    const texto: Record<MotorcycleStatus, string> = {
      disponivel: `${moto.marca} ${moto.modelo} está disponível de novo.`,
      indisponivel: `${moto.marca} ${moto.modelo} foi marcada como indisponível.`,
      vendida: `${moto.marca} ${moto.modelo} saiu do pátio e já está em Vendidas.`,
    }
    await concluirAcao(texto[status])
  }

  /** Sair pede confirmação: o botão fica junto de "Ver o site" e um
      toque errado derrubaria a sessão no meio de uma edição. */
  function pedirSaida() {
    setConfirmacao({
      titulo: 'Sair do painel',
      descricao: 'Você vai precisar entrar de novo com e-mail e senha.',
      rotuloConfirmar: 'Sair',
      tom: 'neutro',
      onConfirmar: async () => {
        setConfirmacao(null)
        await sair()
      },
    })
  }

  return {
    vendas,
    confirmacao,
    fecharConfirmacao: () => setConfirmacao(null),
    /** O diálogo fica "pensando" enquanto a ação roda — o duplo clique morre aqui. */
    ocupado: excluindo,
    vendaAberta,
    fecharVenda: () => setVendaAberta(null),
    vendaSalva: (texto: string) => {
      setVendaAberta(null)
      avisar({ tipo: 'ok', texto })
    },
    abrirVenda,
    pedirExclusao,
    restaurarDaLixeira,
    pedirExclusaoDefinitiva,
    restaurarFotoExcluida,
    pedirApagarFoto,
    pedirEsvaziarLixeira,
    alterarStatus,
    pedirSaida,
  }
}
