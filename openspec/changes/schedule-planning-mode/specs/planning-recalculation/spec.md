# Planning Recalculation Engine

User stories for the core recalculation engine that produces modified schedules and savings from planning mode state.

Traceable to: calculation-modeling (Core Recalculation F1–F7, Prazo term-solving, edge cases).

## ADDED User Stories

### User Story: Recalculate modified schedule from planning state
As a financing holder, I want the system to automatically recalculate a modified amortization schedule whenever I check or uncheck extra months, so that I can see the real financial impact of my planned extraordinary payments.

#### Acceptance Criteria

**SAC — Prazo modality (reduce term):**
- **Given** SAC schedule with PV = R$ 300.000,00, n = 360, i = 0,83%/month, paidUpToMonth = 24, extraPaidMonths = {350, 355, 360}, modality = prazo
- **When** recalculation runs
- **Then** extraPrincipal = 3 × round2(300000 / 360) = 3 × R$ 833,33 = R$ 2.499,99; newBalance = baseSchedule[23].balance - R$ 2.499,99; modified schedule uses same A = R$ 833,33; term shortens by approximately 3 months

**SAC — Parcela modality (reduce payment):**
- **Given** same setup but modality = parcela
- **When** recalculation runs
- **Then** nRemaining = 360 - 24 = 336; new A = round2(newBalance / 336); monthly payments decrease; term stays at 360 months total

**Price — Prazo modality (reduce term):**
- **Given** Price schedule with same financing parameters, paidUpToMonth = 24, extraPaidMonths = {350, 355, 360}, modality = prazo
- **When** recalculation runs
- **Then** extraPrincipal = Σ baseSchedule.periods[m-1].amortization for m in {350, 355, 360} (varying amounts — Price amortization increases over time); newBalance = baseSchedule[23].balance - extraPrincipal; nRemaining = ceil(ln(PMT / (PMT - newBalance × i)) / ln(1 + i)); term shortens

**Price — Parcela modality (reduce payment):**
- **Given** same setup but modality = parcela
- **When** recalculation runs
- **Then** nRemaining = 336; new PMT = round2(newBalance × (i × (1+i)^336) / ((1+i)^336 - 1)); payments decrease; term stays at 360 months total

---

### User Story: Compute savings summary
As a financing holder, I want to see how much money and time I save with my planned extra payments, so that I can evaluate whether the extra payments are worthwhile.

#### Acceptance Criteria
- **Given** a base schedule with totalInterest = R$ 620.000,00 and totalPayment = R$ 920.000,00, term = 360 months
- **When** modified schedule has totalInterest = R$ 615.000,00, totalPayment = R$ 916.500,00, and term = 357 months
- **Then** savings shows: interestSaved = R$ 5.000,00, termReduction = 3, totalSaved = R$ 3.500,00

- **Given** modality = parcela (no term reduction)
- **When** modified schedule has same term but lower payments
- **Then** savings shows: termReduction = 0, interestSaved > 0, totalSaved > 0

- **Given** no extra months are checked
- **When** savings is computed
- **Then** no savings result is produced (null)

---

### User Story: Use original schedule amortization values for extra principal
As a financing holder, I want extra payment amounts to match exactly what I see in the amortization column of the schedule table, so that the numbers are predictable and transparent.

#### Acceptance Criteria
- **Given** SAC schedule where every month's amortization = R$ 833,33
- **When** I check month 350 as an extra
- **Then** the extra principal deducted is exactly R$ 833,33 (same value shown in the Amortização column for month 350)

- **Given** Price schedule where month 350's amortization = R$ 780,45 and month 360's amortization = R$ 825,12
- **When** I check both months 350 and 360 as extras
- **Then** extraPrincipal = round2(R$ 780,45 + R$ 825,12) = R$ 1.605,57

- **Given** multiple extras are checked
- **When** the engine computes extraPrincipal
- **Then** it uses amortization values from the ORIGINAL base schedule, not from any previously recalculated modified schedule

---

### User Story: Balance overflow prevention
As a financing holder, I want the system to prevent me from selecting more extra months than my remaining balance can cover, so that I don't create an impossible payment plan.

#### Acceptance Criteria
- **Given** balanceAtWatermark = R$ 10.000,00 and current extraPrincipal = R$ 9.200,00
- **When** I try to check a month whose amortization = R$ 833,33 (would make total R$ 10.033,33 > R$ 10.000,00)
- **Then** the check is prevented and I see: "Saldo insuficiente para mais amortizações extras."

- **Given** balanceAtWatermark = R$ 10.000,00 and current extraPrincipal = R$ 9.200,00
- **When** I try to check a month whose amortization = R$ 500,00 (would make total R$ 9.700,00 <= R$ 10.000,00)
- **Then** the check succeeds

---

### User Story: Handle fully paid loan (newBalance = 0)
As a financing holder, I want the system to handle the case where my extra payments cover the entire remaining balance, so that I can see when my loan would be fully paid off.

#### Acceptance Criteria
- **Given** extras are checked such that extraPrincipal >= balanceAtWatermark
- **When** recalculation runs
- **Then** newBalance is capped at 0, modified schedule has 0 remaining periods after watermark, termReduction = basePeriods.length - paidUpToMonth, and interest savings equals all interest that would have been paid after the watermark

---

### User Story: Month renumbering in modified schedule
As a financing holder, I want the modified schedule periods to be numbered correctly starting after my last sequential payment, so that the timeline makes sense.

#### Acceptance Criteria
- **Given** paidUpToMonth = 24 and modified schedule generates 330 periods
- **When** I look at the modified schedule periods
- **Then** they are numbered month 25, 26, 27, ..., 354 (not 1, 2, 3, ...)

---

### User Story: Total payment includes all components
As a financing holder, I want the modified total payment to include everything I've paid — sequential payments, extra principal, and remaining payments — so that the comparison with the original is accurate.

#### Acceptance Criteria
- **Given** paidUpToMonth = 24, extraPrincipal = R$ 2.499,99
- **When** modified totals are computed
- **Then** totalPayment = round2(sequentialPayments + extraPrincipal + remainingPayments), where sequentialPayments = Σ baseSchedule.periods[m-1].payment for m in 1..24

- **Given** same state
- **When** modified totalInterest is computed
- **Then** totalInterest = round2(sequentialInterest + remainingInterest), where sequentialInterest = Σ baseSchedule.periods[m-1].interest for m in 1..24, and remainingInterest = Σ modifiedPeriods[j].interest

---

### User Story: Prazo term-solving for Price system
As a financing holder using the Price system, I want the term reduction to be mathematically correct when I make extra payments with "Redução de prazo", so that the modified schedule accurately reflects a shorter loan.

#### Acceptance Criteria
- **Given** Price schedule, PMT_original = R$ 2.900,00, newBalance = R$ 250.000,00, i = 0,0083
- **When** prazo modality recalculation runs
- **Then** nRemaining = ceil(ln(PMT / (PMT - newBalance × i)) / ln(1 + i)), and the engine generates exactly nRemaining periods using generatePricePeriods(newBalance, nRemaining, i, tr)

- **Given** PMT - newBalance × i > 0 (PMT can cover interest — normal case)
- **When** nRemaining is computed
- **Then** result is a positive integer

- **Given** (edge case) newBalance is so large that PMT barely covers interest
- **When** nRemaining is computed
- **Then** nRemaining may be very large but finite; this shouldn't occur with valid extra selections since extras reduce balance


## MODIFIED User Stories

_None — the recalculation engine is entirely new. The existing `simulateExtraAmortization()` function is replaced, not modified._


## REMOVED User Stories

### User Story: Manual extra payment entry with amount/type/month
As a financing holder, I wanted to manually specify extra payment amounts, types (pontual/recorrente), and months in a form, so that I could model different extra payment scenarios.

#### Removal Rationale
The new planning mode derives amounts from the schedule itself. Instead of typing "R$ 50.000 at month 24", the user checks month 24 and the engine uses that month's amortization from the original schedule. This is simpler, less error-prone, and directly tied to what the user sees in the table. The `ExtraPayment` interface and `simulateExtraAmortization()` function are superseded by the planning mode engine.
