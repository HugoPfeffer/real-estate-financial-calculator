## Context

Summarize architecture context from `event-storming.md`, `calculation-modeling.md`,
and approved stories in `specs/**/*.md`.

## Goals / Non-Goals

- Goals:
- Non-goals:

## Calculation Architecture

### Engine Structure
- Calculation engine design (pure functions, modules, separation from UI):
- Rationale:
- Alternatives considered:

### State Management
- How inputs flow to outputs:
- Reactive/derived state strategy:
- Caching or memoization needs:

### Precision and Rounding
- Numeric precision strategy (floating point, fixed decimal, BigDecimal):
- Rounding rules for financial values:
- Currency precision (centavos):

## Data and Formatting

### Number Formatting
- Locale conventions (pt-BR: dot for thousands, comma for decimals):
- Currency display (R$ prefix, two decimal places):
- Percentage display:

### Rate Conversion
- Annual to monthly conversion formula:
- Indexer handling (TR, IPCA, fixed):
- Compounding convention:

## Deployment and Performance

### Build and Deployment
- Static site build pipeline:
- Deployment target and configuration:

### Client-Side Performance
- Large dataset handling (full amortization schedules):
- Rendering strategy for long tables:
- Calculation performance considerations:

## Risks / Trade-offs

- [Risk] <description>
  - Mitigation:

## Handoff to Data Schema

List concrete inputs required to author `data-schema.md`:
- Input data types and validation rules
- Formula definitions with variable mappings
- Output data structures
- Edge cases and boundary conditions
