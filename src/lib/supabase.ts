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
    // ✅ Force token refresh before reading session (fixes ES256 401 errors)
    await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      return { data: null, error: 'Not authenticated' }
    }

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      }
    )

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: 'Unknown error' }))
      return { data: null, error: err.message ?? `HTTP ${resp.status}` }
    }

    return { data: await resp.json() as T, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }
}