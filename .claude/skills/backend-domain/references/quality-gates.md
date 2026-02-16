# Quality Gates — Calc Engine Verification

Every change to `src/lib/calc/` must pass ALL gates before completion.

## Gate 1: Tests Pass

**Command:** `npm test`

All vitest tests green, zero failures. Fix the code, not the test. Tests are the specification.

## Gate 2: Precision Audit

**Command:** Run `precision-auditor` agent OR `scripts/precision-check.sh`

Checks:

- No `Math.round(` outside of `round2()` definition in `format.ts`
- No `Math.floor(` or `Math.ceil(` on monetary values
- No `.toFixed(` used for computation (display-only is OK in `format.ts`)
- Every monetary arithmetic result wrapped in `round2()`
- Cumulative sums rounded after each addition
- Test assertions use `toBe()` with exact values, never `toBeCloseTo()`
- Test expectations computed with `round2()`, never raw `Math.round`

Allowed: `Math.pow` (interest rate conversion), `Math.min`/`Math.max` (clamping)

## Gate 3: Domain Compliance

**Command:** Run `domain-rule-validator` agent

Checks:

- Hardcoded limits match `domain-rules.md` values exactly
- SFH ceiling: `2_250_000` (use underscore separators)
- FGTS limit: `1_500_000`
- Down payment minimum: `20`
- Interest rate ceiling: `12`
- Term maximum: `420`
- FGTS interval: `24` months
- Validation error messages are in pt-BR
- Computed field formulas are correct

## Gate 4: Pattern Compliance

**Command:** Run `calc-reviewer` agent

Checks:

- Functions are pure (no side effects, no store/DOM imports)
- Engine interface matches `(PV, n, i, tr?) => Period[]`
- No imports from outside `src/lib/calc/` (except `vitest` in tests)
- No mutation of input objects
- New engines registered in `buildSchedule()`
- Test files co-located with source
- Type changes assessed for downstream impact

## Gate 5: Type Safety

**Command:** `npm run check`

`svelte-check` passes with zero errors on `src/lib/calc/` files.

## Gate 6: Balance Convergence

**Verification:** Test assertion

For every schedule produced by any engine:

```typescript
expect(periods[periods.length - 1].balance).toBe(0);
```

## Gate 7: Cross-Engine Consistency

**Verification:** Test assertion

For identical inputs, all engines must produce:

- Same starting balance (PV)
- Final balance of zero

## Agent Output Contract

All quality gate agents produce:

```
- PASS: what passed (bullet list)
- FAIL: file:line + violation description
- SUMMARY: CLEAN or ISSUES_FOUND with count
```
