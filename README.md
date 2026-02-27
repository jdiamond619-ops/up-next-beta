# Up Next Beta (MVP)

Mobile-first web app where users back short videos with in-app UNC in a closed-loop economy.

## Stack
- Frontend: Next.js + Tailwind + Zustand + Recharts
- Backend: Node.js + Express + JWT + PostgreSQL
- Database: PostgreSQL schema + seed script included

## Project Structure

```text
backend/
  package.json
  .env.example
  src/
    server.js
    config/{env.js,db.js}
    controllers/{authController.js,videoController.js,portfolioController.js,leaderboardController.js}
    middleware/{auth.js,optionalAuth.js,rateLimit.js}
    routes/{authRoutes.js,videoRoutes.js,portfolioRoutes.js,leaderboardRoutes.js}
    services/marketService.js
    db/{schema.sql,seed.js}
    utils/{jwt.js,asyncHandler.js}
frontend/
  package.json
  .env.example
  next.config.js
  tailwind.config.js
  postcss.config.js
  src/
    app/{layout.jsx,page.jsx,globals.css}
    app/login/page.jsx
    app/signup/page.jsx
    app/portfolio/page.jsx
    app/admin/page.jsx
    app/videos/[id]/page.jsx
    components/{AppShell.jsx,NavBar.jsx,VideoCard.jsx,TradePanel.jsx,PriceChart.jsx}
    context/useAuthStore.js
    lib/api.js
```

## Core Features Implemented
- JWT auth: signup/login/me
- User profile balance and portfolio retrieval
- TikTok-style vertical feed cards with video + market stats
- Back and sell actions on each video
- Bonding-curve style pricing with anti-volatility guards
- Video detail page with price chart and buy/sell history log
- Portfolio page with entry/current/unrealized PnL
- Admin upload endpoint and UI
- Transaction ledger persisted in Postgres
- Leaderboard (top unrealized PnL)
- API-level rate limiting + per-user/video cooldown

## Price Engine (MVP)
Base formula target:

`targetPrice = basePrice + (totalUNCBacked * multiplier)`

Guarded execution in `backend/src/services/marketService.js`:
- Per-trade price move cap: max ±6% from current price
- Dynamic trade-size cap: min of
  - 15% of pool (with base floor)
  - 40% of wallet
- Cooldown: 15s per user per video between trades
- Slippage protection: user can provide `maxSlippagePct`
- Liquidity guard on sells: blocks sells that exceed pool liquidity

This keeps the model responsive while reducing manipulation from single large orders.

## Database Setup
1. Create a Postgres database (example: `up_next`)
2. Apply schema:
   - `psql postgres://postgres:postgres@localhost:5432/up_next -f backend/src/db/schema.sql`
3. Seed sample data:
   - `cd backend`
   - `cp .env.example .env` and set `DATABASE_URL`
   - `npm install`
   - `npm run db:seed`

## Run Locally

### Backend
1. `cd backend`
2. `cp .env.example .env`
3. Set `DATABASE_URL` and `JWT_SECRET`
4. `npm install`
5. `npm run dev`

Backend runs on `http://localhost:4000`.

### Frontend
1. `cd frontend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

Frontend runs on `http://localhost:3000`.

## Seed Accounts
- Admin: `admin@upnext.local` / `admin1234`
- User: `demo@upnext.local` / `user1234`

## REST API Summary
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/videos`
- `GET /api/videos/:id`
- `POST /api/videos/:id/buy`
- `POST /api/videos/:id/sell`
- `POST /api/videos/admin/upload` (admin only)
- `GET /api/portfolio/me`
- `GET /api/leaderboard`

## Notes
- UNC is closed-loop and non-withdrawable.
- No real money rails, no crypto integration, no tokenization.
- Not intended for real-world investing behavior.
