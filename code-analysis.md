# Data Export Feature — Code Analysis

Branches analysed: `feature-data-export-v1`, `feature-data-export-v2`, `feature-data-export-v3`  
Base: `main` (no export functionality)  
Analyst: Claude Code  
Date: 2026-05-26

---

## Executive Summary

| Dimension | V1 | V2 | V3 |
|---|---|---|---|
| Files changed | 1 | 5 | 8 |
| New components | 0 | 2 | 6 |
| New libraries | 0 | 2 | 3 |
| Export formats | CSV only | CSV, JSON, PDF | CSV, JSON, PDF |
| UI pattern | Inline button | Modal dialog | Slide-in drawer |
| State complexity | None | Medium (useState/useMemo) | High (persisted state) |
| Filtering | None | Date range + categories | Template-based presets |
| Cloud features | None | None | Simulated |
| Scheduling | None | None | Simulated |
| Production-ready | Yes | Yes | Partial (UI only) |

---

## V1 — Simple CSV Export

### Files Created/Modified

| File | Change |
|---|---|
| `app/page.tsx` | Added `Download` icon import, `exportToCSV` import, Export button |
| `lib/utils.ts` | `exportToCSV()` function (pre-existing in baseline, called here) |

No new files. No new dependencies.

### Code Architecture Overview

V1 is a minimal feature addition: a single button in the dashboard header that directly calls `exportToCSV(expenses)` from `lib/utils.ts`. The entire export logic lives in one utility function. There is no new component, no state, no dialog.

```
page.tsx
  └── button onClick → exportToCSV(expenses)  [lib/utils.ts]
```

### Key Components and Responsibilities

**`exportToCSV(expenses: Expense[])` in `lib/utils.ts`**

- Builds a CSV string with headers: Date, Description, Category, Amount
- Wraps description in quotes, escaping embedded quotes (`""`)
- Creates a `Blob` with MIME type `text/csv;charset=utf-8;`
- Generates a timestamped filename (`expenses-YYYY-MM-DD.csv`)
- Triggers download via a programmatically clicked `<a>` element
- Revokes the object URL immediately after click

**`page.tsx` button**

- Calls `exportToCSV(expenses)` directly on click
- Disabled when `expenses.length === 0` (`disabled:opacity-40 disabled:cursor-not-allowed`)
- No loading state, no feedback after export

### Libraries and Dependencies

No new dependencies added. Uses only the pre-existing stack:
- `date-fns` — for `format(new Date(), "yyyy-MM-dd")` in filename generation
- Native browser APIs — `Blob`, `URL.createObjectURL`, `URL.revokeObjectURL`

### Implementation Patterns

- **Utility function pattern** — export logic lives in a shared utility, not a component
- **Direct DOM manipulation** — dynamically creates and clicks an `<a>` element
- **Eager execution** — no confirmation step, no configuration, no async operations
- **Stateless** — no React state involved; the button is pure fire-and-forget

### Code Complexity Assessment

Very low. The change to `page.tsx` is ~5 lines. The `exportToCSV` function is 14 lines. No conditional logic beyond the guard against zero expenses. Cognitive overhead is minimal.

### Error Handling

None. There is no `try/catch` around the export. If `Blob` construction or `URL.createObjectURL` throws (e.g., quota exceeded), the error would propagate uncaught to the browser console. The `disabled` state prevents export when the list is empty.

### Security Considerations

- **CSV injection**: No protection against formula-injection attacks. If a description starts with `=`, `-`, `+`, or `@`, spreadsheet applications may interpret it as a formula. Since data originates from the user's own local storage, the risk is limited to self-XSS in import scenarios, not server-side.
- No data leaves the client; everything is local.

### Performance Implications

- Synchronous construction of the CSV string; for very large datasets this could briefly block the main thread.
- Object URL is revoked immediately after click, preventing memory leaks.
- No bundle size increase.

### Extensibility and Maintainability

Low extensibility — adding new formats would require modifying `utils.ts` and `page.tsx`. The utility function is not parameterised for columns or formatting options. The approach works, but does not scale to additional requirements without refactoring.

### Technical Deep Dive

**How does the export work?**

1. User clicks button → `exportToCSV(expenses)` called synchronously.
2. CSV string assembled with `Array.join`.
3. `new Blob([csv], { type: "text/csv;charset=utf-8;" })` creates an in-memory file.
4. `URL.createObjectURL(blob)` produces a temporary `blob:` URL.
5. A hidden `<a href=blob_url download=filename>` is clicked programmatically.
6. Browser initiates a file download.
7. `URL.revokeObjectURL(url)` releases the reference.

**Column ordering:** Date → Description → Category → Amount (differs from V2/V3 which use Date → Category → Description → Amount).

**State management:** None — no React state is involved.

**Edge case handling:** Only one — the empty array guard via the `disabled` prop.

---

## V2 — Advanced Export Modal

### Files Created/Modified

| File | Change | Type |
|---|---|---|
| `app/page.tsx` | `useState(exportOpen)`, `ExportModal` render | Modified |
| `components/ExportModal.tsx` | Full-featured export modal | Created |
| `components/ui/Modal.tsx` | Reusable modal primitive | Created |
| `lib/exporters.ts` | CSV, JSON, PDF export functions | Created |
| `package.json` / `package-lock.json` | Added `jspdf`, `jspdf-autotable` | Modified |

### Code Architecture Overview

V2 introduces a clean three-layer separation:

```
page.tsx
  └── ExportModal (components/ExportModal.tsx)
        ├── Modal (components/ui/Modal.tsx)          ← primitive
        └── exporters.ts (lib/exporters.ts)          ← format logic
              ├── exportCSV()
              ├── exportJSON()
              └── exportPDF()   [dynamic imports jspdf]
```

The `Modal` primitive is generic and reusable. `ExportModal` owns all the configuration state (format, date range, categories, filename). The `lib/exporters.ts` module handles actual file generation, independently of the UI.

### Key Components and Responsibilities

**`components/ui/Modal.tsx`**

- Generic, reusable modal overlay
- Props: `isOpen`, `onClose`, `title`, `children`, `size` (`md | lg | xl`)
- Handles `Escape` key via `useEffect` listener
- Backdrop click closes the modal
- CSS `backdrop-blur-sm` and `bg-black/50` overlay
- `max-h-[90vh] overflow-y-auto` for tall content
- Portals/teleports into current DOM position (not a true portal — no `createPortal`)

**`components/ExportModal.tsx`**

The main feature component. Responsibilities:
- **Format selection** — 3-card format picker (CSV / JSON / PDF) with icons and descriptions
- **Date range filtering** — two date inputs with mutual `min`/`max` constraints
- **Category filtering** — per-category checkboxes with a select-all toggle using `Set<Category>`
- **Filename override** — text input with smart auto-generated default
- **Live preview** — inline table showing up to 8 filtered records with summary counts
- **Export orchestration** — calls the appropriate exporter, manages `ExportStatus` transitions
- **Reset on close** — all state is reset after modal close (via `setTimeout` to allow exit animation)

State managed:
```typescript
format_: ExportFormat           // "csv" | "json" | "pdf"
dateFrom, dateTo: string        // date inputs
selectedCategories: Set<Category>
filenameOverride: string
status: ExportStatus            // "idle" | "exporting" | "done" | "error"
errorMsg: string
```

Derived state via `useMemo`:
- `filtered` — expenses matching active filters
- `defaultFilename` — computed from date range
- `totalAmount` — sum of filtered expenses

**`lib/exporters.ts`**

Three async export functions sharing a `triggerDownload` helper:

- `exportCSV(expenses, filename)` — builds CSV string; columns: Date, Category, Description, Amount
- `exportJSON(expenses, filename)` — serialises to JSON with metadata envelope (`exportedAt`, `totalRecords`, `totalAmount`); strips `id` and `createdAt` fields from individual records
- `exportPDF(expenses, filename)` — dynamically imports `jspdf` and `jspdf-autotable`; renders a styled A4 PDF with: blue header bar, summary strip, formatted data table with alternating rows, total footer row, per-page footers with page numbers

### Libraries and Dependencies

| Library | Version | Purpose |
|---|---|---|
| `jspdf` | `^2.5.1` | PDF generation (client-side) |
| `jspdf-autotable` | `^3.8.2` | Table layout plugin for jsPDF |

`jspdf` + `jspdf-autotable` are dynamically imported inside `exportPDF()` to keep them out of the initial JS bundle. They only load when the user actually selects PDF and clicks Export.

### Implementation Patterns

- **Controlled form pattern** — all inputs are controlled React state
- **`useMemo` for derived data** — `filtered` list recomputes only when dependencies change
- **`useCallback` for event handlers** — `toggleCategory`, `toggleAll`, `handleExport`, `handleClose` are memoised
- **Async export with status machine** — `ExportStatus` drives all button states and feedback messages
- **Artificial loading delay** — `await new Promise(r => setTimeout(r, 600))` makes the exporting state perceptible to the user
- **Dynamic imports** — jsPDF loaded lazily on demand
- **State reset on close** — `setTimeout` defers reset until after CSS exit animation completes

### Code Complexity Assessment

Medium. `ExportModal.tsx` is ~300 lines but well-structured with clear section comments. The state machine for `ExportStatus` is straightforward (4 states). The PDF generation code in `exporters.ts` is the most complex (~40 lines) due to jsPDF's imperative API. The `buildDefaultFilename` helper cleanly handles all date range permutations.

### Error Handling

- `try/catch` wraps the full export operation in `handleExport`
- On error: sets `status = "error"`, stores `err.message` in `errorMsg`, auto-resets to `"idle"` after 3 seconds
- Export button is disabled during `"exporting"` to prevent double-submission
- Close button is disabled during `"exporting"` to prevent data loss
- Empty filtered result disables the export button (`filtered.length === 0`)
- Date inputs have mutual `max`/`min` constraints to prevent invalid ranges

### Security Considerations

- **CSV injection**: Same risk as V1 — no formula prefix stripping. Description is quoted and internal quotes are escaped, which prevents CSV parsing issues but not formula injection in spreadsheet apps.
- **JSON output**: `id` and `createdAt` are stripped from exported records — a minor data hygiene measure.
- **PDF content**: jsPDF renders data as text strings; no HTML injection surface.
- No network requests; all export operations are client-side.

### Performance Implications

- `useMemo` on `filtered` prevents recalculation on unrelated re-renders.
- jsPDF and jspdf-autotable are dynamically imported only on PDF export — keeps initial bundle lean. First PDF export incurs a dynamic import round-trip.
- The preview table renders max 8 rows regardless of dataset size.
- `filterExpenses` inside `useMemo` is O(n) over the expense list; fine for typical personal finance datasets.

### Extensibility and Maintainability

High. The three-layer architecture makes it easy to:
- Add a new format: add a function to `exporters.ts`, add an entry to `FORMAT_OPTIONS`, wire it in `handleExport`
- Add a new filter: add state and a filter clause to the `filtered` useMemo
- Use the `Modal` primitive elsewhere (it has no knowledge of export)
- Swap out jsPDF for another PDF library — only `exportPDF()` needs to change

### Technical Deep Dive

**How does filtering work?**

The `filtered` array is computed in a `useMemo` that evaluates: (1) category membership in `selectedCategories` Set; (2) `e.date >= dateFrom` if set; (3) `e.date <= dateTo` if set. Date strings are compared lexicographically (ISO format `YYYY-MM-DD` sorts correctly without parsing).

**PDF generation approach:**

The PDF is built imperatively with jsPDF's drawing API:
1. Blue filled rectangle as header band
2. White text for title and generation timestamp
3. Light blue rectangle for summary strip
4. `autoTable()` generates the data table with styled header, alternating row fills, and a total footer row
5. A page-number loop iterates `doc.internal.getNumberOfPages()` to add footers

**State management pattern:**

All state lives in `ExportModal`. No context, no external store. State is local to the modal's lifetime and reset on close. This keeps the component self-contained and easy to test.

**Column ordering change vs V1:** V2 and V3 use Date → Category → Description → Amount (V1 used Date → Description → Category → Amount). This is a subtle inconsistency that would affect anyone who scripts against the exports.

---

## V3 — Cloud-Integrated Export System

### Files Created/Modified

| File | Change | Type |
|---|---|---|
| `app/page.tsx` | `useState(drawerOpen)`, `ExportDrawer` render, `CloudUpload` icon | Modified |
| `components/ExportDrawer.tsx` | Drawer shell, tab navigation, shared state | Created |
| `components/export/TemplatesTab.tsx` | Pre-built template cards | Created |
| `components/export/SendShareTab.tsx` | Email, cloud service connections, shareable link+QR | Created |
| `components/export/ScheduleTab.tsx` | Automated schedule cards with toggle | Created |
| `components/export/HistoryTab.tsx` | Grouped timeline of past exports | Created |
| `lib/cloudExport.ts` | Types, localStorage helpers, templates, seed data | Created |
| `package.json` / `package-lock.json` | Added `qrcode` (jspdf already in v2) | Modified |

### Code Architecture Overview

V3 uses a component-folder pattern with a drawer shell orchestrating four specialised tab components:

```
page.tsx
  └── ExportDrawer (components/ExportDrawer.tsx)          ← shell + shared state
        ├── TemplatesTab (components/export/TemplatesTab.tsx)
        │     └── lib/cloudExport.ts (templates, filters, builders)
        ├── SendShareTab (components/export/SendShareTab.tsx)
        │     └── lib/cloudExport.ts (cloud meta, history helpers)
        ├── ScheduleTab (components/export/ScheduleTab.tsx)
        │     └── lib/cloudExport.ts (schedule types, default data)
        └── HistoryTab (components/export/HistoryTab.tsx)
              └── lib/cloudExport.ts (history types)
```

`lib/cloudExport.ts` acts as the domain model layer — all types, constants, localStorage I/O, and data-transformation functions are centralised there.

### Key Components and Responsibilities

**`components/ExportDrawer.tsx`** — Orchestrator

- Renders the slide-in drawer panel (CSS `transform: translateX` transition)
- Manages the tab navigation (`Tab` union type: `"templates" | "send" | "schedule" | "history"`)
- Owns all shared persisted state: `history`, `connections`, `schedules`
- Hydrates state from `localStorage` on mount (`useEffect`)
- Exposes callbacks to child tabs: `addToHistory`, `clearHistory`, `handleConnectionChange`, `toggleSchedule`
- Shows live status in header: connected service count, active schedule count, total history count
- Escape key closes the drawer

**`components/export/TemplatesTab.tsx`** — Quick-export presets

- Renders 6 pre-configured export template cards from `EXPORT_TEMPLATES`
- Each card shows: icon, name, format badge, description, date range label, filtered record count, total amount
- "Recommended" ribbon on the monthly summary template
- Per-template loading state (`running`) and success state (`done`) managed with `useState`
- `runTemplate()` applies date/category filters, generates the file (CSV/JSON/PDF), triggers download, and adds a history entry
- PDF generation falls back to CSV if jsPDF import fails (graceful degradation)

**`components/export/SendShareTab.tsx`** — Delivery mechanisms

Three distinct sub-sections:

1. **Send via Email** — email input + format selector (CSV/JSON); simulates a 2-second send delay; records to history with recipient
2. **Cloud Destinations** — grid of 4 cloud service cards (Google Drive, Dropbox, OneDrive, Google Sheets); simulates connect/disconnect with fake account and storage data; "Sync Now" simulates upload and updates `lastSync`
3. **Shareable Link + QR** — generates a random 6-char share code; dynamically imports `qrcode` to render a QR image as a `data:` URL; copy-to-clipboard; records to history with share code

**`components/export/ScheduleTab.tsx`** — Automation UI

- Renders 3 pre-configured schedule cards (daily, weekly, monthly)
- Toggle switch per schedule (`onToggle` callback bubbles to drawer)
- Shows: frequency, time, destination, template reference, format badge, next-run countdown, last-run date
- Informational banner explicitly marks the feature as "simulated" — schedules are not executed

**`components/export/HistoryTab.tsx`** — Audit trail

- Stats strip: total / successful / failed export counts
- Filter bar: all / completed / failed
- Timeline grouped by day (Today / Yesterday / date string)
- Each entry: status icon, destination emoji, template name, format badge, destination label, record count, file size, timestamp
- "Clear history" button

**`lib/cloudExport.ts`** — Domain model

- All TypeScript types for the feature (`CloudService`, `ExportFormat`, `ExportDestination`, `ExportSchedule`, `ExportHistoryEntry`, `ExportTemplate`, `CloudConnection`)
- localStorage read/write helpers (`ls`, `lsSet`) with SSR guard (`typeof window === "undefined"`) and JSON parse error handling
- `loadHistory/saveHistory`, `loadConnections/saveConnections`, `loadSchedules/saveSchedules`
- `EXPORT_TEMPLATES` — 6 pre-configured template objects
- `applyTemplateFilter()` — filters expenses by template's `dateRange` and `categories`
- `buildCSV()`, `buildJSON()` — format builders (no external deps)
- `triggerDownload()` — shared download helper
- `CLOUD_SERVICE_META` — display metadata per service
- `SEED_HISTORY` — 8 sample history entries seeded on first load
- `DEFAULT_SCHEDULES` — 3 pre-configured schedule objects
- `newHistoryEntry()` — factory that adds `id` and `timestamp`

### Libraries and Dependencies

| Library | Version | Purpose |
|---|---|---|
| `jspdf` | `^2.5.1` | PDF generation (dynamic import in TemplatesTab) |
| `jspdf-autotable` | `^3.8.2` | PDF table layout |
| `qrcode` | `^1.5.3` | QR code generation as base64 data URL |

All three are dynamically imported at point of use:
- `jspdf` / `jspdf-autotable` — only when a PDF template is run
- `qrcode` — only when "Generate Link & QR Code" is clicked

### Implementation Patterns

- **Drawer UI pattern** — slide-in panel from the right, 640px wide, full viewport height; CSS transition on `translateX`
- **Compound component pattern** — `ExportDrawer` acts as a context provider (via props) for its tab children
- **Prop drilling for shared state** — history, connections, schedules passed down as props + callbacks (no React context used)
- **localStorage persistence** — SSR-safe `ls`/`lsSet` helpers abstract storage access
- **Seed data on first load** — `loadHistory` seeds `SEED_HISTORY` if storage is empty, giving the UI a populated look immediately
- **Optimistic UI** — simulated async delays (900ms for templates, 1800ms for cloud connect, 1500ms for sync, 2000ms for email) give the impression of real network operations
- **Dynamic imports** — jsPDF and qrcode loaded lazily
- **Component folder** — `components/export/` sub-directory groups all tab components

### Code Complexity Assessment

High overall, though well-organised. `lib/cloudExport.ts` is the largest file (~280 lines) and functions as the single source of truth for the entire feature's data model. `SendShareTab.tsx` is the most complex component (~250 lines) with three independent async flows. The drawer orchestrator is clean (~130 lines). The tab components are focused and readable.

### Error Handling

- `loadHistory` / `loadConnections` / `loadSchedules` all have `try/catch` around JSON parsing with fallback to defaults
- SSR guard in all localStorage functions prevents server-side render errors (`typeof window === "undefined"`)
- PDF export in TemplatesTab falls back to CSV if the dynamic import fails (`try/catch`)
- Email send and cloud connect simulate 100% success — no simulated failure states (except the pre-seeded failed history entry)
- `generateLink` in SendShareTab has a `finally` block to clear `generatingQr` even if QR generation throws

### Security Considerations

- **All cloud features are simulated** — no real OAuth, no real API calls, no credentials. Fake account emails and storage data are hardcoded strings.
- **Shareable links are fake** — `expensify.demo/r/CODE` URLs do not exist; no data is transmitted anywhere.
- **localStorage** — history, connections, and schedules persist in the browser. Contains no authentication tokens, only user-generated export metadata.
- **CSV injection** — same risk as V1/V2; not mitigated.
- **QR code** — generated entirely client-side from a fake URL. No external QR service called.
- **`navigator.clipboard`** — requires HTTPS or localhost; no fallback for insecure contexts.

### Performance Implications

- Drawer does not unmount when closed (`translate-x-full`) — state is preserved between opens, but the component stays in the DOM.
- `loadHistory/loadConnections/loadSchedules` run on mount (single `useEffect`), incurring JSON parsing. Acceptable overhead.
- `applyTemplateFilter` runs synchronously for each template card on every render of TemplatesTab — O(6 × n) where n = expense count. Fine at personal-finance scale.
- `SEED_HISTORY` (8 entries) written to localStorage on first load — trivial.
- qrcode library is ~60KB gzipped; dynamically imported only on demand.

### Extensibility and Maintainability

Very high for UI/UX expansion. The component folder structure and centralised `lib/cloudExport.ts` make it straightforward to add tabs, templates, or cloud services.

**However, the current implementation has a significant production gap:** all cloud, email, and scheduling features are simulated with `setTimeout`. Converting them to real integrations would require:

- OAuth flows for each cloud service
- A server-side email sending API (or third-party service like SendGrid/Resend)
- A backend scheduler (cron job or queue) to execute scheduled exports
- A real file sharing/storage backend for shareable links

The types in `lib/cloudExport.ts` are well-designed for this transition — they are backend-agnostic and could be directly used with a real API.

### Technical Deep Dive

**How do templates work?**

`EXPORT_TEMPLATES` is a static array of 6 `ExportTemplate` objects. Each defines: `id`, `name`, `icon`, format, `dateRange` enum, and `categories`. `applyTemplateFilter()` maps `dateRange` values to actual date ranges computed from `new Date()` at runtime. This means "current-month" always resolves to the real current month — templates are time-aware without storing dates.

**Shareable link + QR flow:**

1. `randomShareCode()` generates a 6-char alphanumeric string
2. A fake `expensify.demo/r/CODE` URL is constructed
3. `qrcode.toDataURL(url, options)` returns a PNG as a base64 `data:` string
4. The `<img>` tag renders the QR code entirely from the data URL — no `<img src="...external...">` call
5. The URL is copied via `navigator.clipboard.writeText()`

**localStorage schema:**

```
expensify_export_history    → ExportHistoryEntry[]
expensify_cloud_connections → Record<CloudService, CloudConnection>
expensify_export_schedules  → ExportSchedule[]
```

No versioning scheme — a schema change would require a migration strategy.

**State management:**

Three slices of persisted state (`history`, `connections`, `schedules`) live in `ExportDrawer` and are passed down as props with matching callbacks. This is intentional prop drilling rather than context — at 4 tabs and one level of nesting, the overhead is acceptable. A context or Zustand store would be warranted if the component tree deepened.

---

## Cross-Version Comparison

### Architecture Evolution

```
V1: page.tsx ──→ lib/utils.ts                    (flat utility call)
V2: page.tsx ──→ ExportModal ──→ lib/exporters   (modal + library layer)
V3: page.tsx ──→ ExportDrawer ──→ 4 tab components ──→ lib/cloudExport  (drawer + orchestration)
```

Each version adds an architectural layer, increasing capability and complexity in step.

### What Each Version Solves

| Problem | V1 | V2 | V3 |
|---|---|---|---|
| Export expenses | ✅ | ✅ | ✅ |
| Multiple formats | ❌ | ✅ (CSV/JSON/PDF) | ✅ (CSV/JSON/PDF) |
| Filter before export | ❌ | ✅ (date + category) | ✅ (template-based) |
| Preview before export | ❌ | ✅ (live table) | ❌ (per-template counts only) |
| Custom filename | ❌ | ✅ | ❌ |
| Export history | ❌ | ❌ | ✅ |
| Cloud integration | ❌ | ❌ | ⚠️ simulated |
| Email delivery | ❌ | ❌ | ⚠️ simulated |
| Scheduling | ❌ | ❌ | ⚠️ simulated |
| State persisted | ❌ | ❌ | ✅ (localStorage) |
| Zero new dependencies | ✅ | ❌ | ❌ |
| Production-ready | ✅ | ✅ | Partial |

### Code Quality Observations

**V1 strengths:** Minimal, predictable, zero risk surface.  
**V1 weaknesses:** No extensibility; no user feedback; CSV injection risk.

**V2 strengths:** Clean separation of concerns; excellent error handling; live preview is a strong UX; PDF quality is high; `Modal` primitive is reusable.  
**V2 weaknesses:** Column ordering inconsistency with V1 (minor); no persistence of export history.

**V3 strengths:** Well-typed domain model; component folder is clean; localStorage persistence is well-abstracted with SSR guards; drawer UX feels modern; seed data makes the UI immediately compelling.  
**V3 weaknesses:** Cloud/email/scheduling features are mock-only — a user clicking "Send Report" receives no actual email; no indication in production that features are unimplemented beyond the "SIMULATED" label on the share link; localStorage has no schema versioning; `navigator.clipboard` lacks HTTPS fallback.

### Column Ordering Inconsistency

V1's `exportToCSV` uses: **Date, Description, Category, Amount**  
V2's `exportCSV` and V3's `buildCSV` use: **Date, Category, Description, Amount**

If users switch implementations, existing scripts or spreadsheet templates that reference columns by position would break. This should be standardised before shipping.

### Shared Utility Duplication

`exportToCSV` (V1 in `lib/utils.ts`) and `exportCSV`/`buildCSV` (V2/V3) all implement CSV generation independently. If any bug existed (e.g., in quote escaping), it would need to be fixed in multiple places. A merge should consolidate these.

---

## Recommendations

### If shipping now: adopt V2
V2 is production-ready, meaningfully improves UX over V1 (multi-format, filtering, preview, error handling), and adds no technical debt. It is fully implemented — every feature visible in the UI works end-to-end.

### If planning a roadmap: use V3 as the UI foundation
V3's architecture (`ExportDrawer`, component folder, `lib/cloudExport.ts` domain model) is the most scalable. The types and data shapes are well-designed for a real backend. However, ship it only after wiring real implementations for cloud, email, and scheduling — or clearly gate the unimplemented features.

### Suggested merge strategy

1. Take V2's `Modal` primitive as-is — it's reusable beyond export.
2. Take V2's `lib/exporters.ts` PDF generation — it's higher quality than V3's TemplatesTab PDF code.
3. Take V3's `lib/cloudExport.ts` type system and template definitions.
4. Take V3's `ExportDrawer` + component folder structure, replacing simulated cloud actions with real API calls.
5. Standardise CSV column ordering across all implementations.
6. Add formula-injection sanitisation to CSV output.
