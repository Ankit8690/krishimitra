<div align="center">

# 🌾 KrishiMitra

### Smart farming for every Indian farmer

**A production-ready AI-powered agriculture platform — weather advisory, live mandi prices, disease detection, a multilingual voice-first LLM advisor, community board and admin analytics — deployed on Vercel with zero paid dependencies.**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://krishimitra-flax.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)

🔗 **Live demo:** [krishimitra-flax.vercel.app](https://krishimitra-flax.vercel.app)

</div>

---

## Table of contents

- [What KrishiMitra does](#-what-krishimitra-does)
- [Why it matters](#-why-it-matters)
- [Feature tour](#-feature-tour)
- [Technical architecture](#%EF%B8%8F-technical-architecture)
- [ML approach — honest breakdown](#-ml-approach--honest-breakdown)
- [Data sources](#-data-sources)
- [Local development](#-local-development)
- [Environment variables](#-environment-variables)
- [Deployment](#-deployment)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Author](#-author)

---

## 🌾 What KrishiMitra does

KrishiMitra is a full-stack web app built for the 60% of Indians who work in agriculture. In one PWA, a farmer can:

- Check **7-day weather** with a spray-safety advisory tuned to farming operations
- See **live mandi prices** across 3,000+ markets pulled from data.gov.in Agmarknet
- Discover **government schemes** they're eligible for based on state, crop, and land size
- Get **AI crop recommendations** ranked by real profit-per-acre using live prices
- Snap a leaf photo for **disease detection** and receive language-native treatment steps
- Chat with a **voice-first LLM advisor** in 13 Indian languages with citations, streaming, tool-calling
- Post to a **community board** for equipment, seed, labour, and produce exchange
- File **feedback** which the admin acts on in a dedicated back-office

The whole product runs on free tiers — no sleeping servers, no credit card, no vendor lock-in.

---

## 🎯 Why it matters

India has 146 million farming households. Most already own a smartphone. Yet the tools built for them are typically single-purpose apps in one language, tied to one government department, with UX designed by contractors who never spoke to a farmer.

KrishiMitra takes the opposite bet: **one app, three languages of UI + thirteen of chat, honest ML where it earns its keep, government data everywhere else, and enough polish that a farmer's college-going kid isn't embarrassed to install it on their parent's phone.**

---

## ✨ Feature tour

### 🏠 Landing & onboarding
- Fully responsive marketing landing with hero, features, testimonials, CTA
- 4-step onboarding wizard: location (searchable state + district or free text), land size (typed acres), soil type, primary crops
- Every step supports "Other — write yourself" so farmers with atypical setups aren't blocked

### 🔐 Auth & security
- Email + password signup with **6-digit OTP verification via Gmail SMTP**
- Rate limiting: 3 signup attempts / 8 login attempts per email per 10 minutes
- 5-attempt cap on OTP verification
- Pending signups auto-expire after 1 hour (MongoDB TTL index)
- JWT sessions in HTTP-only cookies, bcrypt password hashing
- **Separate admin portal** at `/admin` with env-var credentials — admin creds never touch the database

### 🌦️ Weather
- Current conditions + 7-day forecast + hourly rain probability chart
- **Spray-safety advisory**: "Good day to spray" (🟢) / "Don't spray" (🔴) based on next-6-hour rain probability and wind speed
- Powered by Open-Meteo (blends ECMWF, IMD, NOAA GFS models)
- Farmer location auto-geocoded from onboarding

### 🌾 Mandi prices
- Live per-commodity prices from data.gov.in Agmarknet across all major states
- Sortable table by crop / market / price
- Personalised "best mandi for your crops" on home dashboard
- **Graceful degradation**: 3-layer fallback (fresh cache → stale cache → bundled seed dataset) — the page never breaks even when data.gov.in is down
- 60s circuit breaker so users never wait for a known-down API

### 🏛️ Government schemes
- Curated list of national + state farmer schemes (PM-KUSUM, PM-KISAN, Soil Health Card, etc.)
- Filtered by farmer's state, crop, and land size
- Direct links to official application portals with plain-language explainer

### 🌱 Best crop for my land
- **Easy mode**: pick soil type (Alluvial / Black / Red / Laterite / Sandy / Loamy), water availability, and terrain — location + current weather auto-fill
- **Expert mode**: full soil health card values (N/P/K/pH/temperature/humidity/rainfall)
- Ranked by **estimated profit per acre** using live mandi prices
- Shows fit/misfit reasons per crop so recommendations are explainable
- Pre-wired swap points (`CROP_ML_SCORE_URL`, `CROP_ML_YIELD_URL`) for a future ML upgrade — one env var flip, zero code change

### 🧪 Fertilizer advisor
- Reads farmer's Soil Health Card values, computes NPK deficit against crop target
- Outputs "add X bags per acre of Urea / DAP / MOP" — the actual language farmers use
- Includes one organic-alternative tip per recommendation
- Formulas match Krishi Vigyan Kendra standard practice

### 📷 Disease scan (real ML)
- Camera or gallery upload of a plant leaf
- MobileNetV2 fine-tuned on PlantVillage (34 diseases across 14 crops) served via HuggingFace Inference API
- Confidence-thresholded results with alternatives shown
- Language-native treatment steps for each disease
- Detected disease auto-injected as context when farmer asks the chatbot a follow-up question

### 🤖 Ask KrishiMitra — voice-first LLM
- Groq `gpt-oss-120b` with tool-calling for real-time weather + mandi prices
- **13-language support** — English, हिंदी, ਪੰਜਾਬੀ, తెలుగు, தமிழ், ಕನ್ನಡ, മലയാളം, മൊൾ, ગુજરાતી, বাংলা, मराठी, ଓଡ଼ିଆ, اردو
- **Streaming responses** (SSE, word-by-word)
- **Whisper large-v3-turbo** for speech-to-text — mic button auto-stops on 7s silence
- **Browser TTS** for read-aloud (ask / always / never modes)
- **Image input** — attach a leaf photo, disease detector runs, result becomes chat context
- **Multi-session** — 10 conversations kept, deletable, exportable to PDF
- **Citations** in every answer with links to sources
- **Copy** on any message, **delete** on your own messages, **share** replies via Web Share API
- **Triple-layer language enforcement** so the LLM never drifts to a different language mid-conversation

### 📊 Home dashboard
- Today's weather with spray chip
- Best mandi prices for the farmer's registered crops
- Today's farm task (live from crop-calendar knowledge base + sowing dates)
- Personalised scheme count
- Quick-access tiles to every AI tool
- Rotating daily farmer's quote (Shastri, Gandhi, Swaminathan, etc.)
- Full-viewport golden-wheat backdrop image behind opaque cards

### 👥 Community board
- Farmers post equipment (rent tractor), seed (sell wheat seed), labour, produce, or free-form asks
- Category filter chips, per-post contact number + district
- Owner can delete their own posts

### 💬 Feedback
- Farmers submit bug / suggestion / feature / praise / other with 1-5 star rating
- Past submissions visible to the user with status badges
- All feedback flows to the admin portal

### 🛠️ Admin portal (`/admin`)
- Separate login (env-var creds, not in DB), separate JWT cookie
- **Feedback management**: search, filter by status/category, star, mark read/in-progress/resolved/archived, private admin notes, delete
- **User management**: search by name/email/phone, view farm profile + usage stats + activity timeline, disable/enable/delete (cascade removes chat/posts/feedback)
- **Health chips** in header: `cache: redis · smtp: on · crop: rules/static` so admin knows infra state at a glance
- **Full activity log** — every login, signup, chat message, scan, recommendation, post, feedback is logged with IP + user agent + structured meta

### 📱 Responsive across all viewports
- **Three-mode toggle**: Auto (browser default) / Web (force desktop layout) / Mobile (emulate phone on desktop)
- Real mobile viewport gets a slide-in drawer with the full sidebar nav + persistent bottom tab bar
- Landing / signup / login / dashboard / admin all responsive-tested
- **Light / Dark theme** with system-preference detection

### 🌐 Trilingual UI (en / hi / pa)
- Every visible string translated in three languages
- External data (weather conditions, commodities, scheme names) translated via dictionaries
- Language switcher persists to user profile

### 📴 Offline PWA
- Service worker with app-shell caching
- Installable on mobile home screen (add to home screen)
- Basic offline browsing of previously-viewed pages

---

## 🏗️ Technical architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Vercel (edge + serverless)                  │
│                                                                       │
│  Next.js 16 App Router (React 19 + Tailwind v4 + Turbopack)          │
│  ├─ Client:  PWA · streaming SSE · Web Audio · Web Speech            │
│  └─ Server:  Route handlers · Server components · Middleware         │
│                                                                       │
└──────┬────────────┬────────────┬─────────────┬───────────┬───────────┘
       │            │            │             │           │
       ▼            ▼            ▼             ▼           ▼
  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │ MongoDB │  │ Upstash │  │  Groq   │  │HuggingFace│ │Open-Meteo│
  │ Atlas   │  │  Redis  │  │gpt-oss  │  │MobileNetV2│ │data.gov │
  │ (M0)    │  │ (cache) │  │+ Whisper│  │(disease) │  │ (mandi)  │
  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘

  Every external dependency is on a free tier with no sleep issues.
```

### Directory layout

```
krishimitra/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                         # Landing
│  │  ├─ signup/                          # 2-step OTP signup
│  │  ├─ login/
│  │  ├─ onboarding/                      # 4-step wizard
│  │  ├─ dashboard/
│  │  │  ├─ page.tsx                      # Home
│  │  │  ├─ weather/  · prices/           # Data views
│  │  │  ├─ schemes/  · community/
│  │  │  ├─ recommend/ · fertilizer/      # AI/rule advisors
│  │  │  ├─ scan/                         # Disease detection
│  │  │  ├─ ask/                          # LLM chat
│  │  │  ├─ feedback/  · profile/  · settings/
│  │  ├─ admin/                           # Back-office portal
│  │  │  ├─ page.tsx                      # Feedback dashboard
│  │  │  ├─ users/                        # User management + activity
│  │  │  └─ login/
│  │  └─ api/                             # 25+ route handlers
│  ├─ components/                         # Reusable UI (Sidebar, Card, Combobox, etc.)
│  ├─ lib/                                # Domain logic
│  │  ├─ cropRec.ts       · cropRecML.ts  # Scoring engine + ML swap point
│  │  ├─ fertilizer.ts    · disease.ts
│  │  ├─ weather.ts       · mandi.ts       # External data with cache + fallback
│  │  ├─ groq.ts          · chatTools.ts   # LLM + tool-calling
│  │  ├─ cache.ts                          # Redis-or-memory cache layer
│  │  ├─ mailer.ts                         # SMTP with console fallback
│  │  ├─ activity.ts                       # Fire-and-forget activity logger
│  │  ├─ adminAuth.ts     · auth.ts        # Separate admin + user JWTs
│  │  └─ otp.ts                            # OTP generation, hashing, rate limiting
│  ├─ models/                             # Mongoose schemas
│  ├─ data/                               # Curated JSON (crops, schemes, seed prices)
│  └─ i18n/                               # Trilingual dictionaries
├─ public/                                # Icons, manifest, service worker
├─ ml-service/                            # Optional FastAPI for fine-tuned models
└─ .env.example                           # 13 documented env vars
```

### Data layer

- **MongoDB Atlas M0** (free forever, 512MB) — Users, ChatMessage, ChatSession, Post, Feedback, ActivityLog, PendingSignup
- **Upstash Redis** (free 500K commands/mo) — weather, mandi, geocode caches; falls back to in-memory Map when unset
- Both accessed through thin wrappers so swapping the backend is one file's worth of change

### Caching strategy

Serverless functions cold-start with empty memory, so any in-process cache misses across invocations. Upstash Redis (Mumbai region for India latency) gives us a shared cache:

- **Weather**: 30 min TTL per district
- **Mandi**: 2h fresh + 24h stale + seed dataset fallback
- **Geocode**: 30-day TTL (state/district → lat/lon barely changes)

Benchmark: 1177 ms cold cache → 208 ms cached = **5.6× speedup**.

### Auth & security

- Farmer sessions: `km_session` cookie, HttpOnly + SameSite=Lax, 7-day expiry
- Admin sessions: separate `km_admin` cookie, 8-hour expiry, env-var credentials
- OTP verification: 10 min expiry, 5-attempt cap, bcrypt-hashed codes
- Rate limits: 3 signups + 8 login attempts per email per 10 min
- Every important action logged with IP + UA to `ActivityLog` collection

---

## 🧠 ML approach — honest breakdown

I made deliberate choices about **where ML earns its keep** versus **where rules explain themselves better to a farmer**.

| Feature | Approach | Why |
|---|---|---|
| **Disease detection** | ML — MobileNetV2 on PlantVillage (34 classes) via HuggingFace Inference API | Real image classification task, existing quality pretrained model, farmer wants "what is this?" not "why?" |
| **Crop recommendation** | Rule-based feature-similarity scorer | No labeled `(soil+climate → correct crop, yield)` dataset large enough exists; rules give explainable fit/misfit reasons the farmer can act on; ranked by real profit using live mandi prices |
| **Fertilizer advisor** | Rule-based NPK deficit math | Matches Krishi Vigyan Kendra formulas exactly — deviating would be worse, not better |
| **Weather** | Not ML — Open-Meteo blends ECMWF / IMD / GFS numerical weather models | These physical simulations dominate any ML weather model at the accuracy required |

**Crop rec is pre-wired for ML swap** — set `CROP_ML_SCORE_URL` and/or `CROP_ML_YIELD_URL` to point at a HuggingFace Space or any HTTPS endpoint returning `{scores: {crop: 0..1}}` and/or `{yields: {crop: qtl/acre}}`, and the app switches to hybrid ML+rules mode with zero code change.

---

## 📡 Data sources

| Source | What we pull | Freshness |
|---|---|---|
| [Open-Meteo](https://open-meteo.com) | Weather forecasts (ECMWF / IMD / NOAA GFS ensembles) | 30 min cache |
| [data.gov.in Agmarknet](https://agmarknet.gov.in) | Live mandi prices | 2h cache + 24h stale + seed |
| [ICAR](https://icar.org.in) | Crop production ranges, target NPK, average yields | Bundled JSON |
| [PlantVillage](https://plantvillage.psu.edu) | 34 disease classes across 14 crops | Model weights on HuggingFace |
| Government scheme portals | PM-KUSUM, PM-KISAN, Soil Health Card, etc. | Bundled JSON, updated manually |
| Nominatim | Reverse geocoding | 30-day cache |

---

## 💻 Local development

### Prerequisites

- Node.js 20+
- npm 10+
- A MongoDB Atlas cluster (free — [signup](https://cloud.mongodb.com))
- Optional: [Upstash Redis](https://console.upstash.com), [Gmail App Password](https://myaccount.google.com/apppasswords), [Groq API key](https://console.groq.com), [HuggingFace token](https://huggingface.co/settings/tokens)

### Setup

```bash
git clone https://github.com/Ankit8690/krishimitra.git
cd krishimitra
cp .env.example .env.local        # then fill values (see env vars below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Generate a JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste output into `JWT_SECRET`.

---

## 🔑 Environment variables

All 13 are documented in `.env.example`. Minimum required to run:

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/krishimitra
JWT_SECRET=<64-char random hex>
```

Every other variable degrades gracefully:

| Variable | If unset |
|---|---|
| `OPEN_METEO_BASE` | Defaults to public endpoint |
| `DATA_GOV_IN_API_KEY` | Mandi returns seed dataset |
| `HUGGINGFACE_API_TOKEN` | Disease scanner returns demo prediction |
| `GROQ_API_KEY` | Chat returns 503 with setup instructions |
| `ADMIN_EMAIL` + `ADMIN_PASSWORD` | Admin login rejected with clear error |
| `SMTP_USER` + `SMTP_PASS` | OTP printed to server console + returned in dev-mode API response |
| `UPSTASH_REDIS_REST_URL` + `_TOKEN` | In-memory cache (fine for local dev) |
| `CROP_ML_SCORE_URL` / `_YIELD_URL` | Rule-based scoring used |
| `ML_API_BASE` | HuggingFace Inference API used for disease |

---

## 🚀 Deployment

Vercel + MongoDB Atlas + Upstash — all free tier:

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com/new)
3. Paste every env var from your local `.env.local` into Vercel → Settings → Environment Variables (Production + Preview)
4. In MongoDB Atlas, add IP `0.0.0.0/0` to Network Access (Vercel's serverless functions rotate IPs)
5. Click Deploy — first build takes ~2 min

Every `git push` triggers an auto-deploy. Preview URLs are generated per branch.

**Check deployment health**: `https://<your-app>/api/admin/me` returns a `system` object with `{ cache, smtpConfigured, cropML, nodeEnv }`.

---

## 🗺️ Roadmap

**Shipped (v1.0)**
- ✅ All features listed in "Feature tour"
- ✅ Deployed to Vercel production

**Next**
- 🔜 Fine-tune disease model on Indian crops (okra, brinjal, tur, chickpea) — Colab notebook prepared in `ml-service/`
- 🔜 Train crop-yield regressor on ICAR district × crop × season historical data → plug into `CROP_ML_YIELD_URL`
- 🔜 SMS OTP fallback for farmers without email
- 🔜 Native Android APK (Capacitor wrap) for lower-end phones
- 🔜 Field-level GPS pin instead of district centroid for weather

---

## 👤 Author

**Ankit Sharma**
- B.E. Computer Engineering, Thapar Institute of Engineering and Technology, Patiala
- 📧 asharma18_be23@thapar.edu · 📞 +91 86905 54658
- 🐙 [github.com/Ankit8690](https://github.com/Ankit8690)
- 💼 [LinkedIn](https://www.linkedin.com/in/ankit-sharma-52a1a728a)

> *"Technology serves best when it serves the hands that feed us. Every farmer, in every village, deserves the same tools a Bengaluru startup takes for granted — KrishiMitra is my small step toward closing that gap."*

Made with 🌾 in Patiala, India.

---

## 📄 License

MIT
