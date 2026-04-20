import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, callEdgeFunction } from './supabase'

interface AuthCtx {
  user: User | null
  loading: boolean
  credits: number
  refreshCredits: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, credits: 0, refreshCredits: async () => {}, signOut: async () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [credits, setCredits] = useState(0)

  const refreshCredits = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    const { data } = await supabase.from('user_credits').select('credits').eq('user_id', u.id).single()
    if (data) setCredits(data.credits)
  }, [])

  const ensureUserCredits = useCallback(async (u: User) => {
    // Fix: use ignoreDuplicates upsert — eliminates the select→insert race condition.
    // If two sessions call this simultaneously, only one insert wins; the other
    // gets error=null but data=[] and falls through to the else branch safely.
    const { data, error } = await supabase
      .from('user_credits')
      .insert({ user_id: u.id, credits: 100, digest_opt_in: false })
      .select('credits')

    if (!error && data && data.length > 0) {
      // Newly created row — first ever login
      await supabase.from('credit_transactions').insert({
        user_id: u.id,
        amount: 100,
        reason: 'Welcome bonus',
      })
      await callEdgeFunction('send-welcome-email', {
        email: u.email,
        name: u.user_metadata?.full_name,
      })
      setCredits(100)
    } else {
      // Row already existed — read current credits
      const { data: existing } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', u.id)
        .single()
      if (existing) setCredits(existing.credits)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) ensureUserCredits(session.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) ensureUserCredits(session.user)
      else setCredits(0)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [ensureUserCredits])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setCredits(0)
  }

  return <Ctx.Provider value={{ user, loading, credits, refreshCredits, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
