# Design

## Context

This change transforms the extraordinary amortization feature from a standalone form into an integrated planning mode within the schedule table. Users mark months as paid (sequential watermark) or planned extra payments (individual months), and the system recalculates a modified schedule in real time.

Key inputs from upstream artifacts:
- **Event-storming**: 4 calculation triggers, 7 user actions, watermark absorption algorithm, balance overflow prevention
- **Calculation-modeling**: 7-step formula chain (F1–F7), prazo term-solving for Price, edge cases
- **Specs**: 15 ADDED user stories across interaction and recalculation, 2 MODIFIED, 2 REMOVED

## Goals / Non-Goals

- Goals:
  - Replace `ExtraAmortization.svelte` with planning mode integrated into `ScheduleTable.svelte`
  - Replace `ExtraPayment[]` model with `paidUpToMonth` + `extraPaidMonths` in the store
  - New pure calc function `simulatePlanningMode()` in `src/lib/calc/analysis/`
  - Live recalculation on every checkbox toggle (no "Simular" button)
  - Comparison cards + savings + chart below schedule table when extras exist
- Non-goals:
  - FGTS integration (deferred)
  - localStorage persistence of planning state (deferred)
  - Recurring extra payment support (replaced by individual month selection)
  - Mobile-specific optimizations

## Calculation Architecture

### Engine Structure

**New function**: `simulatePlanningMode()` in `src/lib/calc/analysis/planning.ts`

```
simulatePlanningMode(
  baseSchedule: Schedule,
  paidUpToMonth: number,
  extraPaidMonths: Set<number>,
  modality: 'prazo' | 'parcela'
): PlanningResult
```

This function is pure — no side effects, no DOM, no store imports. It follows the existing pattern of `simulateExtraAmortization()` in `extra-amort.ts`.

**Reuses existing engines**: The function calls `generateSACPeriods()` or `generatePricePeriods()` with adjusted parameters (newBalance, nRemaining, i, tr). No changes needed to the engine functions themselves.

**Replaces**: `simulateExtraAmortization()` and `validateFgtsIntervals()` in `extra-amort.ts`. The old file is kept for now (no breaking changes to imports) but its functions become unused. Clean removal happens in a separate task.

Rationale: Creating a new file (`planning.ts`) rather than modifying `extra-amort.ts` avoids entangling old and new logic. The old file can be deleted cleanly once the migration is confirmed.

Alternatives considered:
- Modifying `simulateExtraAmortization()` in-place: rejected — the input model is fundamentally different (`ExtraPayment[]` vs watermark + Set), and the old function would become unreachable dead code.
- Adding to `schedule/build.ts`: rejected — `build.ts` is for building base schedules from raw inputs, not for planning mode recalculation.

### State Management

**Store changes** in `src/lib/stores/simulation.svelte.ts`:

Remove:
```
let extraPayments = $state<ExtraPayment[]>([]);
let extraBaseSystem = $state<'sac' | 'price'>('sac');
let hasSimulatedExtra = $state(false);
```

Add:
```
let planningMode = $state(false);
let paidUpToMonth = $state(0);
let extraPaidMonths = $state(new Set<number>());
let extraModality = $state<'prazo' | 'parcela'>('prazo');
```

**Derived state** (replaces `extraAmortResult`):
```
let planningResult = $derived.by(() => {
    if (!planningMode || extraPaidMonths.size === 0) return null;
    const baseSchedule = activeTab === 'sac' ? sacSchedule : priceSchedule;
    if (!baseSchedule) return null;
    return simulatePlanningMode(baseSchedule, paidUpToMonth, extraPaidMonths, extraModality);
});
```

The `$derived` reactive chain ensures recalculation on every state change — no manual "simulate" trigger needed.

**Active tab binding**: The planning mode uses whichever system tab (SAC/Price) is currently active in the schedule table. The `activeTab` state moves from `ScheduleTable.svelte` local state to the store so `planningResult` can react to it.

**Watermark management**: Exposed as store methods:
```
toggleMonth(month: number): void      // handles classify + update + absorb
canUncheck(month: number): boolean     // for checkbox disabled state
canCheck(month: number): boolean       // for balance overflow prevention
```

These methods encapsulate the watermark absorption algorithm and balance overflow check from calculation-modeling Scenarios 1 and 3.

Caching/memoization: Not needed. The engine runs in <1ms for 360 periods. Svelte's `$derived` already deduplicates — if inputs haven't changed, the derived value isn't recomputed.

### Precision and Rounding

No changes to existing strategy:
- All monetary arithmetic uses `round2()` from `src/lib/calc/format.ts`
- `round2(x)` = `Math.round(x * 100) / 100` — centavo precision
- `extraPrincipal` computation: `round2(Σ amortizations)` — summed then rounded, not rounded individually then summed (avoids cumulative rounding drift)
- New function follows the same pattern as existing `simulateExtraAmortization()`

Currency precision: R$ with 2 decimal places (centavos). All intermediate values maintain cent precision via `round2()`.

## Data and Formatting

### Number Formatting

No changes — existing conventions preserved:
- `formatBRL()` from `src/lib/calc/format.ts` for all monetary display
- pt-BR locale: dot for thousands, comma for decimals (e.g., R$ 280.000,00)
- `formatPercent()` for rate display

### Rate Conversion

No changes — rates flow from existing validated inputs:
- Annual to monthly: `(1 + annual/100)^(1/12) - 1` (computed in `validate.ts`)
- TR passed through as `monthlyTR` (applied in engine via `correctedBalance = balance * (1 + tr)`)
- The new engine function receives `baseSchedule.monthlyRate` which is already the monthly rate

## Component Architecture

### Files Changed

| File | Change | Scope |
|------|--------|-------|
| `src/lib/calc/analysis/planning.ts` | **NEW** | `simulatePlanningMode()` + `solveNRemainingPrice()` |
| `src/lib/stores/simulation.svelte.ts` | **MODIFY** | Replace extra payment state with planning state, add methods |
| `src/lib/components/ScheduleTable.svelte` | **MODIFY** | Add planning mode toggle, checkboxes, status bar, comparison section |
| `src/routes/+page.svelte` | **MODIFY** | Remove ExtraAmortization section |
| `src/lib/components/ExtraAmortization.svelte` | **DELETE** | Replaced by planning mode in ScheduleTable |
| `src/lib/calc/types.ts` | **MODIFY** | Add `PlanningResult` type |

### ScheduleTable.svelte Redesign

The component grows from a pure display table to an interactive planning tool. Structure:

```
ScheduleTable.svelte
├── Header: [SAC/Price tabs] [Modo planejamento toggle] [Modality dropdown (when ON)]
├── Table: existing columns + optional checkbox column (first position)
│   ├── Checkbox per row (when planning mode ON)
│   │   ├── checked + disabled + ▪ marker → months 1..paidUpToMonth-1
│   │   ├── checked + enabled + ▪ marker → month paidUpToMonth (can uncheck)
│   │   ├── checked + enabled + ★ marker → months in extraPaidMonths
│   │   └── unchecked + enabled → all other months
│   └── Existing columns: Mês, Parcela, Amortização, Juros, Saldo Devedor
├── Status bar (when planning mode ON):
│   └── "Parcelas pagas: N | Extras: M (mês X, Y, Z) | Amortização extra total: R$ X.XXX,XX"
└── Comparison section (when planning mode ON AND extraPaidMonths.size > 0):
    ├── Two cards: "Sem amortização extra" vs "Com amortização extra"
    ├── Savings banner (emerald): juros economizados, meses a menos, economia total
    └── Balance chart: original (dashed gray) vs modified (emerald solid)
```

The comparison section markup migrates directly from `ExtraAmortization.svelte` (lines 120-243) with minimal changes — it already uses the same card/chart structure. The only difference is the data source: `sim.planningResult` instead of `sim.extraAmortResult`.

### Virtualized Table + Checkboxes

The existing virtualization (scroll-based windowed rendering, `ROW_HEIGHT = 40`, `VISIBLE_HEIGHT = 400`, `OVERSCAN = 10`) is preserved. Checkboxes are added to each row as the first element.

Checkbox state is determined by store state (not DOM), so scrolling doesn't lose state:
```
isChecked(month) = month <= paidUpToMonth || extraPaidMonths.has(month)
isDisabled(month) = month < paidUpToMonth  // mid-sequence protection
isSequential(month) = month <= paidUpToMonth
isExtra(month) = extraPaidMonths.has(month)
```

## Deployment and Performance

### Build and Deployment

No changes — static site build via `adapter-static`. No new dependencies. No server-side requirements.

### Client-Side Performance

- **Recalculation cost**: `generateSACPeriods()`/`generatePricePeriods()` are O(n) loops where n <= 360. Measured at <1ms. Safe for live recalculation on every checkbox toggle.
- **Rendering**: Virtualized table renders only ~20 visible rows + 10 overscan buffer. Adding a checkbox per row is negligible.
- **Set operations**: `extraPaidMonths` is a `Set<number>`. `has()`, `add()`, `delete()` are O(1). Watermark absorption is O(k) where k = number of contiguous extras (typically small).
- **Svelte reactivity**: `$derived` only recomputes when dependencies change. Toggling a single checkbox changes one reactive source, triggering one recalculation.

## Risks / Trade-offs

- [Risk] Planning mode increases ScheduleTable complexity from a display component to an interactive one.
  - Mitigation: Keep the planning mode logic in the store (methods + derived state). The component reads state and calls methods — it doesn't own business logic.

- [Risk] Moving `activeTab` from component-local to store changes reactivity scope.
  - Mitigation: This is a minor change — `activeTab` was already used to select which schedule to display. Moving it to the store makes it available to `planningResult` derived computation without prop drilling.

- [Risk] Deleting `ExtraAmortization.svelte` removes FGTS validation that will be needed later.
  - Mitigation: `validateFgtsIntervals()` stays in `extra-amort.ts` (not deleted, just unused). When FGTS is re-added, the function is available.

- [Trade-off] Using original schedule amortization values for extras (not compounded recalculation) is a simplification.
  - Accepted: For the use case (personal planning tool), the simplification is appropriate. The savings comparison still captures the true interest savings because the modified schedule is fully recalculated.

## Handoff to Data Schema

Concrete inputs for `data-schema.md`:

**New types:**
- `PlanningResult`: `{ modified: Schedule, savings: SavingsSummary }` — reuses existing `Schedule` and `SavingsSummary` types
- No new `Period` or `Totals` types needed

**New function signature:**
- `simulatePlanningMode(baseSchedule: Schedule, paidUpToMonth: number, extraPaidMonths: Set<number>, modality: 'prazo' | 'parcela'): PlanningResult`
- Helper: `solveNRemainingPrice(newBalance: number, PMT: number, i: number): number`

**Store state shape changes:**
- Remove: `extraPayments: ExtraPayment[]`, `extraBaseSystem: 'sac' | 'price'`, `hasSimulatedExtra: boolean`
- Add: `planningMode: boolean`, `paidUpToMonth: number`, `extraPaidMonths: Set<number>`, `extraModality: 'prazo' | 'parcela'`, `activeTab: 'sac' | 'price'`
- Replace derived: `extraAmortResult` → `planningResult`

**Store methods:**
- `toggleMonth(month: number): void`
- `canUncheck(month: number): boolean`
- `canCheck(month: number): boolean`
- Remove: `simulateExtra()`, `validateFgts()`

**Validation rules:**
- `extraPaidMonths` entries must all be > `paidUpToMonth`
- `extraPrincipal <= balanceAtWatermark`
- `paidUpToMonth >= 0 && paidUpToMonth <= baseSchedule.periods.length`

**Edge cases:**
- `newBalance === 0`: return empty periods array, full term reduction
- `nRemaining === 1`: single final period with balance + interest
- Price prazo: `PMT - newBalance × i` must be > 0 (guard against infinite term)
