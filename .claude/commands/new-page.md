Scaffold a new page for the expense tracker app. The page route and purpose is: $ARGUMENTS

Follow the project conventions exactly:

1. Create `app/<route>/page.tsx` with `"use client"` as the first line
2. Import and call `useExpenseContext()` to get `expenses` and `loaded`
3. Add the loading spinner guard before rendering any data:
   ```tsx
   if (!loaded) {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
       </div>
     );
   }
   ```
4. Use the card pattern for any content containers: `bg-white rounded-2xl border border-gray-100 shadow-sm p-6`
5. Add a nav link entry in `components/Navigation.tsx` — pick an appropriate Lucide icon and add it to the `links` array
6. Do NOT add outer padding or max-width to the page — `Providers` already wraps content in `max-w-6xl mx-auto px-4 sm:px-6 py-8`
7. Run `npm run typecheck` to confirm no type errors
