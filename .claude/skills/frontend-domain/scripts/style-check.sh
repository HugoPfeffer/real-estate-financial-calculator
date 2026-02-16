#!/usr/bin/env bash
# style-check.sh — Automated grep-based checks for frontend style violations
# Run from project root: .claude/skills/frontend-domain/scripts/style-check.sh

set -euo pipefail

COMPONENTS_DIR="src/lib/components"
STORES_DIR="src/lib/stores"
ROUTES_DIR="src/routes"
VIOLATIONS=0

echo "=== Frontend Style Check ==="
echo ""

# --- Svelte 4 Pattern Detection ---
echo "--- Checking for Svelte 4 patterns ---"

# Check for $: reactive declarations
if grep -rn '^\s*\$:' --include='*.svelte' --include='*.svelte.ts' "$COMPONENTS_DIR" "$STORES_DIR" "$ROUTES_DIR" 2>/dev/null; then
    echo "FAIL: Found Svelte 4 reactive declarations (\$:). Use \$derived or \$derived.by() instead."
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo "PASS: No Svelte 4 reactive declarations"
fi

# Check for export let (Svelte 4 props)
if grep -rn 'export let ' --include='*.svelte' "$COMPONENTS_DIR" "$ROUTES_DIR" 2>/dev/null; then
    echo "FAIL: Found 'export let' props. Use \$props() instead."
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo "PASS: No 'export let' props"
fi

# Check for on: event directives (Svelte 4)
if grep -rn 'on:click\|on:change\|on:input\|on:submit\|on:keydown\|on:blur\|on:focus' --include='*.svelte' "$COMPONENTS_DIR" "$ROUTES_DIR" 2>/dev/null; then
    echo "FAIL: Found Svelte 4 event directives (on:*). Use onclick, onchange, etc."
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo "PASS: No Svelte 4 event directives"
fi

# Check for <slot> (Svelte 4)
if grep -rn '<slot' --include='*.svelte' "$COMPONENTS_DIR" "$ROUTES_DIR" 2>/dev/null | grep -v 'node_modules'; then
    echo "FAIL: Found <slot> elements. Use {@render children()} instead."
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo "PASS: No <slot> elements"
fi

echo ""

# --- Dark Mode Pairing ---
echo "--- Checking dark mode pairing ---"

# Check for bg-white without dark:bg-
for file in $(grep -rl 'bg-white' --include='*.svelte' "$COMPONENTS_DIR" "$ROUTES_DIR" 2>/dev/null); do
    while IFS= read -r line_info; do
        line_num=$(echo "$line_info" | cut -d: -f1)
        line_content=$(echo "$line_info" | cut -d: -f2-)
        if echo "$line_content" | grep -q 'bg-white' && ! echo "$line_content" | grep -q 'dark:bg-'; then
            echo "FAIL: $file:$line_num — bg-white without dark:bg-* counterpart"
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
    done < <(grep -n 'bg-white' "$file")
done

# Check for border-zinc-200 without dark:border-zinc-800
for file in $(grep -rl 'border-zinc-200' --include='*.svelte' "$COMPONENTS_DIR" "$ROUTES_DIR" 2>/dev/null); do
    while IFS= read -r line_info; do
        line_num=$(echo "$line_info" | cut -d: -f1)
        line_content=$(echo "$line_info" | cut -d: -f2-)
        if echo "$line_content" | grep -q 'border-zinc-200' && ! echo "$line_content" | grep -q 'dark:border-zinc'; then
            echo "FAIL: $file:$line_num — border-zinc-200 without dark:border-zinc-* counterpart"
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
    done < <(grep -n 'border-zinc-200' "$file")
done

echo ""

# --- Raw HTML Interactive Elements ---
echo "--- Checking for raw HTML interactive elements (shadcn-first rule) ---"

# Check for raw <button outside of SVG contexts and ui/ directory
for file in $(grep -rl '<button' --include='*.svelte' "$COMPONENTS_DIR" "$ROUTES_DIR" 2>/dev/null | grep -v '/ui/'); do
    count=$(grep -c '<button' "$file" 2>/dev/null || true)
    if [ "$count" -gt 0 ]; then
        echo "WARNING: $file — Found $count raw <button> elements. Consider using shadcn <Button>."
    fi
done

# Check for raw <select
for file in $(grep -rl '<select' --include='*.svelte' "$COMPONENTS_DIR" "$ROUTES_DIR" 2>/dev/null | grep -v '/ui/'); do
    count=$(grep -c '<select' "$file" 2>/dev/null || true)
    if [ "$count" -gt 0 ]; then
        echo "WARNING: $file — Found $count raw <select> elements. Consider using shadcn <Select>."
    fi
done

echo ""

# --- toLocaleString in components ---
echo "--- Checking for raw number formatting ---"

if grep -rn 'toLocaleString' --include='*.svelte' "$COMPONENTS_DIR" "$ROUTES_DIR" 2>/dev/null; then
    echo "FAIL: Found toLocaleString in components. Use formatBRL() from \$lib/calc/format."
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo "PASS: No raw toLocaleString in components"
fi

echo ""
echo "=== SUMMARY ==="
if [ "$VIOLATIONS" -eq 0 ]; then
    echo "CLEAN — No violations found"
else
    echo "ISSUES_FOUND — $VIOLATIONS violation(s) detected"
fi

exit $VIOLATIONS
