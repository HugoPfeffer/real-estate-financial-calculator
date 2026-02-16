# Domain Rules — Brazilian Real Estate Financing (SFH)

## SFH Ceilings (Sistema Financeiro da Habitacao)

| Constraint | Limit | Code Location |
| --- | --- | --- |
| Max property value | R$ 2.250.000 | `inputs/validate.ts:8` |
| Max annual interest rate | 12% a.a. | `inputs/validate.ts:23` |
| Max term | 420 months (35 years) | `inputs/validate.ts:16` |
| Min down payment | 20% of property value | `inputs/validate.ts:12` |
| Max income commitment | 30% of gross monthly income | UI-level warning |

## FGTS Restrictions

| Constraint | Limit | Code Location |
| --- | --- | --- |
| Max property value for FGTS | R$ 1.500.000 | `inputs/validate.ts:34` |
| Min interval between FGTS amortizations | 24 months | `analysis/extra-amort.ts:17` |
| First-property rule | FGTS only for first property | Not yet enforced in code |

## Amortization System Invariants

### SAC (Sistema de Amortizacao Constante)

- Amortization is constant: `A = PV / n`
- Installments decrease over time (interest portion shrinks)
- Each period: `payment = A + interest`
- Interest: `round2(balance * i)`

### Price (Tabela Price)

- Installments are constant: `PMT = PV * (i * (1+i)^n) / ((1+i)^n - 1)`
- Amortization increases over time (interest portion shrinks)
- Each period: `amortization = PMT - interest`

### Both Systems

- Final period: `amortization = remaining balance` (forces convergence)
- Final period: `balance === 0` (hard invariant)
- TR correction: if `tr > 0`, interest calculated on `balance * (1 + tr)`
- All monetary values wrapped in `round2()`

## Validation Contract

Every validation function returns:

```typescript
type ValidationResult =
  | { ok: true; data: ValidatedInputs }
  | { ok: false; errors: ValidationError[] };
```

`ValidationError` is `{ field: string; message: string }`.

Computed fields added on validation success:

- `financedAmount = propertyValue * (1 - downPaymentPercent / 100)`
- `monthlyInterestRate = (1 + annualRate / 100)^(1/12) - 1`
- `totalGrossIncome = grossMonthlyIncome + coBorrowerIncome`

## Currency Formatting

- All monetary values in BRL
- Display: `R$ 1.234,56` (dot thousands, comma decimals)
- Annual rates: suffixed `a.a.` (ao ano)
- Monthly rates: suffixed `a.m.` (ao mes)
- Formatting: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Parsing: strip `R$`, replace dots, swap comma for period, `parseFloat`

## Extra Amortization Rules

- Extraordinary payments never mutate the base schedule
- `simulateExtraAmortization()` creates a modified schedule from scratch
- Two modalities:
  - `prazo`: keep payment amount, reduce term
  - `parcela`: keep term, reduce payment amount
- Recurring payments expand from start month to end of schedule
- Tiny trailing periods (rounding artifacts < 10% of previous payment) merge into previous period
