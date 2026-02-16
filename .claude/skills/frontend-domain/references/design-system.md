# Design System — Visual Conventions

## Color Palette

### Base Colors (Zinc)

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| Background | `bg-white` | `dark:bg-zinc-950` | Page, chart, card backgrounds |
| Surface | `bg-zinc-50` | `dark:bg-zinc-900` | Table headers, hover states |
| Border | `border-zinc-200` | `dark:border-zinc-800` | Cards, tables, dividers |
| Border subtle | `border-zinc-100` | `dark:border-zinc-800/50` | Table row separators |
| Text primary | `text-zinc-900` | `dark:text-zinc-50` | Headings, body text |
| Text secondary | `text-zinc-500` | (same) | Labels, descriptions, muted text |
| Text muted | `text-zinc-400` | (same) | Footer, disclaimers |

### Semantic Colors

| Purpose | Light | Dark |
| --- | --- | --- |
| Success banner bg | `bg-emerald-50` | `dark:bg-emerald-950/20` |
| Success banner border | `border-emerald-200` | `dark:border-emerald-800` |
| Success text | `text-emerald-700` | `dark:text-emerald-400` |
| Warning (Alert) | Alert variant `"warning"` | (auto via shadcn) |
| Error / validation | `text-red-500`, `border-red-500` | (same) |
| Destructive (Button) | Button variant `"destructive"` | (auto via shadcn) |

### Chart Colors (Hardcoded Hex)

| Meaning | Hex | Tailwind Equivalent | Usage |
| --- | --- | --- | --- |
| SAC | `#3b82f6` | blue-500 | SAC line, amortization area |
| Price | `#22c55e` | green-500 | Price line |
| Interest | `#ef4444` | red-500 | Interest area/line |
| SAC area fill | `#3b82f633` | blue-500/20 | Amortization stacked area |
| Interest area fill | `#ef444433` | red-500/20 | Interest stacked area |

### Active Tab Toggle Colors

```
Active:   bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900
Inactive: border-zinc-200 dark:border-zinc-800 (transparent bg)
```

## Typography

| Element | Classes |
| --- | --- |
| Page title (h1) | `text-2xl font-bold text-zinc-900 dark:text-zinc-50` |
| Section heading (h2) | `text-lg font-semibold` |
| Chart title (h3) | `text-sm font-medium` |
| Body text | `text-sm` (default) |
| Labels / descriptions | `text-sm text-zinc-500` |
| Small / footer | `text-xs text-zinc-400` |
| Data values | `font-medium` (regular) or `font-semibold` (emphasis) |

No custom fonts — uses system default via Tailwind.

## Spacing System

### Page Layout

```
Container: max-w-5xl mx-auto px-4 py-8
Sections:  mb-8 between sections
```

### Component Spacing

| Pattern | Classes |
| --- | --- |
| Vertical stack | `space-y-{2,4,6}` |
| Grid layout | `grid grid-cols-1 md:grid-cols-2 gap-4` |
| Form fields | `space-y-2` within each field |
| Button row | `flex gap-2` |
| Card padding | `p-4` (via Card.Content) |

### Section Pattern

Every page section follows:

```svelte
<section class="mb-8">
    <h2 class="text-lg font-semibold mb-4">Section Title in pt-BR</h2>
    <Component />
</section>
```

## Border & Radius

| Element | Classes |
| --- | --- |
| Cards | `rounded-lg` (via shadcn) |
| Charts | `border rounded-lg` |
| Inputs | `rounded-md` (via shadcn) |
| Tab buttons | `rounded-md` |
| Table container | `border border-zinc-200 rounded-lg dark:border-zinc-800 overflow-hidden` |

Base radius variable: `--radius: 0.5rem` (defined in app.css).

## Responsive Breakpoints

Single breakpoint strategy:

| Breakpoint | Usage |
| --- | --- |
| Default (mobile) | `grid-cols-1`, full-width elements |
| `md:` (768px+) | `md:grid-cols-2`, `md:w-auto` for buttons |

No `sm:`, `lg:`, or `xl:` breakpoints currently used — keep it simple.

## Dark Mode

### Implementation

- Toggle: `.dark` class on root element
- Tailwind variant: `dark:` prefix
- Every component must support both modes

### Dark Mode Checklist

For every new component:

- [ ] Background: `bg-white dark:bg-zinc-950` or `bg-zinc-50 dark:bg-zinc-900`
- [ ] Borders: `border-zinc-200 dark:border-zinc-800`
- [ ] Text: `text-zinc-900 dark:text-zinc-50` (or auto via current color)
- [ ] Hover states: `hover:bg-zinc-100 dark:hover:bg-zinc-800/30`
- [ ] Charts: `bg-white dark:bg-zinc-950` for SVG backgrounds
- [ ] Active toggles: inverted colors in dark mode

### Common Mistakes

```svelte
<!-- WRONG: missing dark mode -->
<div class="bg-white border-zinc-200">

<!-- CORRECT: always pair light + dark -->
<div class="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
```

## SVG Chart Conventions

### Chart Container

```svelte
<svg viewBox="0 0 {chartW + pad * 2} {chartH + pad * 2}"
     class="w-full border rounded-lg bg-white dark:bg-zinc-950">
```

Standard dimensions: `chartW = 600`, `chartH = 200`, `pad = 40`.

### Chart Elements

| Element | Style |
| --- | --- |
| Axis lines | `stroke="currentColor" stroke-opacity="0.2"` |
| Grid lines | `stroke="currentColor" stroke-opacity="0.05"` |
| Y-axis labels | `font-size="8" fill="currentColor" opacity="0.5"` |
| Legend boxes | `width="10" height="3"` with fill matching line color |
| Legend text | `font-size="9" fill="currentColor"` |
| Data lines | `stroke-width="2"` (main), `stroke-width="1.5"` (composition) |
| Area fills | Hex color + `33` alpha suffix (20% opacity) |

### Data Downsampling

For schedules with >60 data points, downsample to ~60 points:

```typescript
const step = Math.max(1, Math.floor(data.length / 60));
const indices: number[] = [];
for (let i = 0; i < data.length; i += step) indices.push(i);
if (indices[indices.length - 1] !== data.length - 1) indices.push(data.length - 1);
```

Always include the last data point.

### SVG Path Helpers

```typescript
function toSvgPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

function toSvgArea(points: { x: number; y: number }[], baseline: number): string {
    if (points.length === 0) return '';
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${path} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
}
```

## Language — pt-BR

All user-facing text in Brazilian Portuguese:

| Element | Convention |
| --- | --- |
| Section titles | Portuguese: "Dados do Financiamento", "Resumo Comparativo" |
| Form labels | Portuguese: "Valor do imóvel (R$)", "Prazo (meses)" |
| Button text | Portuguese: "Simular", "Gerenciar bancos" |
| Error messages | Portuguese: handled by `validate()` in calc layer |
| Disclaimers | Portuguese: "Simulação meramente ilustrativa..." |
| Chart labels | Portuguese: "Evolução das Parcelas", "Saldo Devedor" |
| Rate suffixes | `a.a.` (annual), `a.m.` (monthly) |

Never introduce English strings in the UI. Comments and code remain in English.
