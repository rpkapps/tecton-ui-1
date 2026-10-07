---
name: steward
description: How a coding agent drives a pull request in tecton-ui-1 to mergeable — what must hold before a PR is opened or marked ready, and how to handle CI and review events. Read before opening a PR and on every CI or review event of a PR you own.
---

# Driving a pull request

## Before opening a PR or marking it ready

- The `tecton-change` skill's "Before you finish" holds, including its `tecton-review` pass.
- The description says which docs page, guideline, CLI entry and skill lines the change updated,
  or why none was needed. CI cannot see a missing docs page or example, so a green PR without them
  is not ready.

## On CI or review events

- CI red: reproduce the failing step locally with the same command, fix the cause and push. Never
  skip or weaken a check to get green; if a check is wrong, fix it in its own commit and say so.
- Review comments: fix and push the small ones; after any code change, run `tecton-review` again
  before the next push.
