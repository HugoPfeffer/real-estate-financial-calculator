# Price / Tabela Price - Sistema Francês de Amortização
> Confidence: HIGH | Verified across 5 sources, 3 worked examples

## Core Principle
Equal payments (PMT) each period. Amortization grows geometrically by factor (1+i).

## Complete Formula Set
```
PMT     = PV × [i × (1+i)^n] / [(1+i)^n - 1]           // fixed payment (annuity)
J_t     = SD_(t-1) × i                                   // interest for period t
A_t     = PMT - J_t                                      // amortization for period t
SD_t    = SD_(t-1) - A_t                                 // balance (recursive)
SD_t    = PV × [(1+i)^n - (1+i)^t] / [(1+i)^n - 1]     // balance (closed-form)
A_(t+1) = A_t × (1+i)                                    // amortization growth property
SD_0    = PV                                              // initial balance

Total interest = (PMT × n) - PV
```

## Properties
- Payments are constant throughout (absent index corrections)
- Amortization grows by factor (1+i) each period
- Lowest initial payment among SAC/Price/SACRE
- Highest total interest among SAC/Price/SACRE
- Front-loaded with interest, back-loaded with principal repayment
- Most common system internationally (French amortization)

## Worked Example 1
```
PV = R$10,000 | n = 12 months | i = 1% per month (0.01)

(1+i)^n = 1.01^12 = 1.126825
PMT = 10,000 × [0.01 × 1.126825] / [1.126825 - 1]
    = 10,000 × 0.01126825 / 0.126825
    = R$888.49

Month | Interest (J) | Amortization (A) | Balance (SD)
------|-------------|-----------------|-------------
  1   | 100.00      | 788.49          | 9,211.51
  2   |  92.12      | 796.37          | 8,415.14
  3   |  84.15      | 804.34          | 7,610.80
  4   |  76.11      | 812.38          | 6,798.42
  5   |  67.98      | 820.51          | 5,977.91
  6   |  59.78      | 828.71          | 5,149.20
  7   |  51.49      | 837.00          | 4,312.20
  8   |  43.12      | 845.37          | 3,466.83
  9   |  34.67      | 853.82          | 2,613.01
 10   |  26.13      | 862.36          | 1,750.65
 11   |  17.51      | 870.98          |   879.67
 12   |   8.80      | 879.69          |     0.00*

Total Interest = (888.49 × 12) - 10,000 = R$661.88

*Rounding may cause small residual; adjust last payment if needed.
```

## Worked Example 2
```
PV = R$30,000 | n = 12 months | i = 1.5% per month (0.015)

PMT = R$2,750.40

Month 1: J = 30,000 × 1.5% = R$450.00 | A = R$2,300.40 | SD = R$27,699.60
Month 2: J = R$415.49 | A = R$2,334.91 | SD = R$25,364.69
```

## Worked Example 3
```
PV = R$300,000 | n = 180 months | i = 0.8% per month (0.008)

PMT = [300,000 × 0.008 × (1.008)^180] / [(1.008)^180 - 1] ≈ R$3,103.77
```

## Sources
- Mundo Educação (UOL) [Authoritative/Educational]
- ImovelGuide [Community]
- Scala Parcelamento Calculator [Community/Tool]
- CalculoOnline Simulator [Community/Tool]
- MELVER [Educational/Financial]
