# Calculation Schema Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the `event-driven` OpenSpec schema with a `calculation` schema aligned to a client-side Brazilian real estate financing simulator.

**Architecture:** Create `openspec/schemas/calculation/` with 6 adapted artifacts (event-storming, calculation-modeling, specs, design, data-schema, tasks). Each template is reframed from distributed-messaging to calculation-domain concerns. The old `event-driven` schema directory is removed and `config.yaml` updated.

**Tech Stack:** OpenSpec YAML schema definitions, Markdown templates, Mermaid diagrams.

---

### Task 1: Create calculation schema directory and schema.yaml

**Files:**
- Create: `openspec/schemas/calculation/schema.yaml`
- Create: `openspec/schemas/calculation/templates/` (directory)
- Create: `openspec/schemas/calculation/templates/specs/` (directory)

**Step 1: Create directory structure**

Run:
```bash
mkdir -p openspec/schemas/calculation/templates/specs
```

**Step 2: Write schema.yaml**

Create `openspec/schemas/calculation/schema.yaml`:

```yaml
name: calculation
version: 1
description: Calculation-first workflow from EventStorming discovery to data schema and implementation planning
artifacts:
  - id: event-storming
    generates: event-storming.md
    description: EventStorming discovery of calculation triggers, user actions, domains, and business rules
    template: event-storming.md
    instruction: |
      Capture EventStorming outcomes adapted for a calculation domain.

      Focus areas:
      - Calculation triggers (what causes a computation to run)
      - User actions (inputs, selections, configuration)
      - Calculation domains (engines, modules, validators)
      - Business rules and regulatory constraints
      - Data flow: User Input -> Validation -> Calculation -> Output
      - Hotspots, ambiguities, and open questions

      Keep this artifact collaborative and discovery-oriented. It is an input for
      calculation modeling, specs, design, and data schema authoring.
    requires: []

  - id: calculation-modeling
    generates: calculation-modeling.md
    description: Calculation flow modeling from user inputs through validation and formulas to outputs
    template: calculation-modeling.md
    instruction: |
      Transform event-storming outputs into structured calculation flows.

      Use swim lanes in this sequence:
      User Input -> Validation -> Calculation -> Output

      Add Mermaid diagrams to visualize data flow through the calculation pipeline.
      This artifact should make input-output dependencies and formula chains explicit
      so later specs, design, and data-schema work stays aligned with discovered behavior.
    requires:
      - event-storming

  - id: specs
    generates: specs/**/*.md
    description: User-story specifications with testable acceptance criteria
    template: specs/spec.md
    instruction: |
      Author user-story specifications derived from discovery and modeling artifacts.

      Requirements:
      - Use user-story format: As a <role>, I want <capability>, so that <benefit>.
      - Use Given/When/Then acceptance criteria for each story.
      - Keep each story traceable to event-storming and calculation-modeling outputs.
    requires:
      - calculation-modeling

  - id: design
    generates: design.md
    description: Technical design decisions for the calculation architecture
    template: design.md
    instruction: |
      Document implementation-level architecture decisions for the calculation engine.

      Include calculation engine structure, state management, precision/rounding
      strategy, data formatting conventions (BRL, Brazilian number formatting),
      rate conversion rules, and deployment concerns. Reference decisions back to
      specs and calculation-modeling flows.
    requires:
      - specs

  - id: data-schema
    generates: data-schema.md
    description: Data types, validation rules, and formula definitions for the calculation engine
    template: data-schema.md
    instruction: |
      Author the data schema from event-storming, calculation-modeling, specs, and design.

      Completion guidance:
      - `data-schema.md` is not complete until formulas are verified.
      - Verify each formula against at least two reference calculations with known results.
      - If verification fails, resolve errors before marking this artifact done.
    requires:
      - design

  - id: tasks
    generates: tasks.md
    description: Implementation checklist created after verified data schema
    template: tasks.md
    instruction: |
      Plan implementation only after upstream artifacts are complete.

      Preconditions:
      - Specs are reviewed.
      - Design is reviewed.
      - Data schema formulas have been verified against reference calculations.

      Break work into small, dependency-ordered checkbox tasks.
    requires:
      - data-schema

apply:
  requires:
    - tasks
  tracks: tasks.md
  instruction: |
    Read context files, work through pending tasks, mark complete as you go.
    Pause if you hit blockers or need clarification.
```

**Step 3: Verify schema.yaml is valid YAML**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('openspec/schemas/calculation/schema.yaml')); print('VALID')"
```
Expected: `VALID`

**Step 4: Commit**

```bash
git add openspec/schemas/calculation/schema.yaml
git commit -m "add: calculation schema definition (schema.yaml)"
```

---

### Task 2: Create event-storming.md template

**Files:**
- Create: `openspec/schemas/calculation/templates/event-storming.md`

**Step 1: Write the template**

Create `openspec/schemas/calculation/templates/event-storming.md`:

```markdown
# Event Storming

Capture collaborative discovery outcomes for the calculation domain before formal specs.

## Scope and Goal
- Domain/problem area:
- Desired business outcome:
- In/out of scope:

## Actors
- Primary users:
- External data sources:
- Automated agents:

## Calculation Triggers
- Trigger:
  - What initiates this calculation:
  - Input signal (user action, data change):
  - Expected output:

## User Actions
- Action:
  - Actor (user/system):
  - Target domain/module:
  - Preconditions:
  - Expected result:

## Calculation Domains
- Domain/module:
  - Responsibilities:
  - Invariants (rules that must always hold):
  - Inputs consumed:
  - Outputs produced:

## Business Rules
- Rule name:
  - Triggering condition:
  - Constraint or formula applied:
  - Failure/violation handling:

## Calculation Flow Diagram (Mermaid)
` ``mermaid
flowchart LR
  A[User Input] --> B[Validation]
  B --> C[Calculation]
  C --> D[Output / Display]

  classDef input fill:#F7DC6F,stroke:#B7950B,color:#1C1C1C
  classDef validation fill:#85C1E9,stroke:#2471A3,color:#1C1C1C
  classDef calculation fill:#F5B041,stroke:#AF601A,color:#1C1C1C
  classDef output fill:#82E0AA,stroke:#1E8449,color:#1C1C1C

  class A input
  class B validation
  class C calculation
  class D output
` ``

## Hotspots and Open Questions
- Ambiguity:
- Risk:
- Decision needed:

## Handoff to Next Artifacts
Summarize how these findings should inform:
- `calculation-modeling.md`
- `specs/**/*.md`
- `design.md`
- `data-schema.md`
```

**Step 2: Commit**

```bash
git add openspec/schemas/calculation/templates/event-storming.md
git commit -m "add: event-storming template adapted for calculation domain"
```

---

### Task 3: Create calculation-modeling.md template

**Files:**
- Create: `openspec/schemas/calculation/templates/calculation-modeling.md`

**Step 1: Write the template**

Create `openspec/schemas/calculation/templates/calculation-modeling.md`:

```markdown
# Calculation Modeling

Convert event-storming outputs into explicit calculation flows.

Use this lane sequence for each scenario:
`User Input -> Validation -> Calculation -> Output`

## Scenario Overview
- Scenario:
- Business objective:
- Source references from `event-storming.md`:

## Swim Lanes

### User Input
- Input field/parameter:
- Data type and unit:
- Default value:
- Source (user-entered, derived, hardcoded):

### Validation
- Validation rule:
- Input(s) validated:
- Constraint (range, regulatory, business):
- Error/feedback on failure:

### Calculation
- Formula/engine:
- Input dependencies:
- Intermediate values computed:
- Precision/rounding rules:

### Output
- Output name:
- Data structure:
- Display format:
- Consumer (UI component, export, etc.):

## Mermaid Flow
` ``mermaid
flowchart LR
  I[User Input] --> V[Validation]
  V --> C[Calculation]
  C --> O[Output]

  classDef input fill:#F7DC6F,stroke:#B7950B,color:#1C1C1C
  classDef validation fill:#85C1E9,stroke:#2471A3,color:#1C1C1C
  classDef calculation fill:#F5B041,stroke:#AF601A,color:#1C1C1C
  classDef output fill:#82E0AA,stroke:#1E8449,color:#1C1C1C

  class I input
  class V validation
  class C calculation
  class O output
` ``

## Swimlane Diagram
` ``mermaid
flowchart LR
  subgraph InputLane[User Input]
    I1[Input]
  end
  subgraph ValidationLane[Validation]
    V1[Rule]
  end
  subgraph CalculationLane[Calculation]
    C1[Formula]
  end
  subgraph OutputLane[Output]
    O1[Result]
  end

  I1 --> V1
  V1 --> C1
  C1 --> O1

  classDef input fill:#F7DC6F,stroke:#B7950B,color:#1C1C1C
  classDef validation fill:#85C1E9,stroke:#2471A3,color:#1C1C1C
  classDef calculation fill:#F5B041,stroke:#AF601A,color:#1C1C1C
  classDef output fill:#82E0AA,stroke:#1E8449,color:#1C1C1C

  class I1 input
  class V1 validation
  class C1 calculation
  class O1 output
` ``

## Derivation Notes for Downstream Artifacts
- Specs inputs (user stories and acceptance criteria):
- Design inputs (calculation architecture, precision, formatting):
- Data schema inputs (types, formulas, validation rules):
```

**Step 2: Commit**

```bash
git add openspec/schemas/calculation/templates/calculation-modeling.md
git commit -m "add: calculation-modeling template replacing event-modeling"
```

---

### Task 4: Create specs template

**Files:**
- Create: `openspec/schemas/calculation/templates/specs/spec.md`

**Step 1: Write the template**

Create `openspec/schemas/calculation/templates/specs/spec.md` — this is identical to the existing spec template (it's already generic):

```markdown
## ADDED User Stories

### User Story: <capability or behavior>
As a <role>, I want <capability>, so that <benefit>.

#### Acceptance Criteria
- **Given** <context>
- **When** <condition>
- **Then** <expected outcome>

## MODIFIED User Stories

### User Story: <existing capability or behavior>
As a <role>, I want <updated capability>, so that <updated benefit>.

#### Acceptance Criteria
- **Given** <context>
- **When** <updated condition>
- **Then** <updated expected outcome>

## REMOVED User Stories

### User Story: <removed capability or behavior>
As a <role>, I wanted <removed capability>, so that <previous benefit>.

#### Removal Rationale
Explain why this user story is removed.
```

**Step 2: Commit**

```bash
git add openspec/schemas/calculation/templates/specs/spec.md
git commit -m "add: specs template for calculation schema (unchanged from event-driven)"
```

---

### Task 5: Create design.md template

**Files:**
- Create: `openspec/schemas/calculation/templates/design.md`

**Step 1: Write the template**

Create `openspec/schemas/calculation/templates/design.md`:

```markdown
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
```

**Step 2: Commit**

```bash
git add openspec/schemas/calculation/templates/design.md
git commit -m "add: design template adapted for calculation architecture"
```

---

### Task 6: Create data-schema.md template

**Files:**
- Create: `openspec/schemas/calculation/templates/data-schema.md`

**Step 1: Write the template**

Create `openspec/schemas/calculation/templates/data-schema.md`:

```markdown
# Data Schema

Define all data types, validation rules, and formula specifications for the
calculation engine. Derived from event-storming, calculation-modeling, specs,
and design artifacts.

Verification gate:
  Verify each formula against at least two reference calculations with known results.
  Do not mark the data-schema artifact complete until verification succeeds.

## Input Data Types

- Field name:
  - Type:
  - Unit:
  - Range (min–max):
  - Default value:
  - Required/optional:

## Validation Rules

- Rule name:
  - Input(s) validated:
  - Constraint:
  - Error message:
  - Regulatory source (if applicable):

## Formula Definitions

### <Formula Name>
- Purpose:
- Variables:
  - `var`: description (unit)
- Formula:
  ```
  <mathematical expression>
  ```
- Reference calculation:
  - Inputs: ...
  - Expected output: ...
- Notes (edge cases, precision):

## Output Data Types

- Output name:
  - Fields:
    - field: type (unit)
  - Used by (UI component, export):

## Edge Cases

- Case:
  - Condition:
  - Expected behavior:
  - Rationale:

## Verification Log

| Formula | Input Set | Expected | Actual | Pass/Fail |
|---------|-----------|----------|--------|-----------|
| | | | | |
```

**Step 2: Commit**

```bash
git add openspec/schemas/calculation/templates/data-schema.md
git commit -m "add: data-schema template replacing asyncapi.yaml"
```

---

### Task 7: Create tasks.md template

**Files:**
- Create: `openspec/schemas/calculation/templates/tasks.md`

**Step 1: Write the template**

Create `openspec/schemas/calculation/templates/tasks.md`:

```markdown
## 1. Validate Upstream Artifacts

- [ ] 1.1 Confirm `specs/**/*.md` is reviewed and acceptance criteria are final.
- [ ] 1.2 Confirm `design.md` is reviewed and architecture decisions are finalized.
- [ ] 1.3 Verify `data-schema.md` formulas against reference calculations and confirm all pass.

## 2. Plan Implementation

- [ ] 2.1 Break implementation work into dependency-ordered tasks.
- [ ] 2.2 Include tests verifying formulas against known reference calculations.
- [ ] 2.3 Include UI tasks with pt-BR labels and BRL currency formatting.
```

**Step 2: Commit**

```bash
git add openspec/schemas/calculation/templates/tasks.md
git commit -m "add: tasks template with calculation-specific preconditions"
```

---

### Task 8: Update config.yaml

**Files:**
- Modify: `openspec/config.yaml:1` (change `schema: event-driven` to `schema: calculation`)

**Step 1: Update the schema reference**

In `openspec/config.yaml`, change line 1:

```yaml
# Before:
schema: event-driven

# After:
schema: calculation
```

**Step 2: Commit**

```bash
git add openspec/config.yaml
git commit -m "update: config.yaml to reference calculation schema"
```

---

### Task 9: Remove old event-driven schema

**Files:**
- Delete: `openspec/schemas/event-driven/` (entire directory)

**Step 1: Verify the new schema is complete**

Run:
```bash
ls -R openspec/schemas/calculation/
```

Expected output should show:
```
openspec/schemas/calculation/:
schema.yaml  templates

openspec/schemas/calculation/templates:
calculation-modeling.md  data-schema.md  design.md  event-storming.md  specs  tasks.md

openspec/schemas/calculation/templates/specs:
spec.md
```

**Step 2: Remove the old directory**

Run:
```bash
rm -rf openspec/schemas/event-driven
```

**Step 3: Verify removal**

Run:
```bash
ls openspec/schemas/
```

Expected: `calculation  minimalist` (no `event-driven`)

**Step 4: Commit**

```bash
git add -A openspec/schemas/event-driven
git commit -m "remove: old event-driven schema (replaced by calculation)"
```

---

### Task 10: Final verification

**Step 1: Verify schema.yaml parses and references all templates**

Run:
```bash
python3 -c "
import yaml
schema = yaml.safe_load(open('openspec/schemas/calculation/schema.yaml'))
assert schema['name'] == 'calculation'
assert len(schema['artifacts']) == 6
ids = [a['id'] for a in schema['artifacts']]
assert ids == ['event-storming', 'calculation-modeling', 'specs', 'design', 'data-schema', 'tasks']
print('Schema OK:', ids)
"
```

Expected: `Schema OK: ['event-storming', 'calculation-modeling', 'specs', 'design', 'data-schema', 'tasks']`

**Step 2: Verify all templates exist**

Run:
```bash
python3 -c "
import yaml, os
schema = yaml.safe_load(open('openspec/schemas/calculation/schema.yaml'))
base = 'openspec/schemas/calculation/templates'
for a in schema['artifacts']:
    t = os.path.join(base, a['template'])
    exists = os.path.isfile(t)
    status = 'OK' if exists else 'MISSING'
    print(f'{status}: {t}')
"
```

Expected: all lines show `OK`

**Step 3: Verify config.yaml points to calculation**

Run:
```bash
python3 -c "
import yaml
config = yaml.safe_load(open('openspec/config.yaml'))
assert config['schema'] == 'calculation', f'Expected calculation, got {config[\"schema\"]}'
print('Config OK: schema =', config['schema'])
"
```

Expected: `Config OK: schema = calculation`
