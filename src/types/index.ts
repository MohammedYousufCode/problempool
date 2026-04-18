export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Feasibility = 'Low' | 'Medium' | 'High'

export interface Domain {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  description: string
  created_at: string
  problem_count?: number
  problems?: { count: number }[]
}

export interface Problem {
  id: string
  title: string
  description: string
  domain_id: string
  domain?: Domain
  difficulty: Difficulty
  feasibility: Feasibility
  who_faces_it: string
  ai_score: number
  submitted_by: string | null
  is_approved: boolean
  created_at: string
  relatable_count?: number
  is_unlocked?: boolean
  relatables?: { count: number }[]
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  reason: string
  created_at: string
}

export interface CreditPack {
  id: string
  name: string
  credits: number
  price: number
  amount_paise: number
  popular?: boolean
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'basic',    name: 'Basic',    credits: 100, price: 49,  amount_paise: 4900 },
  { id: 'standard', name: 'Standard', credits: 300, price: 99,  amount_paise: 9900,  popular: true },
  { id: 'pro',      name: 'Pro',      credits: 700, price: 199, amount_paise: 19900 },
]

export const CREDIT_COSTS = {
  UNLOCK_PROBLEM: 10,
  AI_BUILD_PANEL: 15,
  SEMANTIC_SEARCH: 5,
}