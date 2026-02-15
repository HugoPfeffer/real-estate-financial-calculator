---
name: auto-fix
description: Auto-fix quality gate issues
model: sonnet
---
The quality gate found issues in the OpenSpec specs/changes. Your job is to fix them.

Read the quality gate report from the previous step. For each FAIL item:

1. **Orphaned references** → Remove the reference or add the missing definition
2. **Stale MODIFIED/REMOVED markers** → Clean them up (remove markers, finalize content)
3. **Incomplete acceptance criteria** → Flag to user and ask how to complete them (do NOT invent acceptance criteria)
4. **Duplicate user stories** → Ask user which copy to keep, remove the other
5. **Empty spec files** → Ask user whether to delete or populate
6. **Cross-artifact inconsistencies** → Align artifacts (prefer specs as source of truth)
7. **Leftover TODOs/placeholders** → Resolve or ask user for the actual content
8. **Stale task references** → Update references to match current state
9. **Config rule violations** → Fix to comply with /workspace/openspec/config.yaml rules

Rules:
- NEVER invent business logic or acceptance criteria — ask the user
- ALWAYS show what you changed and why
- Prefer minimal changes that fix the issue without altering intent

After fixing, provide a summary of all fixes applied.