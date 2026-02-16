# Quality Gates — Frontend Verification

Every change to `src/lib/components/`, `src/lib/stores/`, or `src/routes/` must pass ALL gates before completion.

## Gate 1: Type Safety

**Command:** `npm run check`

`svelte-check` passes with zero errors on all modified files. Fix the code, not the types.

## Gate 2: Svelte 5 Compliance

**Command:** Run `ui-reviewer` agent

Checks:

- No `$:` reactive declarations (use `$derived` or `$derived.by()`)
- No `export let` props (use `$props()`)
- No `on:click`, `on:change`, etc. (use `onclick`, `onchange`)
- No `<slot>` (use `{@render children()}`)
- No `<slot name="x">` (use named snippets)
- No `createEventDispatcher()` (use callback props)
- No `$$props` or `$$slots` (use `$props()` destructuring)
- No `beforeUpdate` / `afterUpdate` (use `$effect()`)
- Snippet children used for shadcn component content

## Gate 3: shadcn-First

**Command:** Run `ui-reviewer` agent

Checks:

- Interactive elements use shadcn/bits-ui primitives, not raw HTML
- No raw `<button>` when `<Button>` from shadcn is available
- No raw `<input>` when `<Input>` from shadcn is available
- No raw `<select>` when `<Select>` from shadcn is available
- No raw `<label>` when `<Label>` from shadcn is available
- Exception: SVG internals and chart-specific controls are exempt
- New shadcn components installed via CLI (`npx shadcn@latest add`), never manually

## Gate 4: Design System Compliance

**Command:** Run `style-auditor` agent OR `scripts/style-check.sh`

Checks:

- Dark mode: every `bg-*` has a `dark:bg-*` counterpart
- Dark mode: every `border-zinc-200` paired with `dark:border-zinc-800`
- Colors: use zinc palette for neutrals, semantic colors for states
- No hardcoded colors outside chart SVGs — use Tailwind classes
- Spacing: use standard Tailwind scale (`space-y-*`, `gap-*`, `p-*`, `m-*`)
- Layout: responsive grid uses `grid-cols-1 md:grid-cols-2` pattern
- Borders: `rounded-md` for inputs, `rounded-lg` for containers
- Section pattern: `<section class="mb-8">` with `<h2 class="text-lg font-semibold mb-4">`

## Gate 5: Accessibility

**Command:** Run `a11y-auditor` agent

Checks:

- All form inputs have associated `<Label>` elements with matching `for`/`id`
- Custom interactive elements have `role` and `aria-*` attributes
- Tab buttons have `aria-selected` or equivalent
- Dialog/modal uses bits-ui `<Dialog>` (handles ARIA automatically)
- Keyboard navigation: all clickable elements are focusable
- Focus management: modals trap focus, restore on close
- Semantic HTML: `<section>`, `<header>`, `<footer>`, `<nav>`, `<dl>` used appropriately
- Data tables use `<th>` with `scope` attributes

## Gate 6: Portuguese Language

**Command:** Run `a11y-auditor` agent

Checks:

- All user-facing text in pt-BR (labels, headings, buttons, alerts, tooltips)
- No English strings in UI (code comments and variable names remain English)
- Currency displayed via `formatBRL()` — never raw number formatting
- Rate suffixes: `a.a.` (annual), `a.m.` (monthly)
- Error messages come from `validate()` in calc layer (already pt-BR)

## Gate 7: Store Layer Compliance

**Command:** Run `ui-reviewer` agent

Checks:

- Store accessed via `getSimulationState()`, never raw imports of `$state` variables
- Store called once at component top level: `const sim = getSimulationState()`
- No calc engine logic in stores — stores call calc functions
- Derived values use `$derived` / `$derived.by()`, not `$effect` for synchronization
- Copy on write: input objects spread before assignment (`rawInputs = { ...formInputs }`)
- Store imports only from `$lib/calc/` — never from `$lib/components/`

## Gate 8: Chart Compliance

**Command:** Run `chart-reviewer` agent

Checks:

- Chart dimensions: `chartW = 600`, `chartH = 200`, `pad = 40` (or justified deviation)
- Downsampling: schedules >60 periods downsampled, always including last point
- Color mapping: SAC = `#3b82f6`, Price = `#22c55e`, Interest = `#ef4444`
- Area fills: 20% alpha (`#rrggbb33`)
- Axes and grid lines use `currentColor` with opacity (theme-aware)
- Y-axis labels use `formatBRL()` for monetary values
- Legend positioned consistently (top-right of chart area)
- SVG uses `viewBox` for responsiveness, `class="w-full"` for container
- Path helpers: `toSvgPath()` and `toSvgArea()` patterns
- Dark mode: chart background includes `dark:bg-zinc-950`

## Agent Output Contract

All quality gate agents produce:

```text
- PASS: [what passed]
- FAIL: [file:line] [violation description]
- SUMMARY: CLEAN | ISSUES_FOUND (N violations)
```
