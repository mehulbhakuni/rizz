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

### Step 3 — Get Spotify credentials (free, for Story/Post song picks)

1. Go to https://developer.spotify.com/dashboard → Log in → **Create app**
2. Fill in any name/description. For "Redirect URI" you can put `http://localhost:3000` (not actually used — we only use the Client Credentials flow for search)
3. Once created, go to **Settings** and copy:
   - `Client ID` → your `SPOTIFY_CLIENT_ID`
   - `Client secret` → your `SPOTIFY_CLIENT_SECRET`

---

### Step 4 — Deploy to Vercel (free hosting)

#### Option A: GitHub (recommended)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import your repo
3. Add environment variables:
   ```
   GROQ_API_KEY=gsk_your_key
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_role_key
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
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
vercel env add SPOTIFY_CLIENT_ID
vercel env add SPOTIFY_CLIENT_SECRET
vercel --prod   # deploy to production
```

---

### Step 5 — Run locally (for testing)

```bash
# Copy env file
cp .env.example .env.local
# Fill in your keys in .env.local

npm install
npm run dev
# Open http://localhost:3000
```

> **Note:** the PWA (service worker, offline caching) is **disabled in `npm run dev`** by design —
> this is standard for `next-pwa` so you don't fight a stale service worker while developing.
> To test PWA behavior locally, run `npm run build && npm run start` instead.

---

## 📱 Progressive Web App (installable on Android & iPhone)

RIZZ is a fully installable PWA using `@ducanh2912/next-pwa` (a maintained fork of `next-pwa`,
the Next.js equivalent of `vite-plugin-pwa`).

### What's included

- **Service worker** — auto-generated on `next build`, registered automatically, with
  **auto-update**: when you deploy a new version, the next time a user opens the app the
  new service worker takes over and the page reloads (`reloadOnOnline: true`).
- **Offline caching strategy**:
  - Pages you've visited (`NetworkFirst`) → load instantly online, fall back to the cached
    version offline.
  - Static JS/CSS/fonts (`CacheFirst`) → cached for 30 days, work fully offline.
  - Images/icons (`CacheFirst`) → cached for 30 days.
  - `/api/*` routes (`NetworkOnly`) → never cached, since AI replies must always be fresh.
  - A dedicated `/offline` page is shown as a fallback shell if a page was never visited
    and there's no connection.
- **Manifest** (`public/manifest.json`) — app name, short name, description, theme/background
  colors (`#1a0e16`), `display: "standalone"`, icons, and install screenshots.
- **Icons** — 192×192, 512×512, a 512×512 **maskable** icon (safe-zone padding for
  Android adaptive icons), and a 180×180 Apple touch icon — all using the 💘 mark on your
  brand gradient.
- **iOS support** — `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`,
  `apple-mobile-web-app-title`, and Apple touch icon links in `<Head>`.
- **Install App button** — appears in the header on Android/desktop Chrome (uses the native
  `beforeinstallprompt` flow) and on iOS Safari (shows a "tap Share → Add to Home Screen"
  tooltip, since iOS doesn't support a programmatic install prompt). It hides itself
  automatically once the app is already installed/running standalone.

### How users install it

**Android (Chrome):** tap the **"⬇ Install App"** button in the header, or use Chrome's
own "Add to Home screen" menu option. The app opens in standalone mode (no browser UI).

**iPhone/iPad (Safari):** tap **"⬇ Install App"** → it shows instructions to tap the
**Share** icon → **"Add to Home Screen"**. (Apple doesn't allow any website to trigger
this automatically — it's always a manual step via Share.)

### Verifying PWA compliance

After deploying (PWA features only run in production builds):

1. Open the deployed URL in Chrome (desktop or Android)
2. DevTools → **Application** tab → check **Manifest** and **Service Workers** are both
   registered with no errors
3. DevTools → **Lighthouse** → run an audit with the **PWA** category → should pass
   installability, HTTPS (automatic on Vercel), and "works offline" checks
4. On iPhone, open in Safari → Share → "Add to Home Screen" → confirm it launches in
   standalone mode with no Safari UI

---## 🧠 How the feedback learning works

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
│   ├── offline.js        # PWA offline fallback page
│   └── api/
│       ├── generate.js   # Groq AI generation (reply/opener/bio)
│       ├── feedback.js   # Store 👍👎 to Supabase
│       ├── top-replies.js # Fetch best replies for prompt injection
│       ├── ocr.js        # Screenshot → text via Groq Vision
│       ├── caption.js    # Photo(s) → captions + Spotify song picks
│       └── story-reply.js # Their story → reply + reaction suggestions
├── lib/
│   ├── groq.js           # Groq API helper
│   ├── spotify.js        # Spotify search helper (client credentials)
│   └── supabase.js       # Supabase client
├── public/
│   ├── manifest.json     # PWA manifest
│   ├── icons/             # App icons (192, 512, maskable, apple-touch)
│   └── screenshots/       # Install-screen screenshots (desktop + mobile)
├── styles/
│   └── globals.css
├── supabase-schema.sql   # Run this once in Supabase SQL editor
├── next.config.js        # next-pwa config (service worker, caching)
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
