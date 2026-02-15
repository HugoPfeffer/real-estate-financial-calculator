---
name: scan-state
description: Scan openspec specs and active changes
model: haiku
---
Scan the OpenSpec directory structure and report current state.

1. Read all main specs in /workspace/openspec/specs/ — list each spec file, summarize its user stories, and note any ADDED/MODIFIED/REMOVED sections.
2. Check /workspace/openspec/changes/ for any NON-archived active changes (directories directly under changes/ that are NOT inside archive/). For each active change:
   - Read .openspec.yaml for metadata
   - List all artifacts (event-storming.md, design.md, data-schema.md, specs/*.md, tasks.md, etc.)
   - Summarize the change scope and current status
3. Report:
   - Total main specs count and names
   - Active changes count (0 if none)
   - Any obvious issues (empty specs, missing required files)

Present a clear summary so the user knows what they're working with.