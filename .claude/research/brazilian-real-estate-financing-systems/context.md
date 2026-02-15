# Research Context: Brazilian Real Estate Financing Systems (SAC, Price, SACRE)
> Generated: 2026-02-14 | Sources: 20 | Confidence: High (SAC/Price), Medium (SACRE)

## Key Facts
- Brazil uses three mortgage amortization systems: SAC (most banks), Price/Tabela Price (international standard), SACRE (Caixa Economica Federal only)
- SAC always produces less total interest than Price for identical parameters
- SACRE is mathematically inconsistent - balance does NOT reach zero at contract end, requires final payment adjustment
- SFH caps: R$2,250,000 property value, 80% LTV, 12% p.a. max rate (Oct 2025)
- TR correction applies BEFORE interest calculation, not additively
- Current TR: ~0.12-0.17% monthly (early 2025); was 0% from 2018-2021

## Variable Definitions (used across all systems)
| Variable | Description | Portuguese |
|----------|-------------|------------|
| PV | Principal / Financed amount | Valor financiado |
| n | Total number of periods | Número de parcelas |
| i | Periodic interest rate (decimal) | Taxa de juros do período |
| t | Current period (1 to n) | Período atual |
| A / A_t | Amortization (for period t) | Amortização |
| J_t | Interest for period t | Juros do período |
| P_t / PMT | Payment for period t | Prestação / Parcela |
| SD_t | Outstanding balance after period t | Saldo devedor |
| TR | Taxa Referencial (correction index) | Taxa Referencial |
| R | Payment reduction per period (SAC only) | Razão de decréscimo |

## Implementation Checklist

### SAC Implementation
- [ ] Validate PV, n, i parameters (all positive, i < 1)
- [ ] Calculate constant A = PV / n
- [ ] Store payment reduction R = A * i
- [ ] Use recursive SD: SD_t = SD_(t-1) - A
- [ ] Validate: SD_n = 0 within floating-point tolerance
- [ ] Validate: Total interest = PV * i * (n + 1) / 2

### Price Implementation
- [ ] Calculate PMT using annuity formula
- [ ] Handle (1+i)^n for large n (use logarithms if needed)
- [ ] Use recursive SD: SD_t = SD_(t-1) - A_t
- [ ] Validate: A_(t+1) / A_t ≈ (1+i)
- [ ] Validate: SD_n = 0 within floating-point tolerance
- [ ] Validate: Total interest = (PMT * n) - PV

### SACRE Implementation
- [ ] Document non-zero final balance to users
- [ ] Define sub-period length s (typically 12 months)
- [ ] Implement payment recalc at sub-period boundaries
- [ ] Implement final payment adjustment mechanism
- [ ] Test with worked example showing negative residual

### TR Integration
- [ ] Source TR values from BACEN API (do not calculate)
- [ ] Apply TR to balance BEFORE interest: SD * (1+TR) first
- [ ] Handle TR = 0 case (2018-2021 period)

### Validation Tests
- [ ] SAC: PV=100k, n=120, i=1% → P_1=1,833.33, total interest=60,500
- [ ] Price: PV=10k, n=12, i=1% → PMT=888.49, total interest=661.88
- [ ] SACRE: PV=80k, n=4, i=1.5% → P=21,200, final residual≈-1,818
- [ ] Compare SAC vs Price total interest (SAC must be lower)
