# Data Schema

Define all data types, validation rules, and formula specifications for the
planning mode calculation engine. Derived from event-storming, calculation-modeling,
specs, and design artifacts.

## Input Data Types

### Planning State (new store state)

- `planningMode`
  - Type: `boolean`
  - Default value: `false`
  - Required: yes

- `paidUpToMonth`
  - Type: `number` (integer)
  - Unit: months
  - Range: 0–N (where N = baseSchedule.periods.length)
  - Default value: 0
  - Required: yes

- `extraPaidMonths`
  - Type: `Set<number>` (set of integers)
  - Unit: month numbers
  - Range: each entry > paidUpToMonth AND <= N
  - Default value: empty set
  - Required: yes

- `extraModality`
  - Type: `'prazo' | 'parcela'` (string literal union)
  - Default value: `'prazo'`
  - Required: yes

- `activeTab`
  - Type: `'sac' | 'price'` (string literal union)
  - Default value: `'sac'`
  - Required: yes (moved from component-local to store)

### Engine Function Inputs

- `baseSchedule`
  - Type: `Schedule` (existing type from `types.ts`)
  - Fields used: `system`, `periods[]`, `totals`, `monthlyRate`
  - Source: `sacSchedule` or `priceSchedule` from store (selected by activeTab)

## Validation Rules

- Rule: Extra months floor constraint
  - Input(s) validated: each `m` in `extraPaidMonths`
  - Constraint: `m > paidUpToMonth`
  - Error message: (internal invariant, no user-facing error — enforced by `toggleMonth()`)
  - Enforcement: After watermark changes, evict any `m <= paidUpToMonth`

- Rule: Balance overflow
  - Input(s) validated: `extraPrincipal` vs `balanceAtWatermark`
  - Constraint: `Σ baseSchedule.periods[m-1].amortization for m in extraPaidMonths <= balanceAtWatermark`
  - Error message: "Saldo insuficiente para mais amortizações extras."
  - Enforcement: `canCheck(month)` returns false; UI prevents checkbox toggle

- Rule: Sequential uncheck protection
  - Input(s) validated: month to uncheck
  - Constraint: month must be `=== paidUpToMonth` (last in sequence) OR must be in `extraPaidMonths`
  - Error message: (no message — checkbox is disabled)
  - Enforcement: `canUncheck(month)` returns false for `month < paidUpToMonth`

- Rule: Watermark range
  - Input(s) validated: `paidUpToMonth`
  - Constraint: `0 <= paidUpToMonth <= baseSchedule.periods.length`
  - Error message: (internal invariant)

- Rule: Price prazo term guard
  - Input(s) validated: `PMT - newBalance × i`
  - Constraint: must be > 0 (PMT must cover interest on reduced balance)
  - Error message: (should not occur with valid extra selections — extras reduce balance)

## Formula Definitions

### F1: Balance at Watermark

- Purpose: Extract the remaining balance after all sequential payments
- Variables:
  - `paidUpToMonth`: number of sequential months paid (integer)
  - `baseSchedule.periods[]`: original schedule periods
- Formula:
  ```
  if paidUpToMonth === 0:
      balanceAtWatermark = baseSchedule.periods[0].amortization + baseSchedule.periods[0].balance
      // equals PV (financed amount)
  else:
      balanceAtWatermark = baseSchedule.periods[paidUpToMonth - 1].balance
  ```
- Reference calculation 1:
  - SAC, PV = R$ 120,000.00, n = 12, i = 0.01, paidUpToMonth = 3
  - Month 3 balance = R$ 120,000 - 3 × R$ 10,000 = R$ 90,000.00
  - Expected: balanceAtWatermark = R$ 90,000.00
- Reference calculation 2:
  - SAC, PV = R$ 100,000.00, n = 10, i = 0.01, paidUpToMonth = 0
  - Expected: balanceAtWatermark = R$ 10,000.00 + R$ 90,000.00 = R$ 100,000.00 (PV)
- Notes: Values come directly from base schedule (already round2'd). No additional rounding needed.

### F2: Extra Principal

- Purpose: Sum amortization amounts from original schedule for all extra months
- Variables:
  - `extraPaidMonths`: Set of month numbers
  - `baseSchedule.periods[]`: original schedule periods
- Formula:
  ```
  extraPrincipal = round2(
      Σ baseSchedule.periods[m - 1].amortization
      for m in extraPaidMonths
  )
  ```
- Reference calculation 1:
  - SAC, PV = R$ 120,000, n = 12. A = R$ 10,000 (constant). extraPaidMonths = {10, 11, 12}
  - extraPrincipal = round2(10000 + 10000 + 10000) = R$ 30,000.00
- Reference calculation 2:
  - SAC, PV = R$ 100,000, n = 10. A = R$ 10,000 (constant). extraPaidMonths = {9, 10}
  - extraPrincipal = round2(10000 + 10000) = R$ 20,000.00
- Notes: Sum first, then round2. SAC amortization is constant (PV/n). Price amortization varies per month (increases over time).

### F3: New Balance

- Purpose: Remaining balance after deducting extra principal
- Variables:
  - `balanceAtWatermark`: from F1
  - `extraPrincipal`: from F2
- Formula:
  ```
  newBalance = round2(balanceAtWatermark - extraPrincipal)
  if newBalance < 0: newBalance = 0
  ```
- Reference calculation 1:
  - balanceAtWatermark = R$ 90,000.00, extraPrincipal = R$ 30,000.00
  - newBalance = round2(90000 - 30000) = R$ 60,000.00
- Reference calculation 2:
  - balanceAtWatermark = R$ 80,000.00, extraPrincipal = R$ 20,000.00
  - newBalance = round2(80000 - 20000) = R$ 60,000.00

### F4a: Remaining Term — SAC Prazo

- Purpose: Determine remaining periods when keeping original amortization constant (SAC term reduction)
- Variables:
  - `newBalance`: from F3
  - `A_original`: `baseSchedule.periods[0].amortization` (constant for SAC)
- Formula:
  ```
  nRemaining = Math.ceil(newBalance / A_original)
  ```
- Reference calculation:
  - newBalance = R$ 60,000.00, A_original = R$ 10,000.00
  - nRemaining = ceil(60000 / 10000) = 6
- Notes: ceil handles rounding remainder (last period may be smaller).

### F4b: Remaining Term — Price Prazo (solveNRemainingPrice)

- Purpose: Solve for number of periods when keeping original PMT constant (Price term reduction)
- Variables:
  - `newBalance`: from F3 (used as PV)
  - `PMT`: `baseSchedule.periods[0].payment` (constant for Price)
  - `i`: `baseSchedule.monthlyRate`
- Formula:
  ```
  nRemaining = Math.ceil(
      Math.log(PMT / (PMT - newBalance * i)) / Math.log(1 + i)
  )
  ```
  Derivation from PMT formula:
  ```
  PMT = PV × [i(1+i)^n] / [(1+i)^n - 1]
  Let x = (1+i)^n:
  PMT × (x - 1) = PV × i × x
  PMT × x - PMT = PV × i × x
  x(PMT - PV×i) = PMT
  x = PMT / (PMT - PV×i)
  n = ln(x) / ln(1+i)
  ```
- Reference calculation 1 (verify round-trip with no extras):
  - PV = R$ 100,000.00, n_original = 10, i = 0.01
  - PMT = round2(100000 × (0.01 × 1.01^10) / (1.01^10 - 1)) = R$ 10,558.21
  - n = ln(10558.21 / (10558.21 - 100000 × 0.01)) / ln(1.01)
  - n = ln(10558.21 / 9558.21) / ln(1.01)
  - n = ln(1.10462) / 0.009950
  - n = 0.09957 / 0.009950 = 10.007 → ceil = 10 ✓
- Reference calculation 2 (with reduced balance):
  - newBalance = R$ 50,000.00, PMT = R$ 10,558.21, i = 0.01
  - n = ln(10558.21 / (10558.21 - 500.00)) / ln(1.01)
  - n = ln(10558.21 / 10058.21) / ln(1.01)
  - n = ln(1.04968) / 0.009950
  - n = 0.04849 / 0.009950 = 4.874 → ceil = 5
- Guard: `PMT - newBalance × i` must be > 0. If PMT cannot cover interest, term is infinite.

### F4c: Remaining Term — Parcela (both systems)

- Purpose: Keep original remaining term when reducing payments
- Variables:
  - `baseSchedule.periods.length`: original total months
  - `paidUpToMonth`: watermark
- Formula:
  ```
  nRemaining = baseSchedule.periods.length - paidUpToMonth
  ```
- Reference calculation:
  - Original term = 12, paidUpToMonth = 3
  - nRemaining = 12 - 3 = 9
  - But we only generate nRemaining periods. With 3 extras already removed from balance, new A or PMT is recalculated by the engine.

### F5: Generate Modified Periods

- Purpose: Produce the remaining schedule using existing SAC/Price engine
- Variables:
  - `newBalance`: from F3
  - `nRemaining`: from F4a, F4b, or F4c
  - `i`: `baseSchedule.monthlyRate`
  - `tr`: TR correction rate (from original inputs)
  - `system`: `baseSchedule.system`
- Formula:
  ```
  if system === 'sac':
      modifiedPeriods = generateSACPeriods(newBalance, nRemaining, i, tr)
  else:
      modifiedPeriods = generatePricePeriods(newBalance, nRemaining, i, tr)

  // Renumber months
  for each period in modifiedPeriods:
      period.month = paidUpToMonth + period.month
  ```
- Reference calculation (SAC prazo):
  - newBalance = R$ 60,000.00, nRemaining = 6, i = 0.01
  - A = 60000/6 = R$ 10,000.00
  - Period 1 (month 4): interest = R$ 600.00, payment = R$ 10,600.00, balance = R$ 50,000.00
  - Period 6 (month 9): interest = R$ 100.00, payment = R$ 10,100.00, balance = R$ 0.00

### F6: Modified Totals

- Purpose: Compute complete totals including sequential + extra + remaining payments
- Variables:
  - `baseSchedule.periods[]`: for sequential months
  - `extraPrincipal`: from F2
  - `modifiedPeriods[]`: from F5
  - `paidUpToMonth`: watermark
- Formula:
  ```
  sequentialPayments = round2(Σ baseSchedule.periods[m-1].payment for m in 1..paidUpToMonth)
  sequentialInterest = round2(Σ baseSchedule.periods[m-1].interest for m in 1..paidUpToMonth)
  remainingPayments = round2(Σ modifiedPeriods[j].payment for j in 0..len-1)
  remainingInterest = round2(Σ modifiedPeriods[j].interest for j in 0..len-1)

  totalPayment = round2(sequentialPayments + extraPrincipal + remainingPayments)
  totalInterest = round2(sequentialInterest + remainingInterest)
  ```
- Reference calculation (SAC prazo, PV=120000, n=12, i=0.01, watermark=3, extras={10,11,12}):
  - Sequential payments (months 1-3): R$ 11,200 + R$ 11,100 + R$ 11,000 = R$ 33,300.00
  - Sequential interest: R$ 1,200 + R$ 1,100 + R$ 1,000 = R$ 3,300.00
  - Extra principal: R$ 30,000.00
  - Remaining payments (6 periods): R$ 10,600 + R$ 10,500 + R$ 10,400 + R$ 10,300 + R$ 10,200 + R$ 10,100 = R$ 62,100.00
  - Remaining interest: R$ 600 + R$ 500 + R$ 400 + R$ 300 + R$ 200 + R$ 100 = R$ 2,100.00
  - totalPayment = round2(33300 + 30000 + 62100) = R$ 125,400.00
  - totalInterest = round2(3300 + 2100) = R$ 5,400.00

### F7: Savings Summary

- Purpose: Compare original vs modified totals
- Variables:
  - `baseSchedule.totals`: original totals
  - `modifiedTotals`: from F6
  - `modifiedPeriods.length`: remaining periods count
  - `paidUpToMonth`: watermark
- Formula:
  ```
  interestSaved = round2(baseSchedule.totals.totalInterest - totalInterest)
  termReduction = baseSchedule.periods.length - (paidUpToMonth + modifiedPeriods.length)
  totalSaved = round2(baseSchedule.totals.totalPayment - totalPayment)
  ```
- Reference calculation (SAC prazo, from F6 above):
  - Original totalInterest = R$ 7,800.00 (Σ 1200+1100+...+100)
  - Original totalPayment = R$ 127,800.00 (120000 + 7800)
  - interestSaved = round2(7800 - 5400) = R$ 2,400.00
  - termReduction = 12 - (3 + 6) = 3
  - totalSaved = round2(127800 - 125400) = R$ 2,400.00

### Watermark Absorption Algorithm

- Purpose: Maintain invariant that contiguous extras are collapsed into the sequential watermark
- Variables:
  - `paidUpToMonth`: current watermark (mutable)
  - `extraPaidMonths`: current extras set (mutable)
- Formula:
  ```
  // Absorb contiguous extras upward
  while extraPaidMonths.has(paidUpToMonth + 1):
      paidUpToMonth += 1
      extraPaidMonths.delete(paidUpToMonth)

  // Evict any extras that fell below watermark
  for m of extraPaidMonths:
      if m <= paidUpToMonth:
          extraPaidMonths.delete(m)
  ```
- Reference calculation:
  - paidUpToMonth = 10, extraPaidMonths = {11, 12, 13, 15}
  - Absorb: 11 contiguous → watermark=11, delete 11. 12 contiguous → watermark=12, delete 12. 13 contiguous → watermark=13, delete 13. 15 not contiguous → stop.
  - Result: paidUpToMonth = 13, extraPaidMonths = {15}

## Output Data Types

### PlanningResult (new type in `types.ts`)
- Fields:
  - `modified`: `Schedule` — the recalculated schedule (reuses existing type)
    - `system`: `'sac' | 'price'`
    - `periods`: `Period[]` — renumbered from watermark+1
    - `totals`: `Totals` — includes sequential + extra + remaining
    - `monthlyRate`: `number`
  - `savings`: `SavingsSummary` — (reuses existing type)
    - `interestSaved`: `number` (R$, 2 decimals)
    - `termReduction`: `number` (months, integer)
    - `totalSaved`: `number` (R$, 2 decimals)
- Used by: ScheduleTable comparison section (cards, savings banner, chart)

### Store Getters/Methods (new public API)
- `planningMode`: `boolean` — read/write
- `paidUpToMonth`: `number` — read-only (modified via toggleMonth)
- `extraPaidMonths`: `Set<number>` — read-only (modified via toggleMonth)
- `extraModality`: `'prazo' | 'parcela'` — read/write
- `activeTab`: `'sac' | 'price'` — read/write
- `planningResult`: `PlanningResult | null` — derived, read-only
- `toggleMonth(month: number): void` — handles classify, update, absorb
- `canCheck(month: number): boolean` — checks balance overflow
- `canUncheck(month: number): boolean` — checks sequential protection

## Edge Cases

- Case: newBalance = 0 (fully paid)
  - Condition: extraPrincipal >= balanceAtWatermark
  - Expected behavior: newBalance capped at 0, modifiedPeriods = [], termReduction = totalMonths - paidUpToMonth
  - Rationale: No remaining periods to generate; loan is fully paid off

- Case: Single remaining period (nRemaining = 1)
  - Condition: newBalance is very small after extras
  - Expected behavior: Engine generates one period with amortization = newBalance, interest = newBalance × i
  - Rationale: Existing engine `isLast` logic handles this

- Case: Price prazo — PMT barely covers interest
  - Condition: PMT - newBalance × i ≈ 0 (shouldn't happen with extras reducing balance)
  - Expected behavior: nRemaining approaches infinity. Guard: if PMT - newBalance × i <= 0, return error.
  - Rationale: Mathematical impossibility — PMT must exceed interest for loan to amortize

- Case: Watermark drops below existing extras
  - Condition: User unchecks last sequential month, some extras have month <= new watermark
  - Expected behavior: Eviction loop removes all extras <= paidUpToMonth
  - Rationale: Invariant maintenance — extras must always be > watermark

- Case: All extras unchecked
  - Condition: extraPaidMonths becomes empty
  - Expected behavior: planningResult returns null, comparison section hides
  - Rationale: No modification to compare against

## Verification Log

| Formula | Input Set | Expected | Actual | Pass/Fail |
|---------|-----------|----------|--------|-----------|
| F1 (balance at watermark) | SAC, PV=120k, n=12, i=0.01, watermark=3 | R$ 90,000.00 | R$ 90,000.00 | Pass |
| F1 (watermark=0) | SAC, PV=100k, n=10, i=0.01, watermark=0 | R$ 100,000.00 | R$ 100,000.00 | Pass |
| F2 (extra principal) | SAC, A=10000, extras={10,11,12} | R$ 30,000.00 | R$ 30,000.00 | Pass |
| F2 (extra principal) | SAC, A=10000, extras={9,10} | R$ 20,000.00 | R$ 20,000.00 | Pass |
| F3 (new balance) | bal=90000, extra=30000 | R$ 60,000.00 | R$ 60,000.00 | Pass |
| F4a (SAC prazo nRemaining) | newBal=60000, A=10000 | 6 | 6 | Pass |
| F4b (Price prazo round-trip) | PV=100k, PMT=10558.21, i=0.01 | 10 | ceil(10.007)=10 | Pass |
| F4b (Price prazo reduced) | newBal=50k, PMT=10558.21, i=0.01 | 5 | ceil(4.874)=5 | Pass |
| F6 (total payment) | SAC prazo, w=3, extras={10,11,12} | R$ 125,400.00 | R$ 125,400.00 | Pass |
| F6 (total interest) | SAC prazo, w=3, extras={10,11,12} | R$ 5,400.00 | R$ 5,400.00 | Pass |
| F7 (interest saved) | orig=7800, mod=5400 | R$ 2,400.00 | R$ 2,400.00 | Pass |
| F7 (term reduction) | SAC prazo, 12-(3+6) | 3 | 3 | Pass |
| F7 (total saved) | orig=127800, mod=125400 | R$ 2,400.00 | R$ 2,400.00 | Pass |
| Watermark absorption | w=10, extras={11,12,13,15} | w=13, extras={15} | w=13, extras={15} | Pass |
| F6 (parcela totals) | SAC parcela, PV=100k, w=2, extras={9,10} | totalPayment=R$ 104,600.00, totalInterest=R$ 4,600.00 | R$ 104,600.00, R$ 4,600.00 | Pass |
| F7 (parcela savings) | SAC parcela, orig interest=5500 | interestSaved=R$ 900.00, termReduction=0 | R$ 900.00, 0 | Pass |
