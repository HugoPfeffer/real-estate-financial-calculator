---
name: backend-domain
description: "Enforces correctness, precision, and regulatory compliance for the calculation engine at src/lib/calc/ — Brazilian real estate financing math (SAC/Price amortization, schedule building, validation, financial formatting). Use when creating, modifying, or reviewing any file in src/lib/calc/. Triggers on: engine additions, validation changes, schedule modifications, precision concerns, round2() usage, SFH ceiling questions, FGTS restriction questions, or monetary arithmetic review. Do NOT use for UI components, stores, or routes — see frontend-domain skill instead."
---

# Backend Domain — Calculation Engine

Scope: `src/lib/calc/` only. Stores, components, and routes are out of scope.

## Guardrails

| Rule | Detail |
| --- | --- |
| `round2()` for all money | Every monetary result wrapped in `round2()` from `format.ts`. Never raw `Math.round`, `Math.floor`, `Math.ceil`, or `.toFixed()`. |
| Pure functions only | No side effects, no DOM, no store imports, no `console.log`. Input in, result out. |
| Never mutate inputs | Schedule arrays, Period objects, ValidatedInputs — always create new objects. |
| Validate before compute | All paths to `buildSchedule()` go through `validate()` first. |
| Balance convergence | Every schedule's final period must have `balance === 0`. |
| Engine interface | Every engine exports `(PV: number, n: number, i: number, tr?: number) => Period[]`. |
| Exact test assertions | `toBe()` with exact values. Never `toBeCloseTo()` for money. |
| `round2()` in tests | Compute expected values with `round2()`, not raw `Math.round`. |
| Manual cross-verification | Every engine test verifies against a hand-calculated reference, not formula recomputation. |
| Downstream impact check | Type changes (e.g., widening `Schedule.system` union) require checking all consumers. |

## Quality Agents

Dispatch via Task tool. All agents produce `PASS/FAIL/SUMMARY` output.

- **calc-reviewer** (`subagent_type: calc-reviewer`) — Pure function pattern, engine interface, immutability, test coverage, imports.
- **precision-auditor** (`subagent_type: precision-auditor`) — `round2()` usage, raw Math ops, test precision, balance convergence. Also runs `scripts/precision-check.sh`.
- **domain-rule-validator** (`subagent_type: domain-rule-validator`) — SFH ceilings, FGTS restrictions, hardcoded limits, pt-BR messages, formula correctness.

**Routing:** Dispatch calc-reviewer for any modification. Add precision-auditor when money math is involved. Add domain-rule-validator when SFH/FGTS rules are affected.

**Full pipeline:** `/my:backend-quality-pipeline` — runs all three in parallel.

## Red Flags — Stop and Reconsider

- `toBeCloseTo()` for monetary values
- `Math.round()` instead of `round2()`
- Skipping tests because "it's simple"
- Modifying `types.ts` without checking downstream consumers
- Copying financial formulas without manual verification
- Importing from stores or components into calc/

## Reference Files

- **[references/calculation-patterns.md](references/calculation-patterns.md)** — Directory layout, engine interface contract, precision strategy, schedule builder pattern, test patterns
- **[references/domain-rules.md](references/domain-rules.md)** — SFH ceilings, FGTS restrictions, amortization system invariants, validation contract, currency formatting, extra amortization rules
- **[references/quality-gates.md](references/quality-gates.md)** — All 7 quality gate definitions with specific checks per gate
