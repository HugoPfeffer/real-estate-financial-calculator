---
name: frontend-domain
description: "Enforces consistency, accessibility, and design system compliance for the UI layer at src/lib/components/, src/lib/stores/, and src/routes/ — Svelte 5 with shadcn-svelte, TailwindCSS v4, custom SVG charts, and rune-based stores. Use when creating, modifying, or reviewing any UI file. Triggers on: component creation, Svelte 5 rune patterns, shadcn-svelte usage, dark mode styling, chart modifications, accessibility concerns, store layer changes, pt-BR language compliance, or responsive layout questions. Do NOT use for calculation engine files in src/lib/calc/ — see backend-domain skill instead."
---

# Frontend Domain — UI Layer

Scope: `src/lib/components/`, `src/lib/stores/`, `src/routes/`, `src/app.css`. The calculation engine at `src/lib/calc/` is out of scope.

## Guardrails

| Rule | Detail |
| --- | --- |
| Svelte 5 only | No `$:`, `export let`, `on:click`, `<slot>`, `createEventDispatcher`. Use `$state`, `$derived`, `$props()`, `onclick`, `{@render}`, callback props. |
| shadcn-first | Interactive elements use shadcn/bits-ui primitives. No raw `<button>`, `<input>`, `<select>`, `<label>` outside chart SVGs. |
| Store via getter | Access state through `getSimulationState()`. Never import raw `$state` variables. Call once at component top level. |
| No calc logic in UI | Components call `formatBRL()` / `formatPercent()` for display. All math lives in `src/lib/calc/`. |
| Dark mode always | Every `bg-*` paired with `dark:bg-*`. Every `border-zinc-200` paired with `dark:border-zinc-800`. |
| Portuguese UI | All user-facing text in pt-BR. Comments and code stay in English. |
| `formatBRL()` for money | Never raw `.toLocaleString()` or template literals for currency. Import from `$lib/calc/format`. |
| Snippet children | shadcn components receive content via `{#snippet children()}...{/snippet}`. |
| Conditional guards | `{#if}` blocks to guard nullable derived state. Minimize non-null assertions (`!`). |
| Responsive grid | `grid-cols-1 md:grid-cols-2 gap-4` for two-column layouts. Single `md:` breakpoint strategy. |

## Quality Agents

Dispatch via Task tool. All agents produce `PASS/FAIL/SUMMARY` output.

- **ui-reviewer** (`subagent_type: ui-reviewer`) — Svelte 5 compliance, shadcn-first rule, store access, imports, snippets, conditional guards, formatting functions.
- **style-auditor** (`subagent_type: style-auditor`) — Dark mode pairing, color palette, spacing, responsive breakpoints, border/radius conventions. Also runs `scripts/style-check.sh`.
- **a11y-auditor** (`subagent_type: a11y-auditor`) — Form labels, ARIA attributes, keyboard navigation, semantic HTML, focus management, pt-BR compliance.
- **chart-reviewer** (`subagent_type: chart-reviewer`) — SVG dimensions, color mapping, downsampling, path helpers, axis labels, legends, dark mode, `formatBRL()` on Y-axis.

**Routing:** Dispatch ui-reviewer for any modification. Add style-auditor for styling changes. Add a11y-auditor for interactive elements. Add chart-reviewer for chart changes.

**Full pipeline:** `/my:frontend-quality-pipeline` — runs all four in parallel.

## Red Flags — Stop and Reconsider

- `$:` reactive declarations or `export let` props (Svelte 4 syntax)
- `on:click` instead of `onclick`
- Raw `<button>` or `<input>` instead of shadcn components
- Missing `dark:` counterpart on background or border classes
- `.toLocaleString()` instead of `formatBRL()`
- English text in the UI
- Importing calc engines directly into components (bypass store)
- `$effect` to synchronize derived state (use `$derived` instead)

## Reference Files

- **[references/component-patterns.md](references/component-patterns.md)** — Svelte 5 rune patterns, store access, shadcn imports, component composition, virtual scrolling, currency display
- **[references/design-system.md](references/design-system.md)** — Color palette, typography, spacing, dark mode checklist, SVG chart conventions, responsive breakpoints, pt-BR rules
- **[references/quality-gates.md](references/quality-gates.md)** — All 8 quality gate definitions with specific checks per gate
