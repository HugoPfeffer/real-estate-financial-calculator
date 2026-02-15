# SACRE - Sistema de Amortização Crescente
> Confidence: MEDIUM | Documented mathematical inconsistency

## Critical Warning
SACRE is mathematically inconsistent. The balance does NOT reach zero at contract end.
This is documented by Prof. Frank M. Forger (USP Dept. of Applied Mathematics).
Any implementation MUST include a final payment adjustment mechanism.

## Core Principle
Hybrid system: payment is held constant within sub-periods (typically 12 months),
recalculated at sub-period boundaries using SAC formula on remaining balance/term.
Used primarily by Caixa Economica Federal (CEF).

## Algorithm (CEF Practical Method)
```
Input: PV, n, i, s (sub-period length, typically 12)

Step 1: Calculate initial payment using SAC formula
   P_initial = (PV / n) + (PV × i)

Step 2: Hold P_initial constant for s periods

Step 3: Within sub-period, for each month m:
   J_m = SD_(m-1) × i
   A_m = P_constant - J_m        // amortization GROWS because interest decreases
   SD_m = SD_(m-1) - A_m

Step 4: At sub-period boundary (every s months):
   New_A = SD_current / n_remaining
   New_P = New_A + (SD_current × i)
   Hold New_P constant for next s months

Step 5: Repeat until contract end

Step 6: ADJUST final payment to zero out balance
```

## Why It Doesn't Zero Out
Within each sub-period, the constant payment causes accelerating amortization.
But the recalculation at boundaries resets based on SAC assumptions that don't
account for the accelerated repayment within sub-periods. The cumulative effect
produces a small residual (positive or negative) at contract end.

## Worked Example (Shows Non-Zero Residual)
```
PV = R$80,000 | n = 4 months | i = 1.5% per month (0.015)
(Using single sub-period for simplicity)

P_SACRE = (80,000 / 4) + (80,000 × 0.015) = R$21,200 (held constant)

Month | Interest (J) | Amortization (A) | Balance (SD)
------|-------------|-----------------|-------------
  1   | 1,200.00    | 20,000.00       | 60,000.00
  2   |   900.00    | 20,300.00       | 39,700.00
  3   |   595.50    | 20,604.50       | 19,095.50
  4   |   286.43    | 20,913.57       | -1,818.07  ← NEGATIVE

Final balance = -R$1,818.07 (overpayment)
Adjustment needed: reduce last payment by R$1,818.07
```

## REJECTED: Academic Growth Formula
The formula `A_t = A_1 × (1+k)^(t-1)` appears in some sources but parameter k
is UNDEFINED. Do not use this formula. Use only the iterative CEF method above.

## Sources
- Scribd/USP - Prof. Frank M. Forger, Algoritmos para o SACRE [Academic]
- Geocities/FARGS - University exercise PDF [Academic]
- VocePergunta [Community]
- MatematicaFinanceira.net [Educational]
