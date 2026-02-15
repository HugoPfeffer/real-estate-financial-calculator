# System Comparison: SAC vs Price vs SACRE

## Quick Reference

| Criterion | SAC | Price | SACRE |
|-----------|-----|-------|-------|
| Payment trend | Linear decrease | Constant | Stepwise decrease |
| Amortization | Constant | Geometric growth ×(1+i) | Growing within sub-periods |
| Total interest | **Lowest** | **Highest** | Between SAC and Price |
| Initial payment | **Highest** | **Lowest** | Same as SAC P_1 |
| Final payment | Lowest | Same as first | Depends on adjustments |
| Balance zeroing | Exact (SD_n = 0) | Exact (SD_n = 0) | **Does NOT zero** |
| Math consistency | Perfect | Perfect | **Flawed** |
| Common usage | Most BR banks | International standard | CEF only |
| Best for | High initial income | Steady/growing income | CEF borrowers |

## Total Interest Comparison

For identical parameters (PV, n, i):
```
SAC total interest < SACRE total interest < Price total interest
```

### Numerical Example
```
PV = R$100,000 | n = 120 months | i = 1%/month

SAC:   Total interest = 100,000 × 0.01 × 121 / 2 = R$60,500.00
Price: PMT = R$1,434.71 → Total interest = (1,434.71 × 120) - 100,000 = R$72,165.20

SAC saves R$11,665.20 vs Price (16.2% less interest)
```

## Decision Factors

### Choose SAC when:
- Borrower has high current income
- Priority is minimizing total interest paid
- Can handle higher initial payments
- Expects income to be stable or declining

### Choose Price when:
- Borrower needs lowest possible initial payment
- Income is expected to grow over time
- Predictable fixed payments are preferred
- International financing conventions apply

### Choose SACRE when:
- Financing through Caixa Economica Federal
- Want a middle ground between SAC and Price
- Accept the mathematical inconsistency (final adjustment)

## Payment Evolution Visualization
```
Payment
  │
  │╲
  │ ╲ SAC (linear decrease)
  │  ╲
  │   ╲────────── Price (constant)
  │    ╲
  │     ╲ ┐
  │      ╲│ SACRE (stepwise decrease)
  │       └┐
  │        └──
  └──────────────── Time
```

## Sources
- Cross-referenced from all research angles
- Comparative data verified computationally
