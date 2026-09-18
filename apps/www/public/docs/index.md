# Introduction

Tecton UI is the Tecton design system for React, built on shadcn/ui with the React Aria base.

Source: /docs/index.md

**Tecton UI** gives product teams the Tecton look and behaviour without giving up the shadcn/ui ecosystem. Every standard component is the shadcn/ui React Aria implementation, installed and updated with the shadcn CLI; Tecton's visual language is applied only through the theme variables, and everything Tecton needs beyond shadcn ships as separate, clearly named components.

## What you get

- **`@tecton/react`** — a private package with all 60 shadcn/ui React Aria components (`@tecton/react/components/*`), the Tecton-specific components (`@tecton/react/tecton/*`), the icon set (`@tecton/react/icons`), blocks and the theme stylesheet.
- **shadcn parity** — the public API, names, variants and composition patterns are exactly shadcn's. Snippets from the shadcn docs work after changing the import path.
- **Tecton tokens** — colours, radii and typography come from the Tecton design tokens, mapped to the shadcn CSS variables with a documented confidence for every value. See [Theming](/docs/theming.md).
- **Upgradeable** — no generated file is edited by hand, so the library maintainers update a component with a single shadcn CLI command. See [CLI & updates](/docs/cli.md).

## Principles

> **Only the shadcn CSS variables change**
>
> The Tecton theme lives in `:root`, `.dark` and `@theme inline` inside `globals.css`. There are no `.style-*`, `[data-slot]` or `@layer` overrides of the generated components. Anything Tecton needs that cannot be expressed through the variables becomes a Tecton component instead.

- **Dark first.** Tecton applications run dark by default; both the dark and the light theme come straight from the Tecton token export.
- **Accessible by default.** React Aria provides the interactions, keyboard behaviour and ARIA semantics.
- **Composable.** Components are small, `data-slot`-tagged building blocks, styled with Tailwind and `class-variance-authority`.

## Where to go next

| Section | What it covers |
| --- | --- |
| [Installation](/docs/installation.md) | Adding `@tecton/react` to a Vite, TanStack Start or Next.js app, and adding blocks with the shadcn CLI |
| [Theming](/docs/theming.md) | The token mapping, light and dark, adding tokens, known deviations |
| [Components](/docs/components.md) | The 60 shadcn/ui React Aria components |
| [Tecton components](/docs/tecton.md) | Chip, TreeView, Meter, Stat, Panel, AppShell… |
| [Icons](/docs/icons.md) | The Tecton icon set and how it works alongside Lucide |
| [Blocks](/blocks) | Application patterns and layouts |

## For AI agents

The docs are also published as plain text, so a coding agent can read them without
running the site. Start with [`/llms.txt`](/llms.txt) — the library's rules plus a linked
index of every page, block and icon. [`/llms-full.txt`](/llms-full.txt) is the whole
corpus in one file, and every page has a markdown twin at `/docs/<path>.md` (for example
[`/docs/components/button.md`](/docs/components/button.md)) with all of its examples
inlined as code.

> **Point your agent at the rules first**
>
> Tecton is shadcn/ui on the **React Aria** base with Tailwind's stock palette **reset**,
> so an agent's defaults are wrong in ways that fail silently — `bg-red-500` compiles to
> nothing and `onClick` should be `onPress`. The rules section at the top of `llms.txt`
> covers these; paste it into your agent's context or its rules file.
