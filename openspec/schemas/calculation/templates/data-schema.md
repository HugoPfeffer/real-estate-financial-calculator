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
