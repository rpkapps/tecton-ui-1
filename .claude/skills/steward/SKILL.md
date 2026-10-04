---
name: steward
description: How Claude drives a pull request in tecton-ui-1 to mergeable — what must hold before a PR is opened or marked ready, and how to handle CI and review events. Read before opening a PR and on every CI or review event of a PR you own.
---

# Driving a PR in tecton-ui-1

## Before opening a PR, and before every push that is meant to be final

1. Walk `.claude/skills/tecton-change/SKILL.md` for each kind of change in the diff.
2. The checks in the tecton-change skill's "Before you finish" pass locally.
3. The `tecton-reviewer` agent has reviewed the final diff and every blocking finding is fixed or
   answered in the PR description.
4. The PR description says which docs page, guideline, CLI entry and skill lines the change
   updated, or why none was needed.

A PR that adds a component, hook or utility without its docs page, guideline, `agent/` entry and
example is not ready, even when CI is green.

## On CI or review events

- CI red: reproduce the failing step with the same command locally, fix the cause and push. Never
  skip or weaken a check to get green; if a check is wrong, fix the check in its own commit and say
  so in the PR.
- Review comments: fix and push the small ones; after any code change, run the `tecton-reviewer`
  agent again before the next push.
