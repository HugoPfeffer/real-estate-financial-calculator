---
name: backend-domain
description: Use when creating, modifying, or reviewing files in src/lib/calc/ — the calculation engine layer for Brazilian real estate financing. Triggers on engine additions, validation changes, schedule modifications, precision concerns, or SFH/FGTS regulation questions.
---

# Backend Domain

The calculation engine at `src/lib/calc/` implements Brazilian real estate financing math — SAC and Price amortization, schedule building, comparison analysis, input validation, and financial formatting. This skill enforces correctness, precision, and regulatory compliance for all changes to this layer.

**Scope boundary:** `src/lib/calc/` only. Stores, components, and routes are out of scope.

## Guardrails (Always Apply)

| Rule | Detail |
| --- | --- |
| `round2()` for all money | Every monetary arithmetic result wrapped in `round2()` from `format.ts`. Never raw `Math.round`, `Math.floor`, `Math.ceil`, or `.toFixed()`. |
| Pure functions only | No side effects, no DOM access, no store imports, no `console.log`. Input in, result out. |
| Never mutate inputs | Schedule arrays, Period objects, and ValidatedInputs are immutable. Create new objects. |
| Validate before compute | All paths to `buildSchedule()` go through `validate()` first. |
| Balance convergence | Every schedule's final period must have `balance === 0`. |
| Engine interface | Every engine exports `(PV: number, n: number, i: number, tr?: number) => Period[]`. |
| Exact test assertions | Use `toBe()` with exact values for monetary assertions. Never `toBeCloseTo()`. |
| `round2()` in tests too | Use `round2()` for expected values in tests, not raw `Math.round`. |
| Manual cross-verification | Every engine test must verify against a hand-calculated reference value, not just formula recomputation. |
| Downstream impact check | Type changes (e.g., widening `Schedule.system` union) require checking all consumers: stores, components, comparison logic. |

## Router

```dot
digraph backend_router {
    "calc/ change detected" [shape=doublecircle];
    "Type of change?" [shape=diamond];

    "Load calculation-patterns.md" [shape=box];
    "Load domain-rules.md" [shape=box];
    "Dispatch calc-reviewer" [shape=box];
    "Involves money math?" [shape=diamond];
    "Dispatch precision-auditor" [shape=box];
    "Involves SFH/FGTS?" [shape=diamond];
    "Dispatch domain-rule-validator" [shape=box];
    "Done" [shape=doublecircle];

    "calc/ change detected" -> "Type of change?";
    "Type of change?" -> "Load calculation-patterns.md" [label="new engine/function"];
    "Type of change?" -> "Load domain-rules.md" [label="business rule change"];
    "Type of change?" -> "Dispatch calc-reviewer" [label="any modification"];
    "Load calculation-patterns.md" -> "Involves money math?";
    "Load domain-rules.md" -> "Involves money math?";
    "Dispatch calc-reviewer" -> "Involves money math?";
    "Involves money math?" -> "Dispatch precision-auditor" [label="yes"];
    "Involves money math?" -> "Involves SFH/FGTS?" [label="no"];
    "Dispatch precision-auditor" -> "Involves SFH/FGTS?";
    "Involves SFH/FGTS?" -> "Dispatch domain-rule-validator" [label="yes"];
    "Involves SFH/FGTS?" -> "Done" [label="no"];
    "Dispatch domain-rule-validator" -> "Done";
}
```

## Agent Dispatch

All companion agents produce the same output:

```
- PASS: what passed (bullet list)
- FAIL: file:line + violation description
- SUMMARY: CLEAN or ISSUES_FOUND with count
```

**calc-reviewer** — Dispatch via Task tool (subagent_type: `calc-reviewer`). Pass: list of changed files. Reviews: pure function pattern, engine interface, immutability, test coverage, imports.

**precision-auditor** — Dispatch via Task tool (subagent_type: `precision-auditor`). Pass: list of changed files. Reviews: `round2()` usage, raw Math ops, test assertion precision, balance convergence. Also runs `scripts/precision-check.sh`.

**domain-rule-validator** — Dispatch via Task tool (subagent_type: `domain-rule-validator`). Pass: list of changed files. Reviews: SFH ceilings, FGTS restrictions, hardcoded limits, pt-BR messages, formula correctness.

## Full Pipeline

For comprehensive review, use `/my:backend-quality-pipeline` — runs all three agents in parallel and aggregates results.

## Red Flags — STOP and Reconsider

- Using `toBeCloseTo()` for monetary values
- Using `Math.round()` instead of `round2()`
- Skipping tests because "it's simple"
- Modifying types.ts without checking downstream consumers
- Copying financial formulas without manual verification
- "Make it fast" pressure overriding quality checks
- Adding `console.log` for debugging and leaving it in
- Importing from stores or components into calc/

**All of these mean: pause, review, and correct before proceeding.**
