## Context

A single-page GitHub Pages web application that simulates and compares SAC vs Price mortgage amortization for the Brazilian market. The user enters financing parameters, clicks "Simular", and sees comparison summaries, full schedules (virtual-scrolled), charts, and an extraordinary amortization simulator. All computation is client-side. UI is pt-BR only.

Key drivers from upstream artifacts:
- Event-storming identified six calculation domains: Input Validation, SAC Engine, Price Engine, Schedule Builder, Comparison Analysis, Extraordinary Amortization
- Calculation-modeling structured these into a layered pipeline: Input → Validation → Engines → Schedule → Analysis → Output
- Specs define 14 user stories across core simulation, bank presets, income warnings, schedule viewing, charts, and extraordinary amortization

## Goals / Non-Goals

- Goals:
  - Accurate financial calculations verified against known reference examples
  - Clean separation between calculation logic (pure TypeScript) and UI (Svelte components)
  - Responsive single-page layout with shadcn-svelte components and Tailwind CSS
  - Charts via LayerChart (shadcn Chart wrapper)
  - Virtual scrolling for 360+ row schedule tables
  - Static build deployable to GitHub Pages

- Non-goals:
  - No backend, API, or database
  - No SSR — fully static via adapter-static
  - No user accounts or persistence beyond browser session
  - No internationalization (pt-BR hardcoded)
  - No SACRE system
  - No live TR fetching from BACEN — user enters optional static TR estimate

## Calculation Architecture

### Engine Structure

Layered pipeline in `src/lib/calc/` — pure TypeScript, zero Svelte imports:

```
src/lib/calc/
├── types.ts            ← shared interfaces (Period, Schedule, Totals, etc.)
├── inputs/
│   ├── validate.ts     ← Zod schemas + validation logic
│   └── defaults.ts     ← shipped bank rate presets + localStorage persistence helpers
├── engines/
│   ├── sac.ts          ← SAC period generator: (PV, n, i, tr?) → Period[]
│   └── price.ts        ← Price period generator: (PV, n, i, tr?) → Period[]
├── schedule/
│   └── build.ts        ← assembles Period[] into Schedule, handles rounding + final adjustment
├── analysis/
│   ├── compare.ts      ← (sacSchedule, priceSchedule) → ComparisonResult
│   └── extra-amort.ts  ← (baseSchedule, ExtraPayment[]) → { modified: Schedule, savings: SavingsSummary }
└── format.ts           ← BRL currency, pt-BR numbers, percentages
```

- Rationale: Each layer has a single responsibility. Engines produce raw Period arrays. Schedule builder handles rounding/finalization. Analysis consumes finalized schedules. This makes each layer independently unit-testable without DOM or Svelte runtime.
- Alternatives considered:
  - Single calculator module: simpler but harder to test individual formulas and grows unwieldy as features added
  - Class-based engines: unnecessary OOP overhead for what are stateless calculations

### State Management

Svelte 5 runes in a single reactive store file: `src/lib/stores/simulation.svelte.ts`

```typescript
// Reactive state using Svelte 5 runes
let rawInputs = $state<RawInputs>(defaultInputs);
let extraPayments = $state<ExtraPayment[]>([]);

// Derived values — recomputed when dependencies change
// These are NOT auto-computed on keystroke. They update when
// the user clicks "Simular" (which copies form state into rawInputs).
let validatedInputs = $derived(validate(rawInputs));
let sacSchedule = $derived(validatedInputs.ok ? buildSchedule('sac', validatedInputs.data) : null);
let priceSchedule = $derived(validatedInputs.ok ? buildSchedule('price', validatedInputs.data) : null);
let comparison = $derived(sacSchedule && priceSchedule ? compare(sacSchedule, priceSchedule) : null);
```

Flow:
1. User types into form fields (local component state, not yet in store)
2. User clicks "Simular" → form state is committed to `rawInputs`
3. `$derived` chain fires: validate → engines → schedule → comparison
4. UI components read derived state and render

For extraordinary amortization: separate "Simular" button commits `extraPayments` state, which triggers a second derived chain producing `modifiedSchedule` and `savings`.

No caching or memoization needed — recalculation is triggered only by explicit button click, and a 360-period schedule computes in <5ms on modern hardware.

### Bank Preset Persistence

Bank rate presets are user-configurable and persisted in `localStorage`:

- **Shipped defaults**: Caixa (10.49%), BB (12.00%), Itaú (11.60%), Santander (11.79%), Pro-Cotista (9.01%). Defined in `src/lib/calc/inputs/defaults.ts`.
- **Storage key**: `financing-simulator:bank-presets`
- **On page load**: Read from localStorage. If empty/missing/corrupt, fall back to shipped defaults.
- **On preset change**: Write updated list to localStorage immediately.
- **Restore defaults**: Replace localStorage entry with shipped defaults.
- **Data shape**: `BankPreset[]` — same type used for both shipped and user-defined presets.
- **No validation on preset rates**: Users may enter rates above SFH 12% cap (e.g., non-SFH products). The rate cap validation fires at simulation time, not at preset save time. This avoids blocking users who want to model non-SFH scenarios.

### Precision and Rounding

- **Internal computation**: Standard JavaScript `number` (IEEE 754 float64). This provides 15–17 significant digits, more than sufficient for mortgage calculations where values are in the R$ thousands-to-millions range.
- **Per-period rounding**: After computing each period's payment, interest, and amortization, round to 2 decimal places (centavos) using `Math.round(value * 100) / 100`. This matches how banks compute real schedules — they round each period, not just the final total.
- **Final period adjustment**: After iterating all periods, if the final balance is not exactly 0.00 due to cumulative rounding drift, adjust the last period's amortization so that `SD_n = 0.00` exactly. This ensures the schedule is internally consistent.
- **Why not BigDecimal/Decimal.js**: The rounding drift over 360 periods is typically < R$ 0.10. Per-period rounding + final adjustment handles this exactly. Adding a decimal library would increase bundle size for no user-visible benefit.

## Data and Formatting

### Number Formatting

All formatting in `src/lib/calc/format.ts` using `Intl.NumberFormat('pt-BR', ...)`:

- **Currency**: `R$ 1.234,56` — `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- **Percentage**: `10,50%` — `Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 })`
- **Integer**: `360` — plain number, no formatting needed for months
- **Input parsing**: Accept pt-BR formatted input (dots as thousands, commas as decimal). Parse by stripping dots, replacing comma with period, then `parseFloat()`.

### Rate Conversion

- **Annual to monthly (compound)**: `i_monthly = (1 + i_annual) ^ (1/12) - 1`
  - NOT simple division (`i_annual / 12`) — that's simple interest, incorrect for Brazilian mortgages
  - Input: annual rate as decimal (e.g., 0.10 for 10% a.a.)
  - Output: monthly rate as decimal (e.g., ~0.007974)
  - Implementation: `Math.pow(1 + annualRate, 1/12) - 1`

- **TR handling**: Optional monthly TR (default 0%). Applied BEFORE interest calculation:
  ```
  SD_corrected = SD_previous × (1 + TR_monthly)
  J_t = SD_corrected × i_monthly
  ```
  TR is additive to balance, not to rate. This is the correct method per BACEN rules.

- **Indexer**: All rates in this MVP are assumed "rate + TR" (SFH standard). The TR field lets the user optionally model the TR component. IPCA-indexed mortgages are out of scope.

## UI Architecture

### Component Tree

```
+page.svelte
├── Header (app title)
├── InputForm.svelte
│   ├── Field.Group (property/payment fields)
│   ├── Select (bank preset) + BankPresetManager (edit/add/remove dialog)
│   ├── Field.Group (income fields)
│   ├── Field (TR estimate, optional)
│   └── Button "Simular"
├── SummaryCards.svelte
│   ├── Card (SAC summary)
│   ├── Card (Price summary)
│   └── savings highlight
├── ComparisonCharts.svelte
│   ├── Chart.Container (payment evolution — line)
│   ├── Chart.Container (composition — stacked area)
│   └── Chart.Container (balance — line)
├── ScheduleTable.svelte
│   ├── Tabs (SAC | Price)
│   └── Table with @tanstack/svelte-virtual
└── ExtraAmortization.svelte
    ├── Select (base system)
    ├── ExtraPaymentList (dynamic add/remove)
    │   └── ExtraPaymentEntry (type, amount, month, modality, FGTS flag)
    ├── Button "Simular"
    ├── SummaryCards (with vs without)
    └── Chart.Container (balance comparison — dual line)
```

### shadcn-svelte Components Used

| shadcn Component | Usage |
|-----------------|-------|
| Button | "Simular" buttons, add/remove extra payment |
| Card | Summary cards (SAC, Price, savings, with/without) |
| Input | Monetary and numeric fields |
| Field | Form field groups with labels and descriptions |
| Select | Bank preset dropdown, system selector |
| Tabs | SAC / Price schedule toggle |
| Table | Schedule table structure (rows rendered by virtual scroller) |
| RadioGroup | Tipo (Pontual/Recorrente), Modalidade (Prazo/Parcela) |
| Chart | All three chart types (wraps LayerChart) |
| Dialog | Bank preset management modal |
| Alert | Income commitment and FGTS warnings |
| Checkbox | FGTS flag on extra payment entries |

### Virtual Scrolling

- Library: `@tanstack/svelte-virtual`
- Applied to the schedule table body: renders only visible rows + overscan buffer
- Table header stays fixed (CSS sticky)
- Row height is fixed (~40px) for consistent virtual scroll calculations
- Estimated item count: 360 (max 420) — well within virtual scroll sweet spot

### Charts (LayerChart via shadcn Chart)

Three charts, all using `Chart.Container` + `Chart.Tooltip`:

1. **Payment Evolution**: Two-series line chart. X = month (1..n), Y = payment (R$). Series: SAC (blue, declining) and Price (green, flat).
2. **Payment Composition**: Stacked area chart (one per system, toggled). X = month, Y = R$. Stacks: Juros (red-ish) and Amortização (blue-ish).
3. **Balance Remaining**: Two-series line chart. X = month, Y = balance (R$). Series: SAC (linear decline) and Price (concave curve).

Data preparation: the chart data is derived from the Schedule.periods arrays. No separate computation needed — just map Period[] to the shape LayerChart expects.

## Deployment and Performance

### Build and Deployment

- SvelteKit with `@sveltejs/adapter-static`
- `svelte.config.js`: set `paths.base` to repo name (e.g., `/repo-name`)
- `src/routes/+layout.ts`: `export const prerender = true;`
- `static/.nojekyll` file to prevent Jekyll processing

### GitHub Actions CI/CD

Two workflows, both in `.github/workflows/`:

**1. CI — `ci.yml`** (runs on every push and PR to `main`)
- Trigger: `push` to `main`, `pull_request` to `main`
- Steps:
  - Checkout code
  - Setup Node.js (LTS, e.g., 22.x) with npm cache
  - `npm ci` (clean install from lockfile)
  - `npm run lint` (if linter is configured)
  - `npm run check` (Svelte type checking via `svelte-check`)
  - `npm run test` (unit tests — vitest)
  - `npm run build` (verify static build succeeds)
- Purpose: Gate PRs and catch build/test failures before merge

**2. Deploy — `deploy.yml`** (runs only on push to `main`, after CI passes)
- Trigger: `push` to `main` (only after CI succeeds — use `needs: ci` or separate workflow with same trigger)
- Permissions: `contents: read`, `pages: write`, `id-token: write`
- Steps:
  - Checkout code
  - Setup Node.js (LTS) with npm cache
  - `npm ci`
  - `npm run build`
  - Upload build artifact using `actions/upload-pages-artifact` pointing to `build/` directory
  - Deploy using `actions/deploy-pages`
- Environment: `github-pages`
- Uses the newer GitHub Pages deployment via Actions (not the legacy `gh-pages` branch approach). This uses `actions/deploy-pages` which deploys directly from an artifact, no need for a separate branch.
- Requires: GitHub Pages source set to "GitHub Actions" in repo Settings → Pages

**Why two workflows instead of one:**
- CI runs on PRs too (fast feedback), deploy only on merge to main
- Separation of concerns — CI can fail without attempting deploy
- Clearer logs and status badges

**Alternative (simpler single workflow):**
- A single `deploy.yml` that runs CI steps + deploy in one workflow, conditioned on `github.ref == 'refs/heads/main'` for the deploy job. Acceptable for a personal project but less clean for PR feedback.

### Client-Side Performance

- **Calculation speed**: A 360-period SAC or Price schedule is ~360 iterations of basic arithmetic. Benchmarks show <1ms on modern hardware. Even with TR correction, well under 5ms.
- **Virtual scrolling**: Only ~20-30 rows rendered at any time. DOM stays small regardless of schedule length.
- **Chart rendering**: LayerChart uses SVG. For 360 data points, SVG rendering is smooth. If performance becomes an issue, downsample to yearly points for the chart while keeping full data in the table.
- **Bundle size**: Svelte compiles away, shadcn components are tree-shaken, LayerChart is lightweight. Expected total JS bundle < 100kb gzipped.

## Risks / Trade-offs

- [Risk] Floating-point rounding drift over long schedules (360+ months)
  - Mitigation: Per-period rounding to centavos + final period adjustment. Validated against known reference calculations (SAC: PV=100k, n=120, i=1% → total interest = R$ 60.500,00).

- [Risk] LayerChart API may not support all desired chart configurations out of the box
  - Mitigation: LayerChart is SVG-based and composable. Worst case, we can render raw SVG within Chart.Container. shadcn docs show extensive customization examples.

- [Risk] Virtual scrolling interaction with sticky table headers
  - Mitigation: @tanstack/svelte-virtual handles this pattern well. Use CSS `position: sticky` on `<thead>` with explicit `z-index`.

- [Risk] pt-BR input parsing edge cases (user types "1.000" meaning one thousand, or "1,5" meaning 1.5)
  - Mitigation: Always parse using pt-BR convention (dot = thousands, comma = decimal). Display formatted values alongside raw input for clarity. Use `Intl.NumberFormat` for consistency.

## Handoff to Data Schema

Concrete inputs for `data-schema.md`:

- **Input data types**: Define TypeScript interfaces for `RawInputs` (all form fields), `ValidatedInputs` (derived PV, i_monthly, n), `BankPreset` (name, rate, date)
- **Validation rules**: Zod schemas matching the 6 validation rules from calculation-modeling
- **Formula definitions**: SAC (A, J_t, P_t, SD_t), Price (PMT, J_t, A_t, SD_t), rate conversion, TR correction — each with variable mappings and reference calculations
- **Output data structures**: `Period`, `Schedule`, `Totals`, `ComparisonResult`, `ExtraPayment`, `SavingsSummary`
- **Edge cases**: n=1 (single payment), very small rates (i→0), very large PV near SFH ceiling, TR=0, extra payment = remaining balance (full prepayment)
