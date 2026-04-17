# Junto — Project Brief for Claude

## What is Junto?

Junto is a **local-first, static utility toolkit** for friends. A collection of small, focused tools that solve real-life coordination problems — no accounts, no databases, no servers. Just open it and it works.

The name comes from an old word for a small group with a shared purpose. That's exactly the vibe.

---

## Core Philosophy

- **No DB** — ever. State lives in the URL or localStorage only.
- **No login** — ever. No accounts, no auth, no user data stored anywhere.
- **No backend** — pure static files, deployable to GitHub Pages, Netlify, Vercel, Cloudflare Pages for free.
- **No external connections** — no APIs, no analytics, no tracking.
- **Shareable via URL** — the primary sharing mechanism is encoded state in the URL hash. Anyone with the link gets the full context.
- **Offline-capable** — tools work without internet after the first load.
- **One person can use it alone** — tools don't require multiple people to be useful.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Bundler | **Vite** | Zero-config, fast dev server, clean builds |
| Language | **TypeScript** | Safety as codebase grows across multiple tools |
| UI | **Vanilla TS** (no framework) | Tools are mostly form → output, no deep component trees needed |
| Styling | Single design system file | Consistent look across all tools |
| Testing | **Vitest** | Easy unit tests for math-heavy logic (splits, overlaps) |
| Deployment | GitHub Pages / Netlify / Cloudflare Pages | Free, static, no server needed |

No React. No Vue. No Svelte. No UI library. Keep the bundle tiny.

---

## Project Structure

```
junto/
├── index.html               ← App shell, tab navigation
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.ts              ← Entry point, router
│   ├── shared/
│   │   ├── url-state.ts     ← Encode/decode state in URL hash (shared by all tools)
│   │   ├── storage.ts       ← localStorage helpers (optional persistence)
│   │   └── utils.ts         ← Date helpers, currency formatters, etc.
│   ├── design/
│   │   └── tokens.css       ← Colors, spacing, typography — used by all tools
│   └── tools/
│       ├── scheduler/       ← Sync Times tool
│       │   ├── index.ts
│       │   ├── scheduler.ts
│       │   └── scheduler.css
│       ├── bill-splitter/   ← Bill Splitter tool
│       │   ├── index.ts
│       │   ├── splitter.ts
│       │   └── splitter.css
│       └── [future-tool]/   ← Each new tool is an isolated folder
└── public/
    └── favicon.svg
```

---

## Shared Primitives (build once, reuse everywhere)

### `url-state.ts`
The backbone of Junto's sharing model. Every tool serializes its state into a compressed, base64-encoded URL hash. Sharing = copying the URL.

```ts
// Encode any object into the URL hash
export function encodeState<T>(state: T): string

// Decode URL hash back into an object
export function decodeState<T>(): T | null

// Example URL: junto.app/#tool=scheduler&data=eyJuYW1lIjoiQWxleCIsInNsb3RzIjpbXX0=
```

### `storage.ts`
Thin wrapper around localStorage for optional local persistence (e.g., remembering your name between sessions).

```ts
export function save<T>(key: string, value: T): void
export function load<T>(key: string): T | null
export function clear(key: string): void
```

### `utils.ts`
Shared helpers — no need to reinvent per tool:
- Date/time formatting
- Currency formatting and rounding (important for bill splitting)
- Array intersection (important for scheduler)
- Copy to clipboard helper

---

## Tools Roadmap

### ✅ Tool 1 — Sync Times (Scheduler)

**Problem:** Coordinating availability across a group is painful.

**How it works:**
1. You open the tool, pick your available time slots for the week (or custom range)
2. Click "Share" → get a unique URL encoding your availability
3. Friends open your link, add their own availability on top
4. The tool shows all time slots where everyone overlaps

**Key logic:** URL accumulates each person's data. The final URL holds everyone's schedule. No server needed — the URL IS the data.

**UI:** Weekly grid. Click slots to toggle. Green = available. Overlap slots highlighted.

---

### ✅ Tool 2 — Bill Splitter

**Problem:** After a dinner or trip, splitting bills fairly is annoying, especially with unequal shares.

**How it works:**
1. One person enters all items/expenses and who was involved in each
2. The tool calculates the minimum number of transactions to settle all debts (not just split evenly)
3. Click "Share" → everyone gets a link showing exactly who pays who and how much

**Key logic:** Debt minimization algorithm (net balance per person → greedy settlement). Currency handled carefully to avoid rounding errors.

**UI:** Add expense rows. Tag participants per expense. See settlement summary.

---

### 🔮 Future Tool Ideas (same principles apply)

- **Availability Poll** — "When works for everyone?" without a Doodle account
- **Trip Packing List** — shared checklist via URL, no login
- **Secret Santa Draw** — enter names, get assignments via unique URLs per person
- **Movie Picker** — everyone submits options, app picks randomly or by ranked vote
- **Countdown** — shareable countdown timer to an event
- **Split the Tab** — simplified version of bill splitter for equal splits only

Every new tool follows the same rules: URL-encoded state, no DB, no login, works offline.

---

## Navigation / Routing

Simple hash-based routing. No router library needed.

```
junto.app/           → landing / tool picker
junto.app/#scheduler → Sync Times tool
junto.app/#bills     → Bill Splitter tool
junto.app/#scheduler&data=... → Scheduler with pre-loaded state
```

---

## Design Principles

- **Minimal UI** — tools should feel like focused instruments, not dashboards
- **Mobile-first** — people coordinate on their phones
- **No dark patterns** — no "sign up to see results", no popups, no upsells
- **Fast** — first paint under 1 second, no heavy dependencies
- **Accessible** — keyboard navigable, sufficient color contrast

---

## Deployment

```bash
npm run build       # outputs to /dist
# deploy /dist to any static host:
# - GitHub Pages (free, automatic via Actions)
# - Netlify (free tier, drag and drop /dist)
# - Cloudflare Pages (free, fastest CDN)
```

---

## Development Setup

```bash
npm create vite@latest junto -- --template vanilla-ts
cd junto
npm install
npm run dev         # localhost:5173
```

Add Vitest:
```bash
npm install -D vitest
```

---

## Non-Goals (keep Junto honest)

- ❌ No user accounts or profiles
- ❌ No real-time sync (no WebSockets, no Firebase)
- ❌ No server-side rendering
- ❌ No paid features or freemium model
- ❌ No third-party integrations (Google Calendar, etc.)
- ❌ No analytics or telemetry
- ❌ No notifications or emails

---

## Notes for Claude

- Always keep tools isolated in their own folder under `src/tools/`
- Always use the shared `url-state.ts` for any shareable state — never invent a new sharing mechanism per tool
- Prefer explicit TypeScript types over `any`
- Keep CSS scoped per tool — no global style pollution
- Bill splitting math: always work in **cents (integers)** internally, convert to display currency only at render time — avoids floating point bugs
- Scheduler logic: time slots should be stored as ISO strings or Unix timestamps, not locale strings
- When adding a new tool, stub it in the navigation first so the routing works before the tool is built
