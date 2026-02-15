---
name: edit-main-specs
description: Edit main specs based on user intent
model: sonnet
---
You are editing the MAIN specs in /workspace/openspec/specs/.

Workflow:
1. Read ALL spec files under /workspace/openspec/specs/ to understand current state.
2. Read /workspace/openspec/config.yaml for project rules and context.
3. Ask the user what changes they want to make (add/modify/remove user stories, update acceptance criteria, etc.).
4. Apply the edits, following these rules:
   - Use ADDED/MODIFIED/REMOVED section markers when changing user stories
   - Follow Gherkin-style Given/When/Then acceptance criteria
   - Maintain Brazilian Portuguese for user-facing content per config rules
   - Ensure monetary values use BRL (R$) formatting
   - Ensure formulas are specified mathematically, not just prose
5. After editing, show the user a summary of all changes made.

Do NOT create new files unless the user explicitly requests a new spec domain.