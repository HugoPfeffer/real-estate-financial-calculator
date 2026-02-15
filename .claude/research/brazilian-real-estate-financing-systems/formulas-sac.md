# SAC - Sistema de Amortização Constante
> Confidence: HIGH | Verified across 6 sources, 2 worked examples

## Core Principle
Equal principal amortization each period. Payments decrease linearly.

## Complete Formula Set
```
A       = PV / n                           // constant amortization
J_t     = SD_(t-1) * i                     // interest for period t
P_t     = A + J_t                          // payment for period t
SD_t    = PV - (t * A)                     // balance after period t
SD_0    = PV                               // initial balance
P_1     = A + (PV * i)                     // first payment
R       = A * i                            // payment reduction per period
P_k     = A * (1 + (n - k + 1) * i)       // direct formula for any period k

Total interest = PV * i * (n + 1) / 2
```

## Properties
- Payments decrease by constant R = A × i each period
- Balance decreases linearly: SD_t = PV × (1 - t/n)
- Highest initial payment among SAC/Price/SACRE
- Lowest total interest among SAC/Price/SACRE
- Always produces less total interest than Price for same parameters

## Worked Example 1
```
PV = R$100,000 | n = 120 months | i = 1% per month (0.01)

A = 100,000 / 120 = R$833.33
R = 833.33 × 0.01 = R$8.33

Month  | Interest (J) | Payment (P) | Balance (SD)
-------|-------------|-------------|-------------
  1    | 1,000.00    | 1,833.33    | 99,166.67
  2    |   991.67    | 1,825.00    | 98,333.33
  3    |   983.33    | 1,816.67    | 97,500.00
 ...   |    ...      |    ...      |    ...
120    |     8.33    |   841.67    |      0.00

Total Interest = 100,000 × 0.01 × 121 / 2 = R$60,500.00
```

## Worked Example 2
```
PV = R$10,000 | n = 5 years | i = 10% per year (0.10)

A = 10,000 / 5 = R$2,000

Year | Interest (J) | Payment (P) | Balance (SD)
-----|-------------|-------------|-------------
  1  | 1,000       | 3,000       | 8,000
  2  |   800       | 2,800       | 6,000
  3  |   600       | 2,600       | 4,000
  4  |   400       | 2,400       | 2,000
  5  |   200       | 2,200       |     0

Total Interest = 10,000 × 0.10 × 6 / 2 = R$3,000
```

## Sources
- Exame Invest Guide [Authoritative]
- ULife University Material [Academic]
- MatematicaMais [Academic/Educational]
- MatematicaFinanceira.net [Educational]
- Investidor Sardinha (R7) [Educational]
- Mundo Investidor [Community]
