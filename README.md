# 🌾 KrishiMitra — Smart farming for every farmer

An AI-powered agriculture platform for Indian farmers.
Weather advisory, mandi prices, disease detection, and a multilingual AI advisor — all in one PWA.

## Stack (all free tier, no sleep)

- **Framework:** Next.js 16 (App Router) + TypeScript + Tailwind v4
- **Database:** MongoDB Atlas M0 (free forever)
- **Auth:** JWT in HTTP-only cookie + bcryptjs
- **i18n:** English / हिन्दी / ਪੰਜਾਬੀ (client-side, `src/i18n/`)
- **Hosting:** Vercel (frontend + serverless API routes)
- **Planned ML:** FastAPI on Hugging Face Spaces
- **Planned chat:** Groq (Llama 3.1) + Whisper STT

## Local setup

```bash
cd krishimitra
cp .env.example .env.local
# fill MONGODB_URI + JWT_SECRET
npm install
npm run dev
```

Open http://localhost:3000

### Generate a JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### MongoDB Atlas (2 minutes)

1. https://cloud.mongodb.com → create free M0 cluster
2. Database Access → add user
3. Network Access → allow 0.0.0.0/0 (or your IP)
4. Connect → Drivers → copy connection string into `MONGODB_URI`

## Roadmap

- **Phase 1 (done):** auth, i18n, onboarding, dashboard shell
- **Phase 2:** weather (Open-Meteo) + mandi prices (data.gov.in) + schemes
- **Phase 3:** ML on HF Spaces — crop rec, fertilizer, disease detection
- **Phase 4:** Groq chatbot + Whisper voice + RAG over govt schemes
- **Phase 5:** alerts, community, PWA offline, yield prediction

## Project structure

```
src/
├── app/
│   ├── api/auth/         signup, login, logout, me
│   ├── api/onboarding/   save farm profile
│   ├── dashboard/        home + 5 tab pages
│   ├── login/            login page
│   ├── signup/           signup page
│   ├── onboarding/       4-step wizard
│   └── page.tsx          landing
├── components/
│   ├── ui/               Button, Input, Card primitives
│   ├── BottomNav.tsx     mobile tab bar
│   └── LanguageSwitcher.tsx
├── i18n/
│   ├── messages/         en.json, hi.json, pa.json
│   └── I18nProvider.tsx
├── lib/
│   ├── db.ts             cached Mongo connection
│   ├── auth.ts           JWT + bcrypt + cookies
│   └── cn.ts             tailwind-merge helper
└── models/
    └── User.ts           Mongoose schema
```
