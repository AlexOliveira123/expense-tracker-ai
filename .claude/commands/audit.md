Audit the expense tracker codebase for issues. Focus on:

1. **Color system misuse** — check all components for any Recharts `fill` or `stroke` props receiving values from `CATEGORY_BG` (Tailwind strings) instead of `CATEGORY_COLORS` (hex). This is a silent failure.
2. **Missing `loaded` guards** — check every file that calls `useExpenseContext()` and renders expense data. Each must check `if (!loaded)` and return the spinner before rendering lists or charts.
3. **Category sync** — confirm that `CATEGORIES`, `CATEGORY_COLORS`, `CATEGORY_BG` in `lib/constants.ts` and the `Category` union in `lib/types.ts` all contain the same set of categories. Also check `CATEGORY_EMOJI` in `components/MonthlyInsights.tsx`.
4. **Direct localStorage access** — flag any code that calls `localStorage` directly outside of `lib/storage.ts`. All localStorage access must go through `loadExpenses()` / `saveExpenses()` to keep the SSR guard in one place.
5. **Context usage in components** — flag any component under `components/` that calls `useExpenseContext()` directly. Components should receive `expenses` as props; only pages should consume context.

Report each finding with the file path, line number, and a one-line description of the issue.
