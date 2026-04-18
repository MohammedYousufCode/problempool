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
    
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json',
      // Always send anon key — avoids ES256 JWT verification issue
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    }
    
    // Send user token only if available
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    } else {
      headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    }

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`,
      { method: 'POST', headers, body: JSON.stringify(body) }
    )

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: 'Unknown error' }))
      return { data: null, error: err.message ?? `HTTP ${resp.status}` }
    }

    const data = await resp.json()
    return { data: data as T, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }
}
