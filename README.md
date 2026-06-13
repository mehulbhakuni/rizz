# RIZZ — AI Dating Assistant

> AI-powered dating replies, openers & bios. Built with Next.js + Groq (free) + Supabase (free).

---

## 🚀 Deploy in 15 minutes (free, runs forever)

### Step 1 — Get your Groq API key (free, 14,400 req/day)

1. Go to https://console.groq.com
2. Sign up → API Keys → Create API Key
3. Copy it — looks like `gsk_abc123...`

---

### Step 2 — Set up Supabase (free database for feedback learning)

1. Go to https://supabase.com → New project (free tier)
2. Wait for it to set up (~1 min)
3. Go to **SQL Editor** → New Query → paste the contents of `supabase-schema.sql` → Run
4. Go to **Settings → API** and copy:
   - `Project URL` → your `SUPABASE_URL`
   - `anon public` key → your `SUPABASE_ANON_KEY`
   - `service_role` key → your `SUPABASE_SERVICE_KEY` (keep secret!)

---

### Step 3 — Deploy to Vercel (free hosting)

#### Option A: GitHub (recommended)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import your repo
3. Add environment variables:
   ```
   GROQ_API_KEY=gsk_your_key
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```
4. Click Deploy → done. You get a live URL like `rizz-ai.vercel.app`

#### Option B: Vercel CLI

```bash
npm install -g vercel
cd rizz-ai
vercel          # follow prompts, log in
vercel env add GROQ_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel --prod   # deploy to production
```

---

### Step 4 — Run locally (for testing)

```bash
# Copy env file
cp .env.example .env.local
# Fill in your keys in .env.local

npm install
npm run dev
# Open http://localhost:3000
```

---

## 🧠 How the feedback learning works

1. User gets replies → taps 👍 or 👎
2. That reply + tone is stored in Supabase `feedback` table
3. Next time someone uses the same tone, the top 5 liked replies are fetched
4. They're injected into the prompt as examples → better replies over time

The more people use it, the smarter it gets. Zero extra cost.

---

## 📁 File structure

```
rizz-ai/
├── pages/
│   ├── index.js          # Main UI
│   ├── _app.js           # Global styles
│   └── api/
│       ├── generate.js   # Groq AI generation (reply/opener/bio)
│       ├── feedback.js   # Store 👍👎 to Supabase
│       ├── top-replies.js # Fetch best replies for prompt injection
│       └── ocr.js        # Screenshot → text via Groq Vision
├── lib/
│   ├── groq.js           # Groq API helper
│   └── supabase.js       # Supabase client
├── styles/
│   └── globals.css
├── supabase-schema.sql   # Run this once in Supabase SQL editor
├── vercel.json
└── .env.example
```

---

## 💰 Cost breakdown

| Service | Free tier | When you'd pay |
|---------|-----------|----------------|
| Groq API | 14,400 req/day | Almost never for a new app |
| Supabase | 500MB, 50,000 rows | After ~100k feedbacks |
| Vercel | 100GB bandwidth/mo | After serious traffic |

**Bottom line: $0/month until you have real scale.**

---

## 🔜 Next steps to monetize

1. Add Clerk auth (free) → identify users
2. Add rate limiting (3 free/day per user)  
3. Add Stripe paywall ($3.99/month unlocks unlimited)
4. At 1,000 paying users = $4k/month, API costs ~$50/month → 98% margin
