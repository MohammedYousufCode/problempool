<div align="center">

<img src="public/favicon.svg" width="56" alt="ProblemPool logo" />

# ProblemPool

**Stop building things nobody asked for. Find real problems worth solving.**

[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

🌐 **[problempool.tech](https://problempool.tech)**

</div>

---

## What is this?

ProblemPool is a platform where real people submit problems they've actually faced — and students, developers, and hackathon teams can browse them to find ideas worth building.

Every submission is AI-scored for feasibility and market fit before going live. You can unlock the full problem context and get an AI-generated build plan with a suggested tech stack and MVP scope — so you walk into a hackathon with a validated idea, not a guess.

Built as a final-year BCA project. Fully deployed and production-ready.

---

## Features

- **Browse** AI-validated problem statements across 9 Indian market domains
- **Unlock** full problem details — context, who faces it, why it matters, feasibility score
- **Generate** an AI build plan — tech stack suggestion, MVP scope, and timeline
- **Submit** your own observed problems through a structured multi-step form
- **Vote** "I face this too" to surface the most relevant problems
- **Search** by concept, not just keywords (semantic search)
- Google OAuth + email/password sign in
- Credit-based access with 100 free credits on signup
- One-time INR credit top-ups via Razorpay — no subscription
- Dark/light mode

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Custom CSS design system (dark/light mode) |
| Routing | React Router DOM v6 |
| Auth | Supabase Auth — Google OAuth + email/password |
| Database | Supabase (PostgreSQL) |
| Edge Functions | Supabase Edge Functions (Deno) |
| AI | Groq API |
| Payments | Razorpay |
| Hosting | Vercel |

---

## Credit System

New users get **100 free credits** on signup. Credits never expire.

| Action | Cost |
|---|---|
| Unlock a problem | 10 credits |
| Generate AI build plan | 15 credits |
| Semantic search | 5 credits |

**Optional top-up packs:**

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
│   │   ├── DomainCard.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProblemCard.tsx
│   │   └── SkeletonCard.tsx
│   ├── lib/
│   │   ├── auth.tsx
│   │   ├── supabase.ts
│   │   ├── theme.tsx
│   │   └── toast.tsx
│   ├── pages/
│   │   ├── Admin.tsx
│   │   ├── Auth.tsx
│   │   ├── Landing.tsx
│   │   ├── ProblemDetail.tsx
│   │   ├── Problems.tsx
│   │   ├── Profile.tsx
│   │   └── Submit.tsx
│   ├── types/index.ts
│   ├── App.tsx
│   └── index.css
├── supabase/
│   └── functions/
│       ├── validate-problem/
│       ├── razorpay-create-order/
│       ├── razorpay-webhook/
│       ├── send-welcome-email/
│       └── send-weekly-digest/
├── .env.example
├── vercel.json
└── vite.config.ts
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- Supabase project
- Razorpay account (test mode is fine)
- Groq API key

### Steps

```bash
git clone https://github.com/MohammedYousufCode/problempool.git
cd problempool
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

```bash
npm run dev
```

### Edge Function Secrets

Set these in the Supabase dashboard or via CLI:

```bash
supabase secrets set GROQ_API_KEY=...
supabase secrets set RAZORPAY_KEY_ID=...
supabase secrets set RAZORPAY_KEY_SECRET=...
supabase secrets set RAZORPAY_WEBHOOK_SECRET=...
supabase secrets set RESEND_API_KEY=...
```

---

## Deployment

```bash
vercel --prod
```

Deploy edge functions:

```bash
supabase functions deploy validate-problem
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-webhook
supabase functions deploy send-welcome-email
supabase functions deploy send-weekly-digest
```

---

## Admin Panel

Add your email to `ADMIN_EMAILS` in `src/components/Navbar.tsx` to access `/admin`, where you can approve or reject submitted problems before they go live.

---

## Domains

`Agritech` · `CleanTech` · `EdTech` · `Fintech` · `GovTech` · `HealthTech` · `Logistics` · `RetailTech` · `Social Impact`

---

## Author

**Mohammed Yousuf**  
BCA Final Year · Mysore, Karnataka

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mohammed-yousuf-a75a76299/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/MohammedYousufCode)

---

*© 2026 ProblemPool. All rights reserved.*