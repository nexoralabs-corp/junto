# Junto — Project Brief for Claude

## What is Junto?

Junto = **local-first, static utility toolkit** for friends. Small, focused tools solving real-life coordination problems — no accounts, no databases, no servers. Open and works.

Name from old word for small group with shared purpose. That vibe.

---

## Core Philosophy

- **No DB** — ever. State lives in URL or localStorage only.
- **No login** — ever. No accounts, no auth, no user data stored anywhere.
- **No backend** — pure static files, deployable to GitHub Pages, Netlify, Vercel, Cloudflare Pages free.
- **No external connections** — no APIs, no analytics, no tracking.
- **Shareable via URL** — primary sharing = encoded state in URL hash. Anyone with link gets full context.
- **Offline-capable** — works without internet after first load.
- **One person can use it alone** — tools don't require multiple people to be useful.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Bundler | **Vite** | Zero-config, fast dev server, clean builds |
| Package manager | **Bun** | Faster installs + runs, replaces npm/node |
| Language | **TypeScript** | Safety as codebase grows across multiple tools |
| UI | **Vanilla TS** + **PicoCSS** | No JS framework, PicoCSS handles base styling (~10kb classless CSS) |
| Styling | `tokens.css` overrides PicoCSS vars | Consistent look across all tools |
| Testing | **Vitest** | Easy unit tests for math-heavy logic (splits, overlaps) |
| Deployment | **GitHub Pages** | Free, static, no server needed |

No React. No Vue. No Svelte. No UI library. Bundle stays tiny.

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
Backbone of sharing. Every tool serializes state into compressed, base64-encoded URL hash. Sharing = copy URL.

```ts
// Encode any object into the URL hash
export function encodeState<T>(state: T): string

// Decode URL hash back into an object
export function decodeState<T>(): T | null

// Example URL: junto.app/#tool=scheduler&data=eyJuYW1lIjoiQWxleCIsInNsb3RzIjpbXX0=
```

### `storage.ts`
Thin wrapper around localStorage for optional local persistence (e.g., remembering name between sessions).

```ts
export function save<T>(key: string, value: T): void
export function load<T>(key: string): T | null
export function clear(key: string): void
```

### `utils.ts`
Shared helpers — no reinventing per tool:
- Date/time formatting
- Currency formatting and rounding (important for bill splitting)
- Array intersection (important for scheduler)
- Copy to clipboard helper

---

## Tools Roadmap

### ✅ Tool 1 — Sync Times (Scheduler)

**Problem:** Coordinating availability across group is painful.

**How it works:**
1. Open tool, pick available time slots for week (or custom range)
2. Click "Share" → get unique URL encoding availability
3. Friends open link, add own availability on top
4. Tool shows all time slots where everyone overlaps

**Key logic:** URL accumulates each person's data. Final URL holds everyone's schedule. No server — URL IS data.

**UI:** Weekly grid. Click slots to toggle. Green = available. Overlap slots highlighted.

---

### ✅ Tool 2 — Bill Splitter

**Problem:** After dinner or trip, splitting bills fairly is annoying, especially with unequal shares.

**How it works:**
1. One person enters all items/expenses and who was involved in each
2. Tool calculates minimum transactions to settle all debts (not just split evenly)
3. Click "Share" → everyone gets link showing exactly who pays who and how much

**Key logic:** Debt minimization algorithm (net balance per person → greedy settlement). Currency handled carefully to avoid rounding errors.

**UI:** Add expense rows. Tag participants per expense. See settlement summary.

---

### 🔮 Future Tool Ideas (same principles apply)

- **Availability Poll** — "When works for everyone?" without Doodle account
- **Trip Packing List** — shared checklist via URL, no login
- **Secret Santa Draw** — enter names, get assignments via unique URLs per person
- **Movie Picker** — everyone submits options, app picks randomly or by ranked vote
- **Countdown** — shareable countdown timer to event
- **Split the Tab** — simplified bill splitter for equal splits only

Every new tool: URL-encoded state, no DB, no login, works offline.

---

## Navigation / Routing

Hash-based routing. No router library needed.

```
junto.app/           → landing / tool picker
junto.app/#scheduler → Sync Times tool
junto.app/#bills     → Bill Splitter tool
junto.app/#scheduler&data=... → Scheduler with pre-loaded state
```

---

## Design Principles

- **Minimal UI** — tools feel like focused instruments, not dashboards
- **Mobile-first** — people coordinate on phones
- **No dark patterns** — no "sign up to see results", no popups, no upsells
- **Fast** — first paint under 1 second, no heavy dependencies
- **Accessible** — keyboard navigable, sufficient color contrast

---

## Deployment

```bash
bun run build       # outputs to /dist
# deploy /dist to GitHub Pages (via Actions)
```

---

## Development Setup

```bash
bunx create-vite junto --template vanilla-ts
cd junto
bun install
bun add @picocss/pico
bun add -d vitest
bun run dev         # localhost:5173
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

- Always keep tools isolated in own folder under `src/tools/`
- Always use shared `url-state.ts` for shareable state — never invent new sharing mechanism per tool
- Prefer explicit TypeScript types over `any`
- Keep CSS scoped per tool — no global style pollution
- Bill splitting math: always work in **cents (integers)** internally, convert to display currency only at render time — avoids floating point bugs
- Scheduler logic: time slots stored as ISO strings or Unix timestamps, not locale strings
- Adding new tool: stub in navigation first so routing works before tool is built
- **i18n**: ALL user-visible strings live in `src/shared/i18n.ts` only. No hardcoded strings in tool files. Use `t('section.key')` for strings, `tArr('section.key')` for string arrays. Add keys to both `en` and `es` objects — never add to one without the other. Slot time labels (`formatHour`) are numbers so no translation needed.
- **Components — be DRY**: Before writing any UI element, check `src/shared/components/` first. Shared components: `buttons.tsx` (InfoButton, PrimaryButton, SecondaryButton), `display.tsx` (Logo, Chip, Section, Feedback), `forms.tsx` (TextInput, NumberInput, Select, CheckboxLabel, FieldGroup, FormRow), `modal.tsx` (Modal), `nav.tsx` (ToolNav). Tool-specific components live in their own folder: `src/tools/scheduler/components.tsx`, `src/tools/bill-splitter/components.tsx`. Never duplicate a component — extend or add to the right file instead. `src/shared/components.tsx` is a re-export barrel; import from it or from the specific sub-file.
- **Git commits**: Never add Co-authored-by lines to commit messages. Always use your own author identity (git config or system user).