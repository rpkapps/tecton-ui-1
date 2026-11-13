# Releasing

This document defines how `@tecton/react` is versioned, released and consumed.

## What is released

| Artifact | Where | How |
| --- | --- | --- |
| `@tecton/react` (`packages/tecton-react`) | Not published to a public registry (`publishConfig.access` is `restricted`) | Consumed as a workspace package or a packed tarball, or published to a private registry by its owner |
| Release notes | [`CHANGELOG.md`](CHANGELOG.md) | The version's `## [X.Y.Z]` section |
| Blocks (`@tecton/blocks`, private) | The `@tecton` shadcn registry on the docs site (`/r/{name}.json`) | Deployed with the docs site on every push to `dev`; not versioned |

Releases are cut from `dev`, the default branch. There is one version number, the `version` field
of `packages/tecton-react/package.json`. The root and `apps/www` versions are not released.

## Versioning

The package follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **Major** (`X`): breaking changes to a public import path, prop, type, CSS variable, token or
  class name. From `1.0.0` on.
- **Minor** (`Y`): new components, props, variants, icons or tokens.
- **Patch** (`Z`): bug fixes and visual fixes that do not change the API.

While the version is `0.x`, a minor bump (`0.1.0` → `0.2.0`) may contain breaking changes and a
patch bump contains fixes and additions only. Consumers should pin `~0.Y.Z` until `1.0.0`.

An upgrade of the pinned shadcn/ui commit (`docs/UPSTREAM.md`) is released like any other change:
classify it by its effect on consumers.

### Tags and dist-tags

| Tag | Example | npm dist-tag | GitHub Release |
| --- | --- | --- | --- |
| `vX.Y.Z` | `v0.2.0` | `latest` | Release |
| `vX.Y.Z-rc.N` | `v0.2.0-rc.1` | `next` | Pre-release |

The annotated tag goes on the merge commit of the release pull request. Tags are never moved or
deleted once pushed.

## Changelog

[`CHANGELOG.md`](CHANGELOG.md) follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

- Every pull request with a user-visible change adds a line under `## [Unreleased]`, in one of
  `### Added`, `### Changed`, `### Deprecated`, `### Removed`, `### Fixed`, `### Security`.
- Write for consumers: one short sentence per change, naming the component and what changed for
  the user, not how it was implemented. Group small related changes into one line. Internal
  changes (CI, docs site, scripts) are not listed.
- Prefix breaking changes with **BREAKING:** and say how to migrate.
- Pre-releases do not get their own section; their changes stay under `[Unreleased]` until the
  final release.

## Cutting a release

A release is a pull request that changes the version.

1. **Make the release pull request** from a branch off `dev`:
   ```bash
   pnpm release minor   # or patch / major
   ```
   This sets the version in `packages/tecton-react/package.json`, moves the `## [Unreleased]`
   notes into `## [X.Y.Z] - <today>`, updates the links at the bottom of `CHANGELOG.md`, and
   rebuilds the agent index, which records the version (`scripts/release-bump.mts`). It stops if
   Unreleased is empty. Review the notes, then open the pull request titled `release: vX.Y.Z`.
2. **Merge** it once CI passes. CI checks that the changelog has a section for the version.
3. **Tag** the merge commit `vX.Y.Z` (annotated) and push the tag.

This repository has no publishing workflow. To ship the version, pack it
(`pnpm --filter @tecton/react pack`, which builds `dist/` first) or publish it to your own
registry with the dist-tag from the table above.

### Pre-releases

`pnpm release minor --rc` from `0.1.0` makes `0.2.0-rc.1`, and running it again makes
`0.2.0-rc.2`. Pre-releases leave the changelog alone and use the Unreleased notes. They publish
under the `next` dist-tag. Release the final `0.2.0` with `pnpm release minor`.
Consumers opt in with `pnpm add @tecton/react@next`.

### Hotfixes

Fixes land on `dev` and ship as the next patch release. To patch an older minor while `dev` holds
breaking work, branch `release/X.Y` from the `vX.Y.Z` tag, cherry-pick the fix with its changelog
line, and merge a `pnpm release patch` pull request into that branch. Tag it like a release from
`dev`, and add the changelog entry to `dev` as well.

### A bad release

Do not unpublish or overwrite a version: release a fixed patch version, since consumers' lockfiles
may already point at the bad one.

## Installing the package

See the [installation guide](apps/www/content/docs/installation.mdx).
