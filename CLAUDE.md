# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Brazilian real estate financing simulator — a SvelteKit static site that compares SAC vs Price amortization systems, with extraordinary payment simulation. All UI text is in pt-BR; code and comments are in English.

## Commands

| Task | Command |
| --- | --- |
| Dev server | `npm run dev` |
| Build (static) | `npm run build` |
| Type check | `npm run check` |
| Run all tests | `npm test` |
| Run single test | `npx vitest run src/lib/calc/engines/sac.test.ts` |
| Watch tests | `npm run test:watch` |
| Add shadcn component | `npx shadcn@latest add <component>` |

## Architecture

```
src/
├── routes/+page.svelte          # Single-page app, composes domain components
├── lib/
│   ├── calc/                    # Pure calculation engine (NO side effects, NO UI imports)
│   │   ├── types.ts             # All shared interfaces (Period, Schedule, Totals, etc.)
│   │   ├── format.ts            # round2(), formatBRL(), parseBRL(), formatPercent()
│   │   ├── engines/sac.ts       # SAC amortization: (PV, n, i, tr?) => Period[]
│   │   ├── engines/price.ts     # Price amortization: same interface
│   │   ├── schedule/build.ts    # buildSchedule() — single entry point from store
│   │   ├── inputs/validate.ts   # validate(raw) => ValidationResult
│   │   ├── inputs/defaults.ts   # Bank presets, localStorage persistence
│   │   └── analysis/            # compare.ts, extra-amort.ts
│   ├── stores/
│   │   └── simulation.svelte.ts # Singleton Svelte 5 rune store, accessed via getSimulationState()
│   └── components/
│       ├── ui/                  # shadcn-svelte primitives (DO NOT edit manually)
│       ├── InputForm.svelte     # Mortgage input form
│       ├── SummaryCards.svelte  # SAC vs Price comparison
│       ├── ComparisonCharts.svelte # Custom SVG charts
│       ├── ScheduleTable.svelte # Virtualized amortization table
│       └── ExtraAmortization.svelte # Extraordinary payment management
```

## Data Flow

```
Components → getSimulationState() → Store ($state/$derived) → calc/ pure functions
```

Components never import calc engines directly. Store is the only bridge. Components import `formatBRL()`/`formatPercent()` from `calc/format` for display only.

## Key Constraints

- **Svelte 5 only** — `$state`, `$derived`, `$props()`, `onclick`, `{@render}`. No Svelte 4 syntax.
- **`round2()` for all money** — every monetary arithmetic result wrapped in `round2()` from `format.ts`. Never `Math.round`, `.toFixed()`, `toBeCloseTo()`.
- **Pure calc layer** — no side effects, no DOM, no store imports inside `src/lib/calc/`.
- **shadcn-first** — interactive elements use shadcn/bits-ui, not raw HTML (except SVG chart internals).
- **Dark mode always** — every `bg-*` has a `dark:bg-*` counterpart.
- **pt-BR UI** — all user-facing text in Brazilian Portuguese.

## Tech Stack

- SvelteKit with `adapter-static` (pre-rendered SPA)
- Svelte 5 (runes: `$state`, `$derived`, `$props()`)
- TailwindCSS v4 (via `@tailwindcss/vite`)
- shadcn-svelte + bits-ui for UI primitives
- Vitest for testing
- TypeScript (strict)

## Domain Skills

Two domain skills provide guardrails and quality agents:

- **backend-domain** — for `src/lib/calc/` changes. Has `calc-reviewer`, `precision-auditor`, and `domain-rule-validator` agents.
- **frontend-domain** — for components/stores/routes changes. Has `ui-reviewer`, `style-auditor`, `a11y-auditor`, and `chart-reviewer` agents.

Run `/my:backend-quality-pipeline` or `/my:frontend-quality-pipeline` for comprehensive review.
