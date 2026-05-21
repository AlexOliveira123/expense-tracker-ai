# Expensify — Personal Expense Tracker

A modern, production-ready expense tracking web app built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** — Summary cards, monthly spending bar chart, category donut chart, and recent expenses
- **Expense management** — Add, edit, and delete expenses with form validation
- **Filtering & search** — Filter by keyword, category, and date range
- **CSV export** — Download any filtered view as a spreadsheet
- **Category breakdown** — Visual progress bars showing spend distribution across 6 categories
- **Data persistence** — All data stored in `localStorage`; survives page refreshes
- **Responsive** — Works on desktop and mobile with an adaptive navigation layout

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) — bar and pie charts
- [date-fns](https://date-fns.org/) — date formatting and arithmetic
- [Lucide React](https://lucide.dev/) — icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app seeds 20 demo expenses on first load so you can explore all features immediately.

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with shared Navigation and modal provider
│   ├── providers.tsx       # Global context: expense state + Add Expense modal
│   ├── page.tsx            # Dashboard page
│   └── expenses/
│       └── page.tsx        # Full expense list page
├── components/
│   ├── ui/
│   │   ├── Badge.tsx       # Category color badge
│   │   └── Modal.tsx       # Accessible modal dialog
│   ├── Navigation.tsx      # Top nav bar + mobile tab bar
│   ├── ExpenseForm.tsx     # Add/edit form with validation
│   ├── ExpenseList.tsx     # Expense rows with edit/delete actions
│   ├── ExpenseFilters.tsx  # Search, category, and date range filters
│   ├── SummaryCards.tsx    # Four KPI cards at the top of the dashboard
│   ├── SpendingCharts.tsx  # Monthly bar chart + category donut chart
│   └── CategoryBreakdown.tsx # Progress-bar breakdown by category
├── hooks/
│   └── useExpenses.ts      # CRUD operations + localStorage sync
└── lib/
    ├── types.ts            # Shared TypeScript types
    ├── constants.ts        # Categories, colors, storage key
    ├── utils.ts            # Formatting, filtering, chart data helpers
    ├── storage.ts          # localStorage read/write
    └── seedData.ts         # Demo expenses for first-time users
```

## Expense Categories

`Food` · `Transportation` · `Entertainment` · `Shopping` · `Bills` · `Other`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `http://localhost:3000` |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Resetting Demo Data

To clear all expenses and start fresh, run this in the browser console:

```js
localStorage.removeItem('expense_tracker_data'); location.reload();
```
