---
name: tecton-review
description: Reviews a finished change in tecton-ui-1 before it is pushed or its pull request is marked ready — completeness (test, guideline, tecton CLI index, docs page, example, skill), the AGENTS.md rules, half-implemented or dead code, and correctness. Use after implementing, on the branch diff against origin/main.
---

# Reviewing a change

Review the change as a reviewer who did not write it: read, do not edit. If your tool can run a
separate read-only agent or subagent, give it this skill and review in it, so the review is not
coloured by the implementation.

## What to review

The branch diff against its merge base with `origin/main`, committed and not:
`git diff $(git merge-base HEAD origin/main)` plus the untracked files from
`git ls-files --others --exclude-standard`. Read changed files in full where the diff alone does
not show enough.

## Check, in this order

1. **Completeness.** For each thing the diff adds or changes, walk its section of the
   `tecton-change` skill and confirm every item is in the diff. A changed prop, default or
   behaviour must also show in the guideline, the docs page text and the examples.
2. **The rules in `AGENTS.md`.**
3. **Half-implemented or dead code**, as the `tecton-change` skill defines it, plus a feature wired
   in one place but not the others it needs.
4. **Correctness.** Bugs in the new logic: state and effect cleanup, edge cases, RTL, keyboard and
   accessibility (labels, roles, focus), SSR (`"use client"` where needed), and whether the tests
   exercise the behaviour they claim.

## Report

Start with `VERDICT: PASS` or `VERDICT: CHANGES NEEDED`, then the blocking findings, most severe
first, each as `path:line — what is wrong — what to do`, then brief non-blocking suggestions. A
finding is blocking when it breaks a rule, leaves something a consumer or agent reads out of date,
or is a bug. Style preferences are not blocking. If there is nothing, say PASS.

Fix every blocking finding, then review again after any further code change.
