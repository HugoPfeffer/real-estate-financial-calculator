#!/usr/bin/env bash
# Scans src/lib/calc/ for precision violations.
# Exits 0 if clean, 1 if violations found.
# Excludes: test files, the round2() definition itself.

set -euo pipefail

CALC_DIR="src/lib/calc"
VIOLATIONS=0

echo "=== Precision Check: $CALC_DIR ==="

# Check for raw Math.round (excluding round2 definition in format.ts)
while IFS= read -r line; do
    echo "FAIL: Raw Math.round — $line"
    VIOLATIONS=$((VIOLATIONS + 1))
done < <(grep -rn 'Math\.round' "$CALC_DIR" --include='*.ts' --exclude='*.test.ts' --exclude='format.ts' || true)

# Check for Math.floor on potential monetary values
while IFS= read -r line; do
    echo "FAIL: Math.floor — $line"
    VIOLATIONS=$((VIOLATIONS + 1))
done < <(grep -rn 'Math\.floor' "$CALC_DIR" --include='*.ts' --exclude='*.test.ts' || true)

# Check for Math.ceil on potential monetary values
while IFS= read -r line; do
    echo "FAIL: Math.ceil — $line"
    VIOLATIONS=$((VIOLATIONS + 1))
done < <(grep -rn 'Math\.ceil' "$CALC_DIR" --include='*.ts' --exclude='*.test.ts' || true)

# Check for .toFixed() usage outside format.ts
while IFS= read -r line; do
    echo "WARN: .toFixed() — verify display-only — $line"
    VIOLATIONS=$((VIOLATIONS + 1))
done < <(grep -rn '\.toFixed(' "$CALC_DIR" --include='*.ts' --exclude='*.test.ts' --exclude='format.ts' || true)

echo ""
if [ "$VIOLATIONS" -eq 0 ]; then
    echo "SUMMARY: CLEAN — 0 violations"
    exit 0
else
    echo "SUMMARY: ISSUES_FOUND — $VIOLATIONS violation(s)"
    exit 1
fi
