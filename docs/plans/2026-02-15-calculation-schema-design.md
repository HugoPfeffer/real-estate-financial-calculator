# Design: Rename event-driven schema to calculation

## Summary

Restructure the OpenSpec `event-driven` schema into a `calculation` schema aligned with the project's actual domain: a client-side Brazilian real estate financing simulator. The EventStorming methodology remains the discovery foundation, but all downstream artifacts shift from distributed-messaging concerns (brokers, AsyncAPI, event sourcing) to calculation concerns (inputs, validation, formulas, outputs).

## Decision: Approach A — Mirror 6 artifacts

Replace each event-driven artifact 1:1 with a calculation-domain equivalent. This preserves the existing workflow rhythm while eliminating the architectural mismatch.

| # | Current (event-driven) | New (calculation) | Change type |
|---|----------------------|-------------------|-------------|
| 1 | event-storming.md | event-storming.md | Adapted |
| 2 | event-modeling.md | calculation-modeling.md | Replaced |
| 3 | specs/**/*.md | specs/**/*.md | Minimal |
| 4 | design.md | design.md | Adapted |
| 5 | asyncapi.yaml | data-schema.md | Replaced |
| 6 | tasks.md | tasks.md | Adapted |

## Artifact Details

### 1. event-storming.md (adapted)

Keep EventStorming as the discovery method. Reframe sections for calculation domain:

- **Scope and Goal** — unchanged
- **Actors** — user, browser, external data sources
- **Domain Events** becomes **Calculation Triggers** — what causes calculations (input change, button click, parameter update)
- **Commands** becomes **User Actions** — enter values, select modality, add extra payment
- **Aggregates / Bounded Contexts** becomes **Calculation Domains** — SAC engine, Price engine, SACRE engine, affordability checker, comparison module
- **Automations / Policies** becomes **Business Rules** — 30% income cap, SFH ceiling, FGTS interval, insurance formulas
- **Timeline Diagram** — Mermaid flow: User Input -> Validation -> Calculation -> Output
- **Hotspots** — unchanged
- **Handoff** — references calculation-modeling, specs, design, data-schema

### 2. calculation-modeling.md (replaces event-modeling)

New swim lane sequence: `User Input -> Validation -> Calculation -> Output`

Sections:
- **Scenario Overview** — which calculation scenario (SAC schedule, side-by-side comparison, etc.)
- **Input Lane** — parameters entering the calculation
- **Validation Lane** — rules applied (affordability, ranges, regulatory limits)
- **Calculation Lane** — formula engine, intermediate values
- **Output Lane** — what the user sees (schedule table, comparison chart, savings summary)
- **Mermaid Flow** — Input -> Validate -> Calculate -> Display
- **Derivation Notes** — feeds into specs, design, data-schema

### 3. specs/**/*.md (minimal changes)

Template already generic (user stories + Given/When/Then). No structural changes needed. Handoff references updated to point to `calculation-modeling` instead of `event-modeling`.

### 4. design.md (adapted)

Replace messaging/broker sections with client-side calculation concerns:

- **Context** — references event-storming, calculation-modeling, specs
- **Goals / Non-Goals** — unchanged
- **Calculation Architecture** (replaces Messaging/Platform)
  - Calculation engine structure (pure functions, separation from UI)
  - State management (inputs to outputs flow)
  - Precision and rounding strategy
- **Data & Formatting** (replaces Security)
  - BRL number formatting, Brazilian conventions
  - Currency precision rules
  - Rate conversion (annual <-> monthly)
- **Deployment & Performance** (replaces Operations/Observability)
  - Static site build and deployment
  - Client-side performance (large schedule tables)
- **Risks / Trade-offs** — unchanged
- **Handoff to Data Schema** (replaces Handoff to AsyncAPI)

### 5. data-schema.md (replaces asyncapi.yaml)

Core new artifact. Defines the calculation data contract:

- **Input Data Types** — all inputs with types, ranges, defaults, units
- **Validation Rules** — regulatory constraints (SFH ceiling, 30% income cap, FGTS rules)
- **Formula Definitions** — mathematical formulas for SAC, Price, SACRE with variable definitions
- **Output Data Types** — schedule row structure, comparison result, savings summary
- **Edge Cases** — zero values, boundaries, precision handling
- **Validation gate** — verify formulas against reference calculations (replaces asyncapi-cli validate)

### 6. tasks.md (adapted preconditions)

Same structure, updated preconditions:
- Confirm specs reviewed
- Confirm design reviewed
- Verify data-schema formulas against reference calculations (replaces asyncapi-cli validate)

## Schema-level changes

- **Name**: `event-driven` -> `calculation`
- **Directory**: `openspec/schemas/calculation/`
- **config.yaml**: update `schema: calculation`
- **Description**: "Calculation-first workflow from EventStorming discovery to data schema and implementation planning"

## What gets deleted

- `openspec/schemas/event-driven/` directory (replaced by `openspec/schemas/calculation/`)
- All references to AsyncAPI, brokers, messaging, event sourcing in templates
