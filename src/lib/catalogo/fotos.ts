import { getSupabase, BUCKET_FOTOS } from '../supabase'
import { caminhoDeBucket } from '../fotos'
import { mensagemLixeira } from './leitura'

/**
 * ============================================================
 * CATÁLOGO — fotos e exclusão definitiva
 * ============================================================
 * O que mexe no bucket: apagar de vez uma moto da lixeira e limpar
 * os arquivos que o formulário deixou para trás. Leitura mora em
 * `./leitura`; cadastro, slug e status, em `./escrita`.
 */

export interface ResultadoExclusao {
  ok: boolean
  erro: string | null
  /** A exclusão funcionou, mas sobrou algo para o dono resolver. */
  aviso?: string | null
}

/**
 * Apaga de vez as motos indicadas e limpa os arquivos delas no Storage.
 *
 * Só remove linhas que estejam na lixeira: o filtro protege contra um
 * clique errado em uma moto ativa. As linhas de `motorcycle_images` caem
 * sozinhas (on delete cascade), mas os arquivos no bucket NÃO — por isso
 * buscamos as fotos antes e apagamos cada uma. Sem isso, o bucket
 * acumularia lixo a cada exclusão definitiva.
 *
 * A resposta vai além de ok/erro: se o banco apagou mas o Storage
 * recusou, ou se alguma linha deixou de estar na lixeira entre o clique
 * e o delete, o dono recebe um aviso em vez de um falso "tudo certo".
 */
export async function excluirMotosDefinitivamente(
  ids: string[],
): Promise<ResultadoExclusao> {
  const sb = getSupabase()
  if (!sb) return { ok: false, erro: 'Supabase não configurado.' }
  if (ids.length === 0) return { ok: true, erro: null }

  const { data: fotos, error: erroFotos } = await sb
    .from('motorcycle_images')
    .select('src')
    .in('motorcycle_id', ids)
  if (erroFotos) {
    return {
      ok: false,
      erro: `Não foi possível ler as fotos antes de apagar: ${erroFotos.message}`,
    }
  }

  const { data: apagadas, error } = await sb
    .from('motorcycles')
    .delete()
    .in('id', ids)
    .not('lixeira_em', 'is', null)
    .select('id')
  if (error) return { ok: false, erro: mensagemLixeira(error) }

  const apagadasIds = new Set(((apagadas ?? []) as { id: string }[]).map((linha) => linha.id))
  if (apagadasIds.size === 0) {
    return {
      ok: false,
      erro: 'Nenhuma moto foi apagada. Atualize o painel e tente de novo.',
    }
  }
  const restantes = ids.filter((id) => !apagadasIds.has(id))

  const caminhos = (fotos ?? [])
    .map((f: { src?: string }) => (f.src ? caminhoDeBucket(f.src) : null))
    .filter((c): c is string => c !== null)

  let aviso: string | null = null
  if (caminhos.length > 0) {
    const { error: erroStorage } = await sb.storage.from(BUCKET_FOTOS).remove(caminhos)
    if (erroStorage) {
      aviso = `As fichas saíram do banco, mas ${caminhos.length} foto(s) ficaram no bucket "motos". Remova pelo painel do Supabase.`
    }
  }

  if (restantes.length > 0) {
    const texto = `${restantes.length} moto(s) já não estavam na lixeira e foram mantidas.`
    aviso = aviso ? `${texto} ${aviso}` : texto
  }

  return { ok: true, erro: null, aviso }
}

/** Apaga uma única moto da lixeira (atalho do caso mais comum). */
export async function excluirMotoDefinitivamente(id: string): Promise<ResultadoExclusao> {
  return excluirMotosDefinitivamente([id])
}

/**
 * Apaga do Storage as fotos que saíram do formulário.
 *
 * Roda só depois de `salvarMoto` dar certo. Apagar no clique de "remover"
 * deixaria a moto já gravada apontando para um arquivo que não existe caso
 * o dono cancelasse a edição — a ficha ficaria com imagem quebrada.
 *
 * Fotos locais do seed (`/motos/...`) não estão no bucket e são ignoradas
 * por `caminhoDeBucket`.
 */
export async function excluirFotosRemovidas(
  antes: { src: string }[],
  depois: { src: string }[],
): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  const mantidas = new Set(depois.map((f) => f.src))
  const caminhos = antes
    .map((f) => f.src)
    .filter((src) => !mantidas.has(src))
    .map(caminhoDeBucket)
    .filter((c): c is string => c !== null)

  if (caminhos.length > 0) {
    await sb.storage.from(BUCKET_FOTOS).remove(caminhos)
  }
}

/**
 * Apaga do Storage as fotos enviadas nesta sessão que não chegaram a
 * ser gravadas.
 *
 * É o inverso de `excluirFotosRemovidas`: aqui saem as que estão em
 * `depois` e não estavam em `antes`. Chamada ao cancelar o formulário —
 * o upload acontece antes do "Salvar", então sem isto o arquivo ficaria
 * órfão no bucket sempre que o dono desistisse do cadastro.
 */
export async function excluirFotosAdicionadas(
  antes: { src: string }[],
  depois: { src: string }[],
): Promise<void> {
  const sb = getSupabase()
  if (!sb) return

  const anteriores = new Set(antes.map((f) => f.src))
  const caminhos = depois
    .map((f) => f.src)
    .filter((src) => !anteriores.has(src))
    .map(caminhoDeBucket)
    .filter((c): c is string => c !== null)

  if (caminhos.length > 0) {
    await sb.storage.from(BUCKET_FOTOS).remove(caminhos)
  }
}
