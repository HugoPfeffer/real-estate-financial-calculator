## 1. Validate Upstream Artifacts

- [x] 1.1 Confirm `specs/**/*.md` is reviewed and acceptance criteria are final.
- [x] 1.2 Confirm `design.md` is reviewed and architecture decisions are finalized.
- [x] 1.3 Verify `data-schema.md` formulas against reference calculations and confirm all pass.

## 2. Project Scaffold

- [x] 2.1 Initialize SvelteKit project with TypeScript, Svelte 5, and `@sveltejs/adapter-static`.
- [x] 2.2 Install and configure Tailwind CSS 4.
- [x] 2.3 Initialize shadcn-svelte (using shadcn MCP) — add base configuration, theme, and utility files.
- [x] 2.4 Add required shadcn components: Button, Card, Input, Field, Select, Tabs, Table, RadioGroup, Chart, Dialog, Alert, Checkbox.
- [x] 2.5 Install `@tanstack/svelte-virtual` for virtual scrolling.
- [x] 2.6 Install `layerchart` and `d3-scale` (chart dependencies used by shadcn Chart).
- [x] 2.7 Configure `svelte.config.js`: set `paths.base` to repo name, adapter-static.
- [x] 2.8 Create `src/routes/+layout.ts` with `export const prerender = true`.
- [x] 2.9 Add `static/.nojekyll` file.
- [x] 2.10 Verify `npm run build` produces static output with no errors.

## 3. Calculation Engine — Types and Formatting

- [x] 3.1 Create `src/lib/calc/types.ts` — define interfaces: `RawInputs`, `ValidatedInputs`, `Period`, `Totals`, `Schedule`, `ComparisonResult`, `BankPreset`, `ExtraPayment`, `SavingsSummary`.
- [x] 3.2 Create `src/lib/calc/format.ts` — implement `formatBRL(value)` → "R$ 1.234,56", `formatPercent(value)` → "10,50%", `parseBRL(input)` → number. Use `Intl.NumberFormat('pt-BR', ...)`.
- [x] 3.3 Write unit tests for `format.ts`: verify BRL formatting (R$ 1.234,56), percentage formatting, input parsing (dots/commas).

## 4. Calculation Engine — Validation and Defaults

- [x] 4.1 Create `src/lib/calc/inputs/defaults.ts` — shipped bank rate presets (Fev 2026): Caixa 10.49%, BB 12.00%, Itaú 11.60%, Santander 11.79%, Pro-Cotista 9.01%. Include `loadPresets()` (reads from localStorage, falls back to shipped defaults), `savePresets(presets)` (writes to localStorage), `resetPresets()` (restores shipped defaults). Storage key: `financing-simulator:bank-presets`.
- [x] 4.2 Create `src/lib/calc/inputs/validate.ts` — Zod schema for `RawInputs`, validation function returning `{ ok: true, data: ValidatedInputs } | { ok: false, errors: ValidationError[] }`. Implement all 6 validation rules from data-schema.
- [x] 4.3 Implement derived value computation in validate: `financedAmount = propertyValue × (1 - downPayment/100)`, `monthlyRate = (1 + annualRate/100)^(1/12) - 1`.
- [x] 4.4 Write unit tests for validation: SFH ceiling rejection, LTV rejection, rate cap rejection, FGTS property limit, positive value checks, valid input passthrough. Test rate conversion: 10% a.a. → 0.7974% a.m.

## 5. Calculation Engine — SAC

- [x] 5.1 Create `src/lib/calc/engines/sac.ts` — function `generateSACPeriods(PV, n, i, tr?): Period[]`. Iterate t=1 to n: A=PV/n, J_t=SD×i, P_t=A+J_t, SD_t=SD-A. Apply TR correction before interest if tr > 0. Round each value to 2 decimal places.
- [x] 5.2 Write unit tests for SAC:
  - Test 1: PV=100,000, n=120, i=0.01 → P_1=1,833.33, total interest=60,500.00, SD_120=0.00
  - Test 2: PV=10,000, n=5, i=0.10 → P_1=3,000.00, total interest=3,000.00, SD_5=0.00
  - Test 3: Verify payments decrease linearly by R=A×i per period
  - Test 4: Verify SD_n = 0.00 exactly (final period adjustment)

## 6. Calculation Engine — Price

- [x] 6.1 Create `src/lib/calc/engines/price.ts` — function `generatePricePeriods(PV, n, i, tr?): Period[]`. Compute PMT, iterate t=1 to n: J_t=SD×i, A_t=PMT-J_t, SD_t=SD-A_t. Apply TR correction. Round per period.
- [x] 6.2 Write unit tests for Price:
  - Test 1: PV=10,000, n=12, i=0.01 → PMT=888.49, total interest=661.88
  - Test 2: PV=30,000, n=12, i=0.015 → PMT=2,750.40
  - Test 3: Verify amortization grows geometrically: A\_(t+1)/A_t ≈ (1+i)
  - Test 4: Verify SD_n = 0.00 exactly

## 7. Calculation Engine — Schedule Builder and Comparison

- [x] 7.1 Create `src/lib/calc/schedule/build.ts` — function `buildSchedule(system, validatedInputs): Schedule`. Calls appropriate engine, wraps Period[] with cumulative totals (cumulativeInterest, cumulativeAmortization), computes Totals.
- [x] 7.2 Create `src/lib/calc/analysis/compare.ts` — function `compareSchedules(sac, price): ComparisonResult`. Computes interestSaved, firstPaymentDelta.
- [x] 7.3 Write unit tests: verify SAC total interest < Price total interest for same params, verify interestSaved is positive, verify ComparisonResult fields.

## 8. Calculation Engine — Extraordinary Amortization

- [x] 8.1 Create `src/lib/calc/analysis/extra-amort.ts` — function `simulateExtraAmortization(baseSchedule, extraPayments): { modified: Schedule, savings: SavingsSummary }`. Implement replay algorithm: sort extras by month, replay period-by-period, inject extras, handle prazo vs parcela modality.
- [x] 8.2 Implement term reduction (prazo): keep same payment/amortization, compute new shorter term.
- [x] 8.3 Implement payment reduction (parcela): keep same term, recompute payment from reduced balance.
- [x] 8.4 Implement FGTS interval validation: reject if two FGTS entries < 24 months apart.
- [x] 8.5 Write unit tests:
  - Pontual R$ 50,000 at month 24 on SAC schedule → verify term shorter, interest saved > 0
  - Recorrente R$ 500/month from month 1 → verify progressive savings
  - Full prepayment (extra = remaining balance) → schedule ends at that month
  - FGTS interval: accept 24-month gap, reject 12-month gap

## 9. Reactive State Store

- [x] 9.1 Create `src/lib/stores/simulation.svelte.ts` — Svelte 5 runes store. Expose: `rawInputs` ($state), `bankPresets` ($state, loaded from localStorage via `loadPresets()`), `validatedInputs` ($derived), `sacSchedule` ($derived), `priceSchedule` ($derived), `comparison` ($derived). Expose `simulate()` function that commits form state.
- [x] 9.2 Add extraordinary amortization state: `extraPayments` ($state), `extraAmortResult` ($derived). Expose `simulateExtra()` function.

## 10. UI — Input Form

- [x] 10.1 Create `src/lib/components/InputForm.svelte` — form layout using shadcn Field, Input, Select, Button. Two-column grid for fields. Bank preset Select auto-fills rate field. "Simular" Button triggers `simulate()`.
- [x] 10.2 All labels in pt-BR: "Valor do imóvel", "Entrada (%)", "Prazo (meses)", "Taxa de juros anual (% a.a.)", "Renda bruta mensal", "Renda líquida mensal", "Saldo FGTS", "Renda co-participante", "TR mensal estimada (% a.m.)".
- [x] 10.3 Display validation errors inline using shadcn Field error state. Show income commitment warning as a non-blocking shadcn Alert below the form. Show FGTS property limit warning as Alert.
- [x] 10.4 Monetary input fields formatted as BRL on blur. Parse pt-BR input (dot thousands, comma decimal).
- [x] 10.5 Create `src/lib/components/BankPresetManager.svelte` — shadcn Dialog opened via an edit/gear button next to the bank Select. Dialog contains: list of current presets (name + rate), inline edit for each, "Adicionar banco" button (new name + rate fields), remove button per entry, "Restaurar padrões" button at bottom. On save, calls `savePresets()` from defaults.ts. Presets load from localStorage on page init.

## 11. UI — Summary Cards

- [x] 11.1 Create `src/lib/components/SummaryCards.svelte` — two shadcn Cards side-by-side: SAC and Price. Each shows: primeira parcela, última parcela, total de juros, total pago. All values formatted as BRL.
- [x] 11.2 Add savings highlight below cards: "Economia SAC vs Price: R$ X.XXX,XX em juros".

## 12. UI — Comparison Charts

- [x] 12.1 Create `src/lib/components/ComparisonCharts.svelte` — three charts using shadcn Chart.Container + LayerChart.
- [x] 12.2 Chart 1 — Evolução das Parcelas: line chart, X = month, Y = payment. Series: SAC (blue) and Price (green). Tooltip on hover.
- [x] 12.3 Chart 2 — Composição da Parcela: stacked area chart per system. Stacks: Juros and Amortização. Togglable SAC/Price.
- [x] 12.4 Chart 3 — Saldo Devedor: line chart, X = month, Y = balance. Series: SAC and Price.
- [x] 12.5 All chart labels and tooltips in pt-BR with BRL formatting.

## 13. UI — Schedule Table

- [x] 13.1 Create `src/lib/components/ScheduleTable.svelte` — shadcn Tabs (SAC | Price) + shadcn Table with `@tanstack/svelte-virtual` for virtual scrolling.
- [x] 13.2 Columns: Mês, Parcela (R$), Amortização (R$), Juros (R$), Saldo Devedor (R$). All monetary values BRL formatted.
- [x] 13.3 Sticky table header with CSS `position: sticky`.
- [x] 13.4 Fixed row height (~40px) for consistent virtual scroll.

## 14. UI — Extraordinary Amortization

- [x] 14.1 Create `src/lib/components/ExtraAmortization.svelte` — section with system selector (Select: SAC/Price), dynamic list of extra payment entries, "Simular" button.
- [x] 14.2 Each entry: RadioGroup (Pontual/Recorrente), Input (Valor R$), Input (Mês), RadioGroup (Redução de prazo / Redução de parcela), Checkbox (FGTS). Add/remove buttons.
- [x] 14.3 Results section: two Cards (Sem extra / Com extra) showing Prazo, Total juros, Total pago. Savings highlight: Juros economizados, Meses a menos, Economia total.
- [x] 14.4 Balance comparison chart: dual-line chart (original vs modified trajectory).
- [x] 14.5 All labels pt-BR, all values BRL formatted.

## 15. Page Assembly

- [x] 15.1 Create `src/routes/+page.svelte` — assemble all components in single-page scroll layout: Header → InputForm → SummaryCards → ComparisonCharts → ScheduleTable → ExtraAmortization → Footer.
- [x] 15.2 Create `src/routes/+layout.svelte` — app shell with Tailwind base styles, shadcn theme.
- [x] 15.3 Add footer with disclaimers: "Simulação meramente ilustrativa. Valores podem diferir das condições reais oferecidas pelos bancos. Taxas de referência: Fev 2026."

## 16. Build Verification

- [x] 16.1 Verify `npm run build` produces static output in `build/`, no SSR, no API routes.
- [x] 16.2 Test built output locally with `npx serve build/` — confirm simulation runs end-to-end.

## 17. GitHub Actions CI/CD

- [x] 17.1 Create `.github/workflows/ci.yml` — CI workflow:
  - Trigger: `push` to `main`, `pull_request` to `main`
  - Steps: checkout → setup Node.js 22.x with npm cache → `npm ci` → `npm run check` (svelte-check) → `npm run test` (vitest) → `npm run build`
  - Purpose: gate PRs and catch build/test failures before merge
- [x] 17.2 Create `.github/workflows/deploy.yml` — Deploy workflow:
  - Trigger: `push` to `main`
  - Permissions: `contents: read`, `pages: write`, `id-token: write`
  - Steps: checkout → setup Node.js 22.x with npm cache → `npm ci` → `npm run build` → `actions/upload-pages-artifact` (path: `build/`) → `actions/deploy-pages`
  - Environment: `github-pages`
  - Uses GitHub Pages deployment via Actions (not legacy gh-pages branch)
- [x] 17.3 Add `.nojekyll` to `static/` directory (already in scaffold task 2.9, verify present in build output).
- [x] 17.4 Ensure repo Settings → Pages → Source is set to "GitHub Actions".
- [x] 17.5 Push to `main` and verify: CI workflow passes (check, test, build), deploy workflow runs and site is live at `https://<user>.github.io/<repo>/`.
- [x] 17.6 Verify deployed site loads correctly with `paths.base` prefix — all assets, routes, and navigation work.
