# Calculation Patterns — Engine Architecture

## Directory Layout

```
src/lib/calc/
├── types.ts              # Shared interfaces: Period, Schedule, Totals, ValidationResult
├── format.ts             # round2(), formatBRL(), parseBRL(), formatPercent()
├── engines/
│   ├── sac.ts            # generateSACPeriods(PV, n, i, tr?) => Period[]
│   └── price.ts          # generatePricePeriods(PV, n, i, tr?) => Period[]
├── schedule/
│   └── build.ts          # buildSchedule(system, inputs) => Schedule
├── inputs/
│   ├── validate.ts       # validate(raw) => ValidationResult
│   └── defaults.ts       # Bank presets, localStorage persistence
├── analysis/
│   ├── compare.ts        # compareSchedules(sac, price) => ComparisonResult
│   └── extra-amort.ts    # simulateExtraAmortization(base, extras) => ExtraAmortResult
└── *.test.ts             # Co-located test files
```

## Pure Function Rule

Every function in `src/lib/calc/` MUST be pure:

```typescript
// CORRECT: pure function
export function generateSACPeriods(PV: number, n: number, i: number, tr: number = 0): Period[] {
    const periods: Period[] = [];
    // ... compute and return
    return periods;
}

// VIOLATION: side effects
export function bad(PV: number, n: number, i: number): Period[] {
    console.log('Generating');      // NO: side effect
    store.set(periods);             // NO: store access
    document.title = 'Done';        // NO: DOM access
    return periods;
}
```

Forbidden imports in `src/lib/calc/`:

- `$lib/stores/*`
- `$lib/components/*`
- `svelte` (any svelte module)
- `document`, `window`, `localStorage` (except in `defaults.ts`)

## Engine Interface Contract

Every amortization engine exports a function with this signature:

```typescript
(PV: number, n: number, i: number, tr?: number) => Period[]
```

- `PV` — financed amount (principal value)
- `n` — term in months
- `i` — monthly interest rate (decimal, not percentage)
- `tr` — optional monthly TR correction rate (decimal)

Returns: array of `Period` objects (defined in `types.ts`).

New engines: add a case to the dispatch logic in `schedule/build.ts`.

## Precision Strategy

```typescript
import { round2 } from '../format';

// Definition in format.ts:
export function round2(value: number): number {
    return Math.round(value * 100) / 100;
}
```

Rules:

1. Wrap EVERY monetary arithmetic result in `round2()`
2. Never use `Math.round()` directly — always `round2()`
3. Never use `.toFixed()` for computation — display only
4. Round cumulative values after each addition, not just at the end

```typescript
// CORRECT
const interest = round2(balance * i);
const payment = round2(amortization + interest);
cumulativeInterest = round2(cumulativeInterest + interest);

// VIOLATION
const interest = balance * i;           // NOT rounded
const payment = amortization + interest; // NOT rounded
cumulativeInterest += interest;          // NOT rounded per step
```

Allowed without `round2()`:

- `Math.pow` (interest rate conversion)
- `Math.min` / `Math.max` (clamping)
- Loop counters and month indices

## Schedule Builder Pattern

`buildSchedule()` is the single entry point from the store layer:

```typescript
export function buildSchedule(system: 'sac' | 'price', inputs: ValidatedInputs): Schedule {
    const { financedAmount: PV, termMonths: n, monthlyInterestRate: i, monthlyTR } = inputs;
    const tr = monthlyTR ? monthlyTR / 100 : 0;
    const periods = system === 'sac'
        ? generateSACPeriods(PV, n, i, tr)
        : generatePricePeriods(PV, n, i, tr);
    return { system, periods, totals: computeTotals(periods), monthlyRate: i };
}
```

## Immutability Rule

Never mutate input objects:

```typescript
// CORRECT: build new object
const modified: Schedule = { system, periods: newPeriods, totals: computeTotals(newPeriods), monthlyRate: i };

// VIOLATION: mutating input
baseSchedule.periods.push(newPeriod);
baseSchedule.totals.totalPayment = newTotal;
```

`simulateExtraAmortization` builds its own `periods` array from scratch — it does NOT modify `baseSchedule.periods`.

## Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { round2 } from '../format';

// Test helpers
function validInputs(): ValidatedInputs { /* standard fixture */ }
function makeInputs(overrides: Partial<ValidatedInputs>): ValidatedInputs {
    return { ...validInputs(), ...overrides };
}

// Tests verify against KNOWN manual calculations
it('SAC first payment matches manual calculation', () => {
    const periods = generateSACPeriods(200000, 360, 0.007974);
    // Manual: A = 200000/360 = 555.56, interest = 200000 * 0.007974 = 1594.80
    // payment = 555.56 + 1594.80 = 2150.36
    expect(periods[0].payment).toBe(2150.36);
});
```

Rules:

- Use `toBe()` with exact values. Never `toBeCloseTo()` for monetary assertions.
- Use `round2()` to compute expected values in tests. Never raw `Math.round`.
- Cross-verify against manually calculated reference values.
- Test both first and last periods.
- Test balance convergence: `expect(periods[n-1].balance).toBe(0)`.
