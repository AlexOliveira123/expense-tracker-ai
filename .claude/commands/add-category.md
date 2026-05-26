Add a new expense category to the app. The category name is: $ARGUMENTS

Follow these steps exactly — all four files must be updated or the app will have runtime gaps (missing chart color, unstyled badge, broken type checks):

1. `lib/types.ts` — add the category name to the `Category` union type
2. `lib/constants.ts` — add to the `CATEGORIES` array, add a hex color entry to `CATEGORY_COLORS`, and add a Tailwind class string entry to `CATEGORY_BG` (follow the same pattern as existing entries)
3. `components/MonthlyInsights.tsx` — add an emoji entry to the `CATEGORY_EMOJI` map
4. Run `npm run typecheck` to confirm no type errors before finishing
