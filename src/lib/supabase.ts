import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function callEdgeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`,
      { method: 'POST', headers, body: JSON.stringify(body) }
    )
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: 'Unknown error' }))
      return { data: null, error: err.message ?? 'Request failed' }
    }
    const data = await resp.json()
    return { data: data as T, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }
}