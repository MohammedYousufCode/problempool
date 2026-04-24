# ProblemPool

![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

> A curated marketplace of real-world problem statements from across India — for founders, developers, and product managers who want to build things that actually matter.

🌐 **Live:** [problempool.tech](https://problempool.tech)

---

## What is ProblemPool?

Most side projects fail because they solve imaginary problems. ProblemPool fixes that.

It's a platform where anyone can **submit real problems they've observed** in Indian markets. Every submission goes through AI validation and scoring before it's published. Builders then browse, unlock full context, and get AI-generated build plans — tech stack, timeline, MVP roadmap — so they can start building with confidence.

---

## Features

**For Builders**
- Browse AI-validated problem statements across 9 Indian market domains
- Unlock full problem details — who faces it, why it matters, market size, feasibility
- Get an AI-generated build plan: recommended tech stack, MVP scope, and timeline
- Vote "I face this too" to surface the most validated problems
- Semantic search to find problems by concept, not just keywords

**For Problem Submitters**
- Multi-step submission form with structured context fields
- AI scoring on submission — feasibility, market size, uniqueness
- Earn credits when your problem gets approved and unlocked by others

**Platform**
- Google OAuth + email/password authentication
- Credit-based access system (50 free credits on signup)
- One-time INR credit packs via Razorpay — no subscriptions
- Dark/light mode with a custom CSS design system
- Admin panel for problem moderation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Custom CSS design system — dark/light mode |
| Routing | React Router DOM v6 |
| Auth | Supabase Auth — Google OAuth + email/password |
| Database | Supabase (PostgreSQL) |
| Edge Functions | Supabase Edge Functions (Deno runtime) |
| AI | Groq API (via Edge Function) |
| Payments | Razorpay — INR one-time credit packs |
| Deployment | Vercel |

---

## Credit System

Users receive **50 free credits on signup**. Credits are spent to access premium features:

| Action | Cost |
|---|---|
| Unlock a problem | 10 credits |
| AI build plan | 15 credits |
| Semantic search | 5 credits |

**One-time credit packs (no subscription):**

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
│   │   ├── DomainCard.tsx       # Domain cards with image + fallback
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx           # Glass nav + mobile bottom nav + admin toggle
│   │   ├── ProblemCard.tsx      # Locked / unlocked problem card states
│   │   └── SkeletonCard.tsx     # Loading skeletons
│   ├── lib/
│   │   ├── auth.tsx             # AuthProvider + useAuth hook
│   │   ├── supabase.ts          # Supabase client
│   │   ├── theme.tsx            # Dark/light mode context
│   │   └── toast.tsx            # Toast notification system
│   ├── pages/
│   │   ├── Admin.tsx            # Problem moderation dashboard
│   │   ├── Auth.tsx             # Sign in / Sign up
│   │   ├── Landing.tsx          # Homepage
│   │   ├── ProblemDetail.tsx    # Full problem view + AI build plan
│   │   ├── Problems.tsx         # Browse + filter problems
│   │   ├── Profile.tsx          # Credits, transactions, packs
│   │   └── Submit.tsx           # Multi-step problem submission
│   ├── types/index.ts
│   ├── App.tsx
│   └── index.css                # Design tokens + utility classes
├── supabase/functions/
│   ├── validate-problem/        # AI scoring on submission
│   ├── razorpay-create-order/   # Payment order creation
│   ├── razorpay-webhook/        # Payment confirmation + credit top-up
│   ├── send-welcome-email/      # Triggered on first signup
│   └── send-weekly-digest/      # Opt-in weekly digest emails
├── .env.example
├── vercel.json
└── vite.config.ts
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Supabase project
- Razorpay account
- Groq API key

### Setup

```bash
git clone https://github.com/MohammedYousufCode/problempool.git
cd problempool
npm install
```

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

```bash
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run preview    # Preview production build locally
```

### Supabase Edge Function Secrets

Set these via the Supabase dashboard or CLI:

```
GROQ_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
RESEND_API_KEY
```

---

## Deployment

Deployed on Vercel. The `vercel.json` handles SPA routing.

```bash
vercel --prod
```

Deploy Edge Functions individually:

```bash
supabase functions deploy validate-problem
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-webhook
supabase functions deploy send-welcome-email
supabase functions deploy send-weekly-digest
```

---

## Admin Access

Add admin emails to the `ADMIN_EMAILS` array in `src/components/Navbar.tsx`:

```ts
const ADMIN_EMAILS = [
  'admin@problempool.tech',
]
```

Admin users see a **Shield** icon link to `/admin` in the navbar. The admin panel allows approving or rejecting submitted problems before they go live.

---

## Author

**Mohammed Yousuf**
BCA Final Year | Full-Stack Developer & Aspiring Data Analyst
📍 Mysore, Karnataka

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mohammed-yousuf-a75a76299/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/MohammedYousufCode)

---

*© 2026 ProblemPool. All rights reserved.*
