---
name: frontend-quality-pipeline
description: Run all 4 frontend agents in parallel for comprehensive UI quality review
---

# Frontend Quality Pipeline

Run a comprehensive quality review of the frontend UI layer by dispatching all 4 agents in parallel.

## Execution

1. Identify all recently changed files in `src/lib/components/`, `src/lib/stores/`, and `src/routes/` using `git diff --name-only` or the user's stated scope.

2. Dispatch all 4 agents in parallel via the Task tool:

   - **ui-reviewer** (subagent_type: `ui-reviewer`) — Svelte 5 compliance, shadcn usage, store patterns, import conventions
   - **style-auditor** (subagent_type: `style-auditor`) — Design system compliance, dark mode, spacing, responsive layout
   - **a11y-auditor** (subagent_type: `a11y-auditor`) — Accessibility, semantic HTML, keyboard nav, pt-BR language
   - **chart-reviewer** (subagent_type: `chart-reviewer`) — SVG chart patterns, color mapping, downsampling, axes

   Pass the list of changed files to each agent.

3. Collect results from all 4 agents.

4. Aggregate and present a unified report:

```text
## Frontend Quality Pipeline Results

### ui-reviewer
[agent output]

### style-auditor
[agent output]

### a11y-auditor
[agent output]

### chart-reviewer
[agent output]

---

### OVERALL: CLEAN | ISSUES_FOUND (total N violations across M agents)
```

If any agent reports ISSUES_FOUND, the overall result is ISSUES_FOUND.
