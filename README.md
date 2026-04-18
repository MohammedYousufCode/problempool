# ProblemPool

> **India's #1 Problem Statement Platform** — [problempool.tech](https://problempool.tech)

ProblemPool is a curated marketplace of real-world problem statements from across India. Founders, developers, and product managers use it to find validated problems worth building on — complete with AI scoring, full context, and AI-generated build plans.

---

## Live App

🌐 **[problempool.tech](https://problempool.tech)**

---

## What it does

- **Browse** AI-validated problem statements across 9 Indian market domains
- **Unlock** full problem details — who faces it, why it matters, feasibility
- **Get AI build plans** — tech stacks, timelines, and MVP roadmaps
- **Submit** real problems you've observed and earn credits
- **Vote** with "I face this too" to surface the most relatable problems

---

## Tech Stack

| | |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Custom CSS design system (dark/light mode) |
| Routing | React Router DOM v6 |
| Auth | Supabase Auth — Google OAuth + email/password |
| Database | Supabase (PostgreSQL) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Payments | Razorpay (INR, one-time credit packs) |
| AI | GroqAI via Edge Function |
| Deployment | Vercel |
| Fonts | Plus Jakarta Sans + Inter |

---

## Project Structure

src/
├── components/
│   ├── DomainCard.tsx       # Domain cards (image + fallback variants)
│   ├── Footer.tsx
│   ├── Navbar.tsx           # Glass nav + mobile bottom nav + admin toggle
│   ├── ProblemCard.tsx      # Locked / unlocked problem cards
│   └── SkeletonCard.tsx
├── lib/
│   ├── auth.tsx             # AuthProvider + useAuth
│   ├── supabase.ts          # Supabase client
│   ├── theme.tsx            # Dark/light mode
│   └── toast.tsx            # Toast notifications
├── pages/
│   ├── Admin.tsx            # Problem moderation
│   ├── Auth.tsx             # Sign in / Sign up
│   ├── Landing.tsx          # Homepage
│   ├── ProblemDetail.tsx    # Full problem + AI build plan
│   ├── Problems.tsx         # Browse + filter
│   ├── Profile.tsx          # Credits, transactions, packs
│   └── Submit.tsx           # Multi-step submission
├── types/index.ts
├── App.tsx
└── index.css                # Design tokens + utility classes
supabase/functions/
├── validate-problem/        # AI scoring via OpenAI
├── razorpay-create-order/   # Payment order creation
├── razorpay-webhook/        # Payment confirmation + credit top-up
├── send-welcome-email/      # Triggered on first signup
└── send-weekly-digest/      # Opt-in digest emails

---

## Credit System

Users get **50 free credits on signup**. Credits are spent to access features:

| Action | Credits |
|---|---|
| Unlock a problem | 10 |
| AI build plan | 15 |
| Semantic search | 5 |

**One-time credit packs (no subscription):**

| Pack | Credits | Price |
|---|---|---|
| ⚡ Basic | 100 | ₹49 |
| 🚀 Standard | 300 | ₹99 |
| 💎 Pro | 700 | ₹199 |

---

## Local Development

### Prerequisites
- Node.js 18+
- Supabase project
- Razorpay account
- GROQ API key

### Setup

```bash
git clone https://github.com/your-org/problempool.git
cd problempool
npm install
```

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run preview    # preview build
```

### Supabase Edge Function secrets

Set via Supabase dashboard or CLI:

GROQ_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
RESEND_API_KEY

---

## Admin Access

Add admin emails to the `ADMIN_EMAILS` array in `src/components/Navbar.tsx`:

```ts
const ADMIN_EMAILS = [
  'admin@problempool.tech',
]
```

Admin users see a **Shield** link to `/admin` in the navbar and a purple badge. The admin panel lets you approve or reject submitted problems.

---

## Deployment

Deployed on Vercel. The `vercel.json` config handles SPA routing.

```bash
vercel --prod
```

Deploy Edge Functions:

```bash
supabase functions deploy validate-problem
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-webhook
supabase functions deploy send-welcome-email
supabase functions deploy send-weekly-digest
```

---

© 2026 ProblemPool. All rights reserved.