# Tasks

Implementation checklist for `schedule-planning-mode`. Dependency-ordered, with sub-agent assignments.

## 1. Validate Upstream Artifacts

- [x] 1.1 Confirm `specs/**/*.md` is reviewed and acceptance criteria are final.
- [x] 1.2 Confirm `design.md` is reviewed and architecture decisions are finalized.
- [x] 1.3 Verify `data-schema.md` formulas against reference calculations — 16/16 pass in verification log.

## 2. Implementation

### Phase A: Types and Engine (calc layer — backend-domain)

- [x] **2.1** Add `PlanningResult` type to `src/lib/calc/types.ts`
  - Agent: `backend-domain` (`calc-reviewer`)
  - Dependencies: none
  - Details:
    - Add `PlanningResult` interface: `{ modified: Schedule; savings: SavingsSummary }`
    - Reuses existing `Schedule` and `SavingsSummary` types — no new `Period` or `Totals`
  - Acceptance: Type compiles, no changes to existing types

- [x] **2.2** Create `src/lib/calc/analysis/planning.ts` with `simulatePlanningMode()`
  - Agent: `backend-domain` (`calc-reviewer`, `precision-auditor`)
  - Dependencies: 2.1
  - Details:
    - Pure function: `simulatePlanningMode(baseSchedule, paidUpToMonth, extraPaidMonths, modality) → PlanningResult`
    - Implement F1–F7 formula chain from data-schema:
      - F1: balanceAtWatermark from base schedule
      - F2: extraPrincipal = round2(Σ baseSchedule.periods[m-1].amortization for m in extras)
      - F3: newBalance = round2(balanceAtWatermark - extraPrincipal), cap at 0
      - F4a: SAC prazo — nRemaining = ceil(newBalance / A_original)
      - F4b: Price prazo — solveNRemainingPrice(newBalance, PMT, i)
      - F4c: Parcela — nRemaining = baseSchedule.periods.length - paidUpToMonth
      - F5: call generateSACPeriods / generatePricePeriods, renumber months
      - F6: compute totals (sequential + extra + remaining)
      - F7: compute savings (original - modified)
    - Helper: `solveNRemainingPrice(newBalance, PMT, i) → number`
      - Formula: `ceil(ln(PMT / (PMT - newBalance * i)) / ln(1 + i))`
      - Guard: `PMT - newBalance * i > 0`
    - Edge case: newBalance = 0 → empty periods, full term reduction
    - All money through `round2()` from `format.ts`
  - Acceptance: Function matches all 16 verification cases from data-schema

- [x] **2.3** Write unit tests for `simulatePlanningMode()` in `src/lib/calc/analysis/planning.test.ts`
  - Agent: `backend-domain` (`calc-reviewer`, `precision-auditor`)
  - Dependencies: 2.2
  - Details:
    - Test SAC prazo: PV=120k, n=12, i=0.01, watermark=3, extras={10,11,12}
      - Expect: newBalance=60k, nRemaining=6, interestSaved=R$ 2,400.00, termReduction=3
    - Test SAC parcela: PV=100k, n=10, i=0.01, watermark=2, extras={9,10}
      - Expect: newBalance=60k, nRemaining=8, new A=7500, interestSaved=R$ 900.00, termReduction=0
    - Test Price prazo round-trip: PV=100k, n=10, i=0.01, no extras
      - Expect: nRemaining=10 (formula verifies)
    - Test Price prazo with extras: verify term shortens, interest saved > 0
    - Test edge case: newBalance=0 → empty modified periods
    - Test edge case: single extra month → correct deduction
    - Test solveNRemainingPrice: known inputs → expected n
    - All assertions use exact `round2()` values, never `toBeCloseTo()`
  - Acceptance: `npx vitest run src/lib/calc/analysis/planning.test.ts` — all pass

### Phase B: Store (state layer — backend-domain)

- [x] **2.4** Modify `src/lib/stores/simulation.svelte.ts` — replace extra payment state with planning state
  - Agent: `backend-domain` (`calc-reviewer`)
  - Dependencies: 2.2
  - Details:
    - Remove state: `extraPayments`, `extraBaseSystem`, `hasSimulatedExtra`
    - Remove derived: `extraAmortResult`
    - Remove methods: `simulateExtra()`, `validateFgts()`
    - Add state: `planningMode` (boolean, default false), `paidUpToMonth` (number, default 0), `extraPaidMonths` (Set\<number\>, default empty), `extraModality` ('prazo'|'parcela', default 'prazo'), `activeTab` ('sac'|'price', default 'sac')
    - Add derived: `planningResult` — calls `simulatePlanningMode()` when planningMode && extraPaidMonths.size > 0
    - Add method: `toggleMonth(month)` — classify toggle (sequential vs extra), update state, run watermark absorption, check balance overflow
    - Add method: `canCheck(month)` — returns false if extraPrincipal + amortization > balanceAtWatermark
    - Add method: `canUncheck(month)` — returns false if month < paidUpToMonth
    - Expose all via `getSimulationState()` return object
    - Reset planning state when `simulate()` is called (new base simulation invalidates planning)
  - Acceptance: Type-checks, existing simulation flow unaffected, planning methods work

### Phase C: UI Components (component layer — frontend-domain)

- [x] **2.5** Modify `src/lib/components/ScheduleTable.svelte` — add planning mode UI
  - Agent: `frontend-domain` (`ui-reviewer`, `a11y-auditor`)
  - Dependencies: 2.4
  - Details:
    - Move `activeTab` from local state to store (`sim.activeTab`)
    - Add header row controls:
      - "Modo planejamento" toggle (shadcn Switch or similar)
      - Modality dropdown (visible when planning ON): "Redução de prazo" (default) / "Redução de parcela"
    - Add checkbox column (first column, visible when planning ON):
      - `<th>` empty header for checkbox column
      - Per row: `<input type="checkbox">` or shadcn Checkbox
      - checked = `month <= sim.paidUpToMonth || sim.extraPaidMonths.has(month)`
      - disabled = `month < sim.paidUpToMonth` (mid-sequence protection)
      - onclick → `sim.toggleMonth(month)`
      - Visual markers: ▪ for sequential (month <= paidUpToMonth), ★ for extra
    - Add status bar below table (visible when planning ON):
      - "Parcelas pagas: {paidUpToMonth} | Extras: {extraPaidMonths.size} (mês X, Y, Z) | Amortização extra total: R$ X.XXX,XX"
      - Use `formatBRL()` for the total
    - Balance overflow: if `!sim.canCheck(month)`, show disabled checkbox or tooltip
    - All labels in pt-BR
    - Dark mode: every `bg-*` has `dark:bg-*` counterpart
    - Virtualization preserved: checkbox state from store, not DOM
  - Acceptance: Checkboxes render, toggle works, state persists across scroll, planning controls visible/hidden correctly

- [x] **2.6** Add comparison section to `ScheduleTable.svelte` — cards, savings, chart
  - Agent: `frontend-domain` (`ui-reviewer`, `chart-reviewer`)
  - Dependencies: 2.5
  - Details:
    - Migrate markup from `ExtraAmortization.svelte` lines 120-243
    - Render conditionally: `{#if sim.planningMode && sim.planningResult}`
    - Two comparison cards:
      - "Sem amortização extra" — original schedule totals (from active tab's schedule)
      - "Com amortização extra" — `sim.planningResult.modified.totals`
    - Savings banner (emerald):
      - Juros economizados: `formatBRL(savings.interestSaved)`
      - Meses a menos: `savings.termReduction`
      - Economia total: `formatBRL(savings.totalSaved)`
    - Balance chart (SVG):
      - Original curve (dashed gray #94a3b8) from active tab's schedule
      - Modified curve (emerald #10b981) from `planningResult.modified.periods`
      - Reuse existing `toSvgPath()` logic
    - All money formatted with `formatBRL()`, all labels pt-BR
    - Dark mode for cards and chart background
  - Acceptance: Comparison section appears when extras checked, updates live, matches ExtraAmortization visual quality

- [x] **2.7** Modify `src/routes/+page.svelte` — remove ExtraAmortization section
  - Agent: `frontend-domain` (`ui-reviewer`)
  - Dependencies: 2.6
  - Details:
    - Remove import of `ExtraAmortization`
    - Remove the `<section>` block containing ExtraAmortization (lines 52-57)
    - Remove the `<h2>Amortização Extraordinária</h2>` and description paragraph
    - Keep all other sections unchanged
  - Acceptance: Page renders without ExtraAmortization section, no console errors

- [x] **2.8** Delete `src/lib/components/ExtraAmortization.svelte`
  - Agent: `frontend-domain` (`ui-reviewer`)
  - Dependencies: 2.7
  - Details:
    - Delete the file entirely
    - Verify no remaining imports reference it (grep for `ExtraAmortization`)
    - Keep `src/lib/calc/analysis/extra-amort.ts` (contains `validateFgtsIntervals()` for future FGTS work)
  - Acceptance: Build succeeds, no import errors, `extra-amort.ts` still exists

### Phase D: Integration and Verification

- [x] **2.9** Integration test: full planning mode flow
  - Agent: `backend-domain` (`calc-reviewer`)
  - Dependencies: 2.4
  - Details:
    - Test in `planning.test.ts` or new file:
    - Simulate base schedule → set watermark → add extras → verify planningResult
    - Test watermark absorption: add extras {11,12,13}, set watermark to 10, verify absorption to 13
    - Test balance overflow: add enough extras to exceed balance, verify rejection
    - Test modality switch: same extras, switch prazo↔parcela, verify different results
    - Test reset on re-simulate: call simulate() with new inputs, verify planning state clears
  - Acceptance: All integration tests pass

- [x] **2.10** Build and type-check verification
  - Agent: `frontend-domain` (`ui-reviewer`)
  - Dependencies: 2.8, 2.9
  - Details:
    - Run `npm run check` — no type errors
    - Run `npm run build` — static build succeeds
    - Run `npm test` — all tests pass (existing + new)
  - Acceptance: Clean build, zero type errors, all tests green

## Dependency Graph

```
2.1 (types)
 └→ 2.2 (engine) ──→ 2.3 (engine tests)
     └→ 2.4 (store) ──→ 2.5 (table checkboxes)
                          └→ 2.6 (comparison section)
                               └→ 2.7 (page layout)
                                    └→ 2.8 (delete old component)
         └──────────→ 2.9 (integration tests)
                                         └→ 2.10 (build verify)
```

Parallelizable:

- 2.3 (engine tests) and 2.4 (store) can run in parallel after 2.2
- 2.9 (integration tests) can start after 2.4, parallel with 2.5–2.8

## Agent Assignment Summary

| Task                     | Agent           | Key Sub-agents                   |
| ------------------------ | --------------- | -------------------------------- |
| 2.1 Types                | backend-domain  | calc-reviewer                    |
| 2.2 Engine               | backend-domain  | calc-reviewer, precision-auditor |
| 2.3 Engine tests         | backend-domain  | calc-reviewer, precision-auditor |
| 2.4 Store                | backend-domain  | calc-reviewer                    |
| 2.5 Table checkboxes     | frontend-domain | ui-reviewer, a11y-auditor        |
| 2.6 Comparison section   | frontend-domain | ui-reviewer, chart-reviewer      |
| 2.7 Page layout          | frontend-domain | ui-reviewer                      |
| 2.8 Delete old component | frontend-domain | ui-reviewer                      |
| 2.9 Integration tests    | backend-domain  | calc-reviewer                    |
| 2.10 Build verify        | frontend-domain | ui-reviewer                      |
