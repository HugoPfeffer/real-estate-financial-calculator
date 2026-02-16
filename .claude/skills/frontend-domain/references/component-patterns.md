# Component Patterns — Frontend Architecture

## Directory Layout

```
src/
├── routes/
│   ├── +page.svelte              # Main page — composes domain components
│   ├── +layout.svelte            # Root layout — dark mode shell
│   └── +layout.ts                # Prerender flag (static generation)
├── lib/
│   ├── components/
│   │   ├── ui/                   # shadcn-svelte primitives (DO NOT edit manually)
│   │   │   ├── alert/            # Alert, AlertTitle, AlertDescription
│   │   │   ├── button/           # Button (variants: default, destructive, outline, secondary, ghost, link)
│   │   │   ├── card/             # Card, Header, Title, Description, Content, Footer
│   │   │   ├── checkbox/         # Checkbox (bits-ui wrapper)
│   │   │   ├── dialog/           # Dialog modal (bits-ui wrapper)
│   │   │   ├── input/            # Input (with BRL currency support)
│   │   │   ├── label/            # Label (accessible form labels)
│   │   │   ├── radio-group/      # RadioGroup (bits-ui wrapper)
│   │   │   ├── select/           # Select dropdown (bits-ui wrapper)
│   │   │   ├── table/            # Table system (7 pieces)
│   │   │   └── tabs/             # Tabs (bits-ui wrapper)
│   │   ├── InputForm.svelte      # Multi-field mortgage input form
│   │   ├── SummaryCards.svelte   # SAC vs Price comparative summary
│   │   ├── ComparisonCharts.svelte # Custom SVG charts
│   │   ├── ScheduleTable.svelte  # Virtualized amortization schedule
│   │   ├── ExtraAmortization.svelte # Extraordinary payment management
│   │   └── BankPresetManager.svelte # Bank interest rate presets modal
│   ├── stores/
│   │   └── simulation.svelte.ts  # Central state with Svelte 5 runes
│   └── utils.ts                  # cn() class merging utility
├── app.css                       # Global styles (Tailwind directives)
└── app.html                      # HTML shell
```

## Svelte 5 Rune Patterns

This project uses Svelte 5 exclusively. Never use Svelte 4 syntax.

### Correct Rune Usage

```typescript
// Mutable reactive state
let value = $state(initialValue);
let obj = $state<TypeAnnotation>({ ... });

// Computed derived values (auto-updates)
let computed = $derived(expression);

// Complex derived logic
let complex = $derived.by(() => {
    if (!condition) return null;
    return expensiveComputation();
});

// Component props
let { prop1, prop2 = defaultValue, ...rest }: Props = $props();
```

### Forbidden Svelte 4 Patterns

| Svelte 4 (FORBIDDEN) | Svelte 5 (CORRECT) |
| --- | --- |
| `$: derived = ...` | `let derived = $derived(...)` |
| `export let prop` | `let { prop } = $props()` |
| `on:click={handler}` | `onclick={handler}` |
| `on:change={handler}` | `onchange={handler}` |
| `$$props` | `$props()` with destructuring |
| `$$slots` | `{#snippet}` / `{@render}` |
| `<slot>` | `{@render children()}` |
| `<slot name="x">` | `{@render snippetName?.()}` |
| `createEventDispatcher()` | Callback props: `onchange: (v) => void` |
| `beforeUpdate` / `afterUpdate` | `$effect()` |
| `$: { sideEffect() }` | `$effect(() => { sideEffect() })` |

### Snippet Composition Pattern

shadcn-svelte components use Svelte 5 snippets for children:

```svelte
<!-- CORRECT: snippet children -->
<Button onclick={handleClick}>
    {#snippet children()}Simular{/snippet}
</Button>

<Card.Title>{#snippet children()}SAC{/snippet}</Card.Title>

<Alert.Description>
    {#snippet children()}{dynamicMessage}{/snippet}
</Alert.Description>

<!-- FORBIDDEN: direct children without snippet -->
<Button>Simular</Button>  <!-- May not work with shadcn-svelte -->
```

## Store Access Pattern

### Singleton Store

The project uses a single module-level store with getter/setter access:

```typescript
// In stores/simulation.svelte.ts
let rawInputs = $state<RawInputs>({ ...defaultInputs });
let hasSimulated = $state(false);
let validationResult = $derived(validate(rawInputs));
let sacSchedule = $derived(
    hasSimulated && validationResult.ok ? buildSchedule('sac', validationResult.data) : null
);

export function getSimulationState() {
    return {
        get rawInputs() { return rawInputs; },
        set rawInputs(v: RawInputs) { rawInputs = v; },
        get hasSimulated() { return hasSimulated; },
        get validationResult() { return validationResult; },
        // ... methods
        simulate(formInputs: RawInputs) {
            rawInputs = { ...formInputs };
            hasSimulated = true;
        },
    };
}
```

### Store Access Rules

1. **Always access via `getSimulationState()`** — never import raw `$state` variables directly
2. **Call once at component top level** — `const sim = getSimulationState();`
3. **No prop drilling** — every domain component accesses the store directly
4. **Calc logic stays in calc/** — stores call calc functions, never implement math
5. **Derived chains** — use `$derived` for values computed from other state, not `$effect` for synchronization
6. **Copy on write** — `simulate()` spreads inputs: `rawInputs = { ...formInputs }`

### Store Layer Boundaries

```
Components → getSimulationState() → Store (runes) → calc/ functions
                                         ↓
                                    $derived chains
```

Stores import from `$lib/calc/` only. Never from `$lib/components/`.
Components import from `$lib/stores/` and `$lib/calc/format` (for display).
Components never import calc engines directly — always go through the store.

## shadcn-svelte Import Conventions

### Compound Components (namespace import)

For components with sub-parts:

```typescript
import * as Card from '$lib/components/ui/card';
import * as Alert from '$lib/components/ui/alert';
import * as Table from '$lib/components/ui/table';

// Usage: Card.Root, Card.Header, Card.Title, Card.Content, etc.
```

### Single Components (named import)

For standalone components:

```typescript
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
```

### Adding New shadcn Components

Use the shadcn CLI — never create UI primitives manually:

```bash
npx shadcn@latest add <component-name>
```

Installed components go to `src/lib/components/ui/`. Do not manually edit these files.

## shadcn-First Rule

Always prefer shadcn/bits-ui primitives over raw HTML for interactive elements:

| Need | Use | Not |
| --- | --- | --- |
| Clickable action | `<Button>` | `<button class="...">` |
| Text input | `<Input>` | `<input class="...">` |
| Form label | `<Label>` | `<label class="...">` |
| Data display | `<Card.Root>` | `<div class="border rounded ...">` |
| Dropdown | `<Select>` from shadcn | `<select class="...">` |
| Modal | `<Dialog>` from shadcn | Custom div overlay |
| Checkbox | `<Checkbox>` from bits-ui | `<input type="checkbox">` |
| Tab switching | `<Tabs>` from bits-ui | Manual button toggles |

Exception: SVG chart internals — raw SVG elements are appropriate inside chart components.

## Component Composition Pattern

### Page Structure

Pages compose domain components with semantic sections:

```svelte
<div class="max-w-5xl mx-auto px-4 py-8">
    <header class="text-center mb-8">
        <h1>...</h1>
    </header>

    <section class="mb-8">
        <h2 class="text-lg font-semibold mb-4">Section Title</h2>
        <DomainComponent />
    </section>

    {#if condition}
        <section class="mb-8">
            <h2 class="text-lg font-semibold mb-4">Conditional Section</h2>
            <ConditionalComponent />
        </section>
    {/if}

    <footer class="mt-12 pt-6 border-t ...">
        <p>Disclaimer text</p>
    </footer>
</div>
```

### Domain Component Structure

Each domain component follows this structure:

```svelte
<script lang="ts">
    // 1. UI imports (shadcn)
    import { Button } from '$lib/components/ui/button';
    // 2. Store import
    import { getSimulationState } from '$lib/stores/simulation.svelte';
    // 3. Calc imports (formatting only)
    import { formatBRL } from '$lib/calc/format';
    // 4. Type imports
    import type { Period } from '$lib/calc/types';

    // 5. Store access
    const sim = getSimulationState();

    // 6. Local state
    let activeTab = $state<'sac' | 'price'>('sac');

    // 7. Derived values
    let periods = $derived<Period[]>(...);

    // 8. Event handlers
    function handleAction() { ... }
</script>

<!-- Template with conditional rendering -->
{#if sim.hasSimulated && sim.sacSchedule}
    <div class="space-y-4">
        <!-- Component content -->
    </div>
{/if}
```

## Currency Display Rules

1. **Always use `formatBRL()` from `$lib/calc/format`** for monetary values
2. **Never use raw `.toLocaleString()`** in components — formatBRL handles locale
3. **Use `formatPercent()`** for rate display (not yet extracted, but should be)
4. **BRL input fields** use separate display state with `parseBRL()` / `formatBRL()` on blur:

```svelte
let displayValue = $state('');
let rawValue = $state(0);

function formatOnBlur() {
    rawValue = parseBRL(displayValue);
    displayValue = rawValue > 0 ? formatBRL(rawValue) : '';
}
```

## Virtual Scrolling Pattern

For large lists (amortization tables), use manual windowing:

```svelte
let scrollTop = $state(0);
const ROW_HEIGHT = 40;
const VISIBLE_HEIGHT = 400;
const OVERSCAN = 10;

let startIndex = $derived(Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN));
let endIndex = $derived(Math.min(items.length, Math.ceil((scrollTop + VISIBLE_HEIGHT) / ROW_HEIGHT) + OVERSCAN));
let visibleItems = $derived(items.slice(startIndex, endIndex));
```

Position items absolutely within a container sized to full list height.

## Conditional Rendering Guards

Prefer `{#if}` guards over non-null assertions:

```svelte
<!-- CORRECT: guard then use safely -->
{#if sim.comparison}
    <p>{formatBRL(sim.comparison.interestSaved)}</p>
{/if}

<!-- AVOID: non-null assertion -->
<p>{formatBRL(sim.comparison!.interestSaved)}</p>
```

When inside a guarded block, non-null assertions on the same reference are acceptable since the guard ensures the value exists.
