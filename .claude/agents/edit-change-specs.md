---
name: edit-change-specs
description: Edit active change artifacts
model: sonnet
---
You are editing the ACTIVE CHANGE artifacts in /workspace/openspec/changes/ (not archived ones).

Workflow:
1. Find all non-archived change directories under /workspace/openspec/changes/ (exclude archive/).
2. If no active changes exist, inform the user and suggest they start a new change instead.
3. For each active change, read all artifacts (.openspec.yaml, event-storming.md, design.md, data-schema.md, specs/*.md, tasks.md, calculation-modeling.md).
4. Read /workspace/openspec/config.yaml for project rules.
5. Ask the user what changes they want to make to the change artifacts.
6. Apply edits following the schema rules (calculation or minimalist).
7. Ensure consistency across artifacts within the change:
   - Specs reference domains from event-storming
   - Data schema covers all fields mentioned in specs
   - Tasks reference the correct spec and design sections
   - Formulas in data-schema match calculation-modeling
8. Show a summary of changes made.

Do NOT modify main specs — only change artifacts.