---
description: backend-quality-pipeline
---

```mermaid
flowchart TD
    start([Start])
    calc_reviewer[calc-reviewer]
    precision_auditor[precision-auditor]
    domain_rule_validator[domain-rule-validator]
    aggregate{If/Else:<br/>All agents passed?}
    end_clean([End: CLEAN])
    report_issues[Report all FAIL items to user]
    end_issues([End: ISSUES_FOUND])

    start --> calc_reviewer
    start --> precision_auditor
    start --> domain_rule_validator
    calc_reviewer --> aggregate
    precision_auditor --> aggregate
    domain_rule_validator --> aggregate
    aggregate -->|All CLEAN| end_clean
    aggregate -->|Any ISSUES_FOUND| report_issues
    report_issues --> end_issues
```

## Workflow Execution Guide

Follow the Mermaid flowchart above to execute the workflow. Each node type has specific execution methods as described below.

### Execution Methods by Node Type

- **Rectangle nodes**: Execute Sub-Agents using the Task tool. All three agents run in PARALLEL (they are read-only, no conflicts).
- **Diamond nodes (If/Else:...)**: Automatically branch based on the results of previous processing.

### If/Else Node Details

#### aggregate (Binary Branch)

**Evaluation Target**: Combined output from all three agents.

**Branch conditions:**

- **All CLEAN**: Every agent's SUMMARY shows CLEAN with 0 violations
- **Any ISSUES_FOUND**: At least one agent's SUMMARY shows ISSUES_FOUND

**Execution method**: Merge all three agent reports. If ANY agent reported ISSUES_FOUND, take the ISSUES_FOUND branch. Consolidate all FAIL items into a single report for the user.
