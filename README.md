<div align="center">

<img src="public/favicon.svg" width="56" alt="ProblemPool logo" />

# ProblemPool

**A curated marketplace of real-world problem statements — for founders, developers, and product managers who want to build things that actually matter.**

[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

🌐 **[problempool.tech](https://problempool.tech)**

</div>

---

## The Problem with Side Projects

Most side projects fail before they ship — not because of bad execution, but because they're solving problems nobody actually has.

ProblemPool fixes this at the source. Real people submit real problems they've observed in Indian markets. Every submission is AI-scored for feasibility, market size, and uniqueness before going live. Builders browse, unlock full context, and get an AI-generated build plan — so they can stop guessing and start shipping.

---

## Features

### For Builders
- **Browse** AI-validated problem statements across 9 Indian market domains
- **Unlock** full problem context — who faces it, why it matters, estimated market size, feasibility score
- **Generate** an AI build plan on demand: recommended tech stack, MVP scope, and a realistic timeline
- **Vote** "I face this too" to help surface the most validated problems
- **Search** semantically — find problems by concept, not just keywords

### For Problem Submitters
- Multi-step structured submission form with guided context fields
- Instant AI scoring on submission — feasibility, market size, uniqueness
- Earn credits each time your approved problem is unlocked by a builder

### Platform
- Google OAuth + email/password authentication via Supabase Auth
- Credit-based access model with 100 free credits on signup
- One-time INR credit packs via Razorpay — no subscriptions, ever
- Dark/light mode with a fully custom CSS design system
- Admin moderation panel for reviewing and approving submissions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Custom CSS design system (tokens, dark/light mode) |
| Routing | React Router DOM v6 |
| Auth | Supabase Auth — Google OAuth + email/password |
| Database | Supabase (PostgreSQL) |
| Edge Functions | Supabase Edge Functions (Deno runtime) |
| AI | Groq API |
| Payments | Razorpay — INR one-time credit packs |
| Deployment | Vercel |

---

## Credit System

Users receive **100 free credits on signup**. Credits unlock premium features and never expire.

| Action | Cost |
|---|---|
| Unlock a problem | 10 credits |
| Generate AI build plan | 15 credits |
| Semantic search | 5 credits |

**One-time top-up packs — no subscription:**

| Pack | Credits | Price |
|---|---|---|
| ⚡ Basic | 100 | ₹49 |
| 🚀 Standard | 300 | ₹99 |
| 💎 Pro | 700 | ₹199 |

---

## Project Structure

```
problempool/
├── src/
│   ├── components/
│   │   ├── DomainCard.tsx        # Domain tiles with image + skeleton fallback
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx            # Glass nav + mobile bottom bar + admin toggle
│   │   ├── ProblemCard.tsx       # Locked / unlocked card states
│   │   └── SkeletonCard.tsx      # Loading skeletons
│   ├── lib/
│   │   ├── auth.tsx              # AuthProvider + useAuth hook
│   │   ├── supabase.ts           # Supabase client singleton
│   │   ├── theme.tsx             # Dark/light mode context
│   │   └── toast.tsx             # Toast notification system
│   ├── pages/
│   │   ├── Admin.tsx             # Problem moderation dashboard
│   │   ├── Auth.tsx              # Sign in / sign up
│   │   ├── Landing.tsx           # Homepage
│   │   ├── ProblemDetail.tsx     # Full problem view + AI build plan
│   │   ├── Problems.tsx          # Browse + filter + search
│   │   ├── Profile.tsx           # Credits, transactions, top-up
│   │   └── Submit.tsx            # Multi-step submission flow
│   ├── types/index.ts
│   ├── App.tsx
│   └── index.css                 # Design tokens + global utility classes
├── supabase/
│   └── functions/
│       ├── validate-problem/     # AI scoring triggered on submission
│       ├── razorpay-create-order/
│       ├── razorpay-webhook/     # Payment confirmation + credit top-up
│       ├── send-welcome-email/
│       └── send-weekly-digest/
├── public/
├── .env.example
├── vercel.json                   # SPA routing rewrites
└── vite.config.ts
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account (test mode works fine)
- A [Groq](https://groq.com) API key

### Setup

```bash
git clone https://github.com/MohammedYousufCode/problempool.git
cd problempool
npm install
```

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

```bash
npm run dev        # Starts dev server at http://localhost:3000
npm run build      # Type-check + production build
npm run preview    # Preview the production build locally
```

### Edge Function Secrets

Set these in the Supabase dashboard under **Project Settings → Edge Functions**, or via the CLI:

```bash
supabase secrets set GROQ_API_KEY=...
supabase secrets set RAZORPAY_KEY_ID=...
supabase secrets set RAZORPAY_KEY_SECRET=...
supabase secrets set RAZORPAY_WEBHOOK_SECRET=...
supabase secrets set RESEND_API_KEY=...
```

---

## Deployment

The project deploys to Vercel. `vercel.json` is already configured to handle SPA client-side routing.

```bash
vercel --prod
```

Deploy Edge Functions individually via the Supabase CLI:

```bash
supabase functions deploy validate-problem
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-webhook
supabase functions deploy send-welcome-email
supabase functions deploy send-weekly-digest
```

---

## Admin Access

Add admin email addresses to the `ADMIN_EMAILS` array in `src/components/Navbar.tsx`:

```ts
const ADMIN_EMAILS = [
  'admin@problempool.tech',
]
```

Admin users see a shield icon in the navbar that links to `/admin`. From there, they can approve or reject submitted problems before they go live on the platform.

---

## Domains

Problems are organized across 9 Indian market sectors:

`Agritech` · `CleanTech` · `EdTech` · `Fintech` · `GovTech` · `HealthTech` · `Logistics` · `RetailTech` · `Social Impact`

---

## Author

**Mohammed Yousuf**
BCA Final Year · Full-Stack Developer · Mysore, Karnataka

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mohammed-yousuf-a75a76299/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/MohammedYousufCode)

---

*© 2026 ProblemPool. All rights reserved.*