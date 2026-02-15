# Brazilian Real Estate Financing Systems Research
> Generated: 2026-02-14 | Sources: 20 | Confidence: High (SAC/Price), Medium (SACRE)

## Overview
Deep research on three Brazilian mortgage amortization systems used in real estate financing:
- **SAC** (Sistema de Amortização Constante) - Constant Amortization
- **Price** (Tabela Price / Sistema Francês) - French Amortization
- **SACRE** (Sistema de Amortização Crescente) - Growing Amortization

## Files
- `README.md` - This file
- `context.md` - Complete research context document (formulas, examples, implementation guide)
- `formulas-sac.md` - SAC formula reference with validation examples
- `formulas-price.md` - Price/Tabela Price formula reference with validation examples
- `formulas-sacre.md` - SACRE algorithm reference with warnings
- `regulatory.md` - SFH rules, TR correction, regulatory framework
- `comparison.md` - Side-by-side system comparison

## Key Findings
1. SAC and Price formulas are well-established and verified (HIGH confidence)
2. SACRE has a documented mathematical inconsistency - balance does NOT zero at contract end
3. TR correction must be applied BEFORE interest calculation (NOT additive)
4. SFH rules were updated Oct 2025: R$2.25M cap, 80% LTV, 12% max rate
5. Do NOT implement TR calculation formula - use BACEN published values

## Quality
- 78% of findings meet quality threshold
- SAC: 6 sources, 2 worked examples, computationally verified
- Price: 5 sources, 3 worked examples, computationally verified
- SACRE: 3 sources, academic paper from USP confirms mathematical flaw
