# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (type-checks + lints)
npm run start    # Serve production build
npm run lint     # ESLint via next lint
```

Reset demo data from the browser console:
```js
localStorage.removeItem('expense_tracker_data'); location.reload();
```

---

## What this app is

**Expensify** — a fully client-side personal expense tracker. Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts. No backend, no database. All data lives in `localStorage` under the key `expense_tracker_data` (defined in `lib/constants.ts`).

On first visit (key absent), `lib/storage.ts` auto-seeds 20 demo expenses from `lib/seedData.ts` so every feature is immediately explorable.

Routes:
- `/` — Dashboard: KPI cards, bar/donut charts, category breakdown, last 5 expenses
- `/expenses` — Full filterable/searchable list with CSV export
- `/insights` — Monthly spending breakdown with a donut chart and budget streak

---

## Architecture

### Data flow

```
lib/storage.ts           (localStorage read/write, SSR-safe)
      ↓
hooks/useExpenses.ts     (all CRUD + React state)
      ↓
app/providers.tsx        (context provider + Navigation + global Add modal)
      ↓
app/*/page.tsx           (pages — pull from context, hold no expense state)
      ↓
components/*.tsx         (receive expenses[] as props, own only UI state)
```

### State: `hooks/useExpenses.ts`

The single source of truth. Two `useEffect`s cooperate carefully:

1. **Mount effect** — calls `loadExpenses()`, sets state, flips `loaded = true`.
2. **Sync effect** — calls `saveExpenses(expenses)` on every change, but **guards on `loaded`** to prevent overwriting `localStorage` with an empty array before the initial read completes.

CRUD functions are `useCallback`-wrapped. `addExpense` returns the new `Expense` object so callers can act on it immediately.

### Context: `app/providers.tsx`

`"use client"` root rendered inside the server-component `app/layout.tsx`. Responsibilities:

- Exposes `{ expenses, loaded, addExpense, updateExpense, deleteExpense, openAddModal }` via `useExpenseContext()`.
- Renders `<Navigation>` and the `<main>` wrapper (`max-w-6xl mx-auto px-4 sm:px-6 py-8`) — pages must not add their own outer padding.
- Owns the global "Add Expense" modal. Any component calls `openAddModal()` to open it.

All pages call `useExpenseContext()` and hold no local expense state.

---

## Data model

```ts
interface Expense {
  id: string;          // `${Date.now()}-${random7chars}` via generateId()
  date: string;        // YYYY-MM-DD — NOT a full ISO timestamp
  amount: number;      // USD float, rounded to 2 decimal places on submit
  category: Category;  // "Food" | "Transportation" | "Entertainment" | "Shopping" | "Bills" | "Other"
  description: string; // trimmed, max 200 characters
  createdAt: string;   // full ISO timestamp, set once at creation, never mutated
}
```

**`date` vs `createdAt`**: filters and chart grouping use `date` (user-chosen). `createdAt` is the system insert time and is never read by UI logic.

**Date comparisons use string ordering**: `filterExpenses` compares `e.date < filters.dateFrom` as plain strings. This is intentional — YYYY-MM-DD sorts lexicographically = chronologically. Do not refactor to `Date` objects; it introduces timezone edge cases.

**Amount precision**: `ExpenseForm` submits `parseFloat(parseFloat(form.amount).toFixed(2))` — the double-parse ensures at most 2 decimal places without storing a string.

---

## Key files and their roles

| File | Role |
|------|------|
| `lib/types.ts` | Single source of truth for all shared TypeScript types |
| `lib/constants.ts` | `CATEGORIES` array, `CATEGORY_COLORS` (hex), `CATEGORY_BG` (Tailwind), `STORAGE_KEY` |
| `lib/utils.ts` | Pure helpers: `cn()`, formatting, filtering, chart transforms, CSV export |
| `lib/storage.ts` | Thin localStorage wrapper with `typeof window === "undefined"` SSR guard |
| `lib/seedData.ts` | 20 hardcoded demo expenses; only used by `storage.ts` on first visit |

---

## Critical conventions

### Two separate color systems — never mix them

Recharts renders to SVG and cannot process Tailwind class strings. Two maps in `lib/constants.ts`:

- **`CATEGORY_COLORS`** — hex values (e.g. `"#f59e0b"`). Use for Recharts `fill`/`stroke` and inline `style` attributes.
- **`CATEGORY_BG`** — Tailwind class strings (e.g. `"bg-amber-100 text-amber-800"`). Use for `CategoryBadge` and chip UI.

Passing a Tailwind class to a Recharts `fill` is a silent failure — the chart renders colorless.

### `cn()` for all conditional Tailwind

Always use `cn(...inputs)` from `lib/utils` (clsx + tailwind-merge). It resolves conflicts correctly — `cn("p-4", isCompact && "p-2")` → `"p-2"`, not `"p-4 p-2"`.

### `"use client"` boundary

`app/layout.tsx` is the only server component. `app/providers.tsx` is the `"use client"` root. Every page and component is a client component. There is no server-side data fetching.

### `loaded` flag — always check before rendering

Between initial render and the mount effect, `expenses` is `[]`. Every page guards:

```tsx
if (!loaded) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
```

Use this exact pattern for consistency. Never render charts or lists before `loaded` is true.

### Adding a new expense category

Four places must stay in sync — missing any one causes a runtime gap:

1. `lib/types.ts` — add to the `Category` union
2. `lib/constants.ts` — add to `CATEGORIES` array
3. `lib/constants.ts` — add to `CATEGORY_COLORS` (hex)
4. `lib/constants.ts` — add to `CATEGORY_BG` (Tailwind)

Optionally add to `CATEGORY_EMOJI` in `components/MonthlyInsights.tsx` (falls back to `"💰"`).

---

## Component details

### `ExpenseForm`

Dual-purpose add/edit form. `initial?: Expense` pre-fills fields and changes the submit label to "Save Changes". Validation runs on submit only; errors clear field-by-field as the user edits. Date is capped at today via `max`. Always rendered inside `<Modal>` — the add-modal lives in `Providers`, the edit-modal lives inside `ExpenseList`.

### `ExpenseList`

Owns `editTarget` and `deleteTarget` state to drive its own edit and delete-confirm modals. Action buttons are hidden by default, revealed on row hover via Tailwind `group`/`group-hover:opacity-100`. Receives `onUpdate`/`onDelete` as props rather than calling context directly, keeping it reusable.

### `SpendingCharts`

Two Recharts charts in a responsive 2-column grid. Bar chart shows last 6 months via `getMonthlyChartData()`; donut chart shows all-time by category via `getCategoryChartData()`. Both use `<ResponsiveContainer width="100%" height={220}>`. When `expenses.length === 0`, placeholder divs replace charts to avoid Recharts errors on empty data.

### `MonthlyInsights`

Filters expenses to the current calendar month, then shows: a donut chart, top 3 categories with colored left-border indicators, and a **budget streak** (consecutive days backwards from today with at least one recorded expense, computed by `computeStreak()` inside the file).

### `Modal`

Closes on Escape (via `useEffect`) and backdrop click. Renders `null` when closed — children fully unmount. Does not trap focus.

### `Navigation`

Sticky header (`z-40`). Desktop: horizontal nav links + "Add Expense" button. Mobile: tab bar rendered as a second `div` inside the same `<header>`. Active link uses exact `usePathname()` equality — no prefix matching.

### `ExpenseFilters`

Manages filter state internally, calls `onChange(filters)` on every change. The parent (`/expenses` page) owns the derived `filtered` array via `useMemo`.

---

## `lib/utils.ts` function reference

| Function | Purpose |
|----------|---------|
| `cn(...inputs)` | clsx + tailwind-merge — always use for conditional Tailwind classes |
| `formatCurrency(amount)` | `Intl.NumberFormat` en-US USD string |
| `formatDate(dateStr)` | `parseISO` + date-fns `format` → `"MMM d, yyyy"` |
| `generateId()` | `${Date.now()}-${random7chars}` |
| `filterExpenses(expenses, filters)` | Applies all four filter fields; `"All"` skips category check |
| `getMonthlyTotal(expenses)` | Sum of expenses in the current calendar month using `isWithinInterval` |
| `getCategorySummaries(expenses)` | `CategorySummary[]` sorted by total descending, with percentage |
| `getMonthlyChartData(expenses)` | Last 6 months aggregated by `YYYY-MM` key, formatted for Recharts |
| `getCategoryChartData(expenses)` | Per-category totals with hex color from `CATEGORY_COLORS` for Recharts |
| `exportToCSV(expenses)` | Builds CSV string, triggers browser download via `URL.createObjectURL` |

---

## Adding a new page

1. Create `app/<route>/page.tsx` with `"use client"`.
2. Call `useExpenseContext()` for `expenses` and `loaded`.
3. Guard with the spinner pattern above before `loaded` is true.
4. Add an entry to the `links` array in `components/Navigation.tsx` (href, label, Lucide icon).
5. No changes to `layout.tsx` or `providers.tsx` needed.

---

## Styling conventions

- **Card pattern**: `bg-white rounded-2xl border border-gray-100 shadow-sm p-6` — used on every card surface.
- **Border radius**: `rounded-2xl` for cards, `rounded-xl` for buttons/inputs, `rounded-lg` for icon buttons.
- **Spacing**: `space-y-6` between page sections; `space-y-4` or `space-y-5` within cards.
- **Focus ring**: `focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow` on all inputs.
- **Colors**: `blue-600` primary, `red-600` destructive, `green-500` positive. Text: `gray-900` primary, `gray-500` secondary, `gray-400` tertiary/placeholder.
