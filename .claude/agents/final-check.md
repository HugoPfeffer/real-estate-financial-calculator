---
name: final-check
description: Final quality verification after fixes
model: sonnet
---
Run the same quality checks as the initial quality gate, but this is the FINAL verification.

Check all main specs in /workspace/openspec/specs/ and all active changes in /workspace/openspec/changes/ (excluding archive/).

Perform ALL checks:
1. Orphaned references
2. Stale MODIFIED/REMOVED markers
3. Incomplete acceptance criteria
4. Duplicate user stories
5. Empty spec files
6. Cross-artifact consistency
7. Leftover TODOs/placeholders
8. Stale task references
9. Config rule compliance
10. Main specs vs change delta consistency

Output:
- PASS items
- REMAINING ISSUES (if any) with details
- FINAL VERDICT: CLEAN or NEEDS_MANUAL_REVIEW

If issues remain, clearly list what the user needs to manually address.