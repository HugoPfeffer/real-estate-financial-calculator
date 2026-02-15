# Regulatory Framework - Brazilian Real Estate Financing
> Updated: Oct 2025 | Sources: G1/Globo, BACEN, MySide, QuintoAndar

## SFH (Sistema Financeiro de Habitação) Parameters

| Parameter | Current Value (Oct 2025) | Previous Value |
|-----------|------------------------|----------------|
| Max property value | R$ 2,250,000 | R$ 1,500,000 |
| Max LTV (SBPE/Caixa) | 80% | 70% |
| Max interest rate | 12% p.a. | 12% p.a. |
| FGTS eligible | Yes (down payment, amortization) | Yes |
| Primary correction index | TR | TR |

**Source**: G1/Globo Oct 10, 2025; CMN Resolution 5255

## TR (Taxa Referencial)

### What It Is
Primary correction index for SFH mortgage outstanding balances.
Created 1991 by BACEN. Published daily by BACEN.

### Application (CORRECT Method)
```
TR applies to balance BEFORE interest calculation:

SD_corrected = SD_previous × (1 + TR_monthly)
J_t = SD_corrected × i_monthly
A_t = [per system rules, using SD_corrected as basis]
SD_new = SD_corrected - A_t
```

### ⚠️ COMMON MISTAKE (DO NOT USE)
```
SD_new = SD_previous × (1 + i + TR)    ← WRONG (additive is incorrect)
```

### TR Historical Values
| Period | Accumulated |
|--------|-------------|
| 2018-2021 | 0.00% (zero) |
| 2022 | 1.63% |
| 2023 | 1.76% |
| 2024 | 0.81% |
| 2025 (Jan-Mar) | ~0.37% |

Monthly range (2022-2025): 0.00% to 0.24%

### ⚠️ DO NOT IMPLEMENT TR CALCULATION
The TR calculation formula requires BACEN lookup tables for parameter 'b' that
were not fully documented in research. Use BACEN's published daily TR values.

## IPCA-Indexed Mortgages
- Caixa launched IPCA-indexed mortgage lines in 2019 with lower nominal rates
- IPCA accumulated 4.83% in 2024 vs TR's 0.81% (6x more expensive correction)
- Caixa reportedly discontinued IPCA-indexed mortgages due to volatility risk

## Insurance Components (Not in Amortization Formulas)
Real mortgage payments include mandatory insurance:
- **MIP** (Morte e Invalidez Permanente) - death/disability insurance
- **DFI** (Danos Físicos do Imóvel) - property damage insurance
These are added ON TOP of the calculated payment (P_t or PMT).

## Sources
- G1/Globo - Novo modelo SFH 2025 [Authoritative]
- IstoE Dinheiro - SFH rules [Authoritative]
- MySide - TR no Financiamento [Authoritative]
- QuintoAndar - Taxa Referencial [Authoritative]
