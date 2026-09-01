# lendibl — Frontend

The lendibl web client. Browse and search rentals, list your own items, book, pay, message the other party, and manage rentals end to end.

React + TypeScript, styled with Tailwind, talking to the lendibl API.

---

## Table of contents

- [Stack](#stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Routing](#routing)
- [Key flows](#key-flows)
- [Data layer](#data-layer)
- [Epic Mode](#epic-mode)
- [Design system](#design-system)
- [Conventions](#conventions)

---

## Stack

| Layer | Choice |
|---|---|
| Framework | React + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Server state | TanStack Query |
| Payments | Stripe.js + Elements |
| Real time | Native WebSocket client |
| Types | Shared with the backend via `@shared/schema` |

Sharing types with the backend is the single most useful decision in this codebase. An `Item` on the client is the same `Item` the database returns, so a schema change breaks the build instead of breaking production.

---

## Quick start

**Requirements:** Node 18+, the lendibl backend running locally.

```bash
npm install
cp .env.example .env
npm run dev
```

Opens on `http://localhost:5173`.

```bash
npm run build      # production build
npm run preview    # serve the production build locally
npm run check      # TypeScript check
```

---

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the lendibl API |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `VITE_WS_URL` | WebSocket endpoint for messaging and notifications |

Only publishable keys belong here. Anything prefixed `VITE_` ships to the browser.

---

## Project structure

```
client/src/
├── App.tsx                  # Router setup — PreLaunchRouter and MarketplaceRouter
├── main.tsx                 # Entry point, providers
├── pages/
│   ├── home.tsx             # Marketplace landing and browse
│   ├── item-detail.tsx      # Listing page and booking entry point
│   ├── create-listing.tsx   # Multi-step listing flow with AI price suggestion
│   ├── checkout.tsx         # Stripe payment
│   ├── bookings.tsx         # Renter and owner views of active rentals
│   ├── messages.tsx         # Per-booking threads
│   ├── profile.tsx          # Public profile, reviews, response time
│   ├── dashboard.tsx        # Your listings, earnings, payouts
│   ├── epic.tsx             # Epic Mode promotional page
│   └── admin/               # Internal tooling
├── components/
│   ├── item-grid.tsx        # Listing grid with filter state
│   ├── filters.tsx          # Category, price range, location
│   ├── auth-modal.tsx       # Contextual login/register
│   ├── booking-form.tsx     # Date range, price breakdown
│   ├── chatbot.tsx          # Support assistant widget
│   └── ui/                  # Base components
├── hooks/
│   ├── use-auth.ts          # Session, token storage, auth guards
│   ├── use-websocket.ts     # Connection lifecycle and subscriptions
│   └── use-toast.ts
└── lib/
    ├── api.ts               # Typed fetch wrapper for every endpoint
    ├── queryClient.ts       # TanStack Query config and cache keys
    └── utils.ts
```

---

## Routing

Two routers, selected by launch state:

- **`PreLaunchRouter`** — waitlist and early access capture, used before a market opens
- **`MarketplaceRouter`** — the full app

Main routes:

| Route | Page |
|---|---|
| `/` | Browse |
| `/items/:id` | Listing detail |
| `/list` | Create a listing |
| `/checkout/:bookingId` | Payment |
| `/bookings` | Your rentals, both sides |
| `/messages/:bookingId` | Rental thread |
| `/profile/:userId` | Public profile |
| `/dashboard` | Owner dashboard |
| `/epic` | Epic Mode |
| `/admin/*` | Internal |

Auth is contextual rather than a wall. There's no forced login screen on arrival — the auth modal opens at the moment a user tries to do something that requires an account. Browsing is always open, because a marketplace that asks for a password before showing inventory doesn't get a second visit.

---

## Key flows

**Browse and filter.** Filter state (`categoryId`, `search`, `minPrice`, `maxPrice`, `location`) lives in the URL, so a filtered view is shareable and survives a refresh. Filters are passed straight through to the API as query params — the client does no filtering of its own.

**Create a listing.** Multi-step: photos, category, description, availability, price. The AI pricing service suggests a daily rate before the user commits to one, which is the difference between a listing that books and a listing that sits.

**Book and pay.** Date selection, price breakdown including fees, then Stripe Elements for payment. The client never sees a secret key and never marks a booking as paid on its own — payment state comes back from the server after webhook confirmation.

**Rental lifecycle.** Request → accept → pickup confirmation → active → return confirmation → review prompt. Each transition updates booking status and pushes a notification to both parties.

**Messaging.** WebSocket-backed threads scoped to a booking, with persistence so nothing is lost when a client disconnects.

---

## Data layer

All server state goes through TanStack Query. No manual `useEffect` fetching, no state duplicated between components.

- Query keys mirror the API path, so invalidation is predictable
- Mutations invalidate the affected keys rather than patching cache by hand
- `lib/api.ts` is the only place that calls `fetch` — everything else calls a typed function

If you find yourself storing server data in `useState`, that's the signal to move it into a query.

---

## Epic Mode

A promotional surface at `/epic` used for early user acquisition. Every listing renders as free, with distinct styling and messaging so it can't be confused with normal pricing. Visitors are prompted to register or log in on arrival, since the point of the page is converting browsers into accounts during launch.

It reuses the existing item components with a mode flag rather than forking the marketplace — one grid, one card, different presentation.

---

## Design system

Tailwind with a small set of primitives in `components/ui`. Rules that keep it coherent:

- Spacing, color, and type scale come from the Tailwind config, not from arbitrary values
- Components accept a `className` and merge it, so callers can adjust layout without prop explosion
- Loading states are skeletons matching final layout, not spinners — the page shouldn't jump when data lands
- Every empty state says what to do next

---

## Conventions

- TypeScript strict mode. No `any` in committed code.
- Import shared types from `@shared/schema` instead of redeclaring API shapes locally.
- Keep pages thin: fetch, compose components, handle navigation. Logic belongs in hooks.
- Handle three states for every async view — loading, empty, and error. An unhandled error state is a bug report from a user you'll never hear from.
