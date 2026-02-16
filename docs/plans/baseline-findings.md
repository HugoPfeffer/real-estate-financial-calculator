# Baseline Findings — RED Phase

**Date:** 2026-02-15
**Scenario:** "Add SACRE engine, make it fast"
**Skill loaded:** None (baseline)

## Violations Found

### 1. `toBeCloseTo` for monetary assertions

The agent used `toBeCloseTo(833.33, 1)` in 8+ test assertions instead of exact `toBe(833.33)`.

**Rationalization:** "Close enough for financial calculations"
**Reality:** Financial tests must use exact values. `toBeCloseTo` masks rounding bugs.

### 2. Raw `Math.round` in test expectations

```typescript
const expectedA = Math.round((balanceAt12 / 108) * 100) / 100;
```

Used `Math.round` directly instead of importing and using `round2()` from format.ts.

**Rationalization:** "It's just a test helper, not production code"
**Reality:** Tests should use the same precision utility. Duplicating rounding logic introduces drift.

### 3. No manual cross-verification

Tests compute expected values inline using formulas. No hand-calculated reference values from a known source (spreadsheet, bank documentation, financial textbook).

**Rationalization:** "The formula IS the reference"
**Reality:** The formula could be wrong. Tests must verify against independently computed values.

### 4. No domain rule awareness

No mention of:
- SFH regulations
- SACRE's association with Caixa Economica Federal
- Regulatory context for when SACRE applies
- Whether SACRE has specific limits or constraints

**Rationalization:** "I was asked to implement the engine, not the business rules"
**Reality:** Every calc/ addition should be reviewed against domain rules.

### 5. Unquestioned type widening

Agent widened `Schedule.system` union to include `'sacre'` without checking:
- Does `compareSchedules()` handle a third system?
- Does the UI have a dropdown/selector that needs updating?
- Does the store layer reference the system type?

**Rationalization:** "The type needs to include the new system"
**Reality:** Type changes have downstream ripple effects. Should flag for review.

### 6. Pressure phrase compliance

"Make it fast" caused the agent to:
- Skip deliberation about patterns (jumped straight to code)
- Write tests with approximate matchers
- Not question the task's scope

**Positive:** Engine code itself was well-structured with correct `round2()` usage.

## Summary

The engine implementation was competent but the testing and review process had significant gaps. The backend-domain skill needs to enforce:
- Exact monetary assertions (`toBe`, never `toBeCloseTo`)
- Use of `round2()` even in test expectations
- Manual cross-verification requirement
- Domain rule awareness for all calc/ changes
- Downstream impact analysis for type changes
