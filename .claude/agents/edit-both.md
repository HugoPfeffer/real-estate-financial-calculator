---
name: edit-both
description: Edit both main specs and active change
model: sonnet
---
You are editing BOTH the main specs and active change artifacts.

Workflow:
1. Read ALL main specs from /workspace/openspec/specs/.
2. Find and read all NON-archived change directories under /workspace/openspec/changes/ (exclude archive/).
3. Read /workspace/openspec/config.yaml for project rules and context.
4. Ask the user what changes they want to make.
5. Apply edits to both locations as needed, following these rules:
   - Main specs: Use ADDED/MODIFIED/REMOVED markers, Gherkin acceptance criteria
   - Change artifacts: Maintain consistency across event-storming, design, data-schema, specs, tasks
   - Cross-consistency: If a main spec is modified, check if any active change references it and update accordingly
   - Follow BRL formatting, mathematical formula notation, and pt-BR conventions
6. Show a summary of ALL changes across both main specs and change artifacts.

Be careful about the direction of changes — main specs are the source of truth, changes are deltas.