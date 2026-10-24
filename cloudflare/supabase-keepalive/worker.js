/**
 * Keeps a Supabase Free project active with a tiny public catalog read.
 * The Cron Trigger runs outside Supabase, so it can still run if Supabase
 * is unavailable or paused.
 */
export default {
  async scheduled(_controller, env) {
    const supabaseUrl = env.SUPABASE_URL.replace(/\/+$/, '')
    const response = await fetch(
      `${supabaseUrl}/rest/v1/motorcycles?select=id&limit=1`,
      {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          accept: 'application/json',
        },
        signal: AbortSignal.timeout(15_000),
      },
    )

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200)
      throw new Error(`Supabase respondeu ${response.status}: ${detail}`)
    }
  },
}
