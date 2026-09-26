import * as React from "react"

import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

import tokensCss from "../../../../packages/tecton-react/src/styles/tecton-tokens.css?raw"

import { Page, Section } from "./matrix"

/**
 * Mirrors 114_foundations-colors__overview.png (colors_00 … colors_08):
 * every `--tecton-color-*` token from the raw token sheet, grouped by its
 * second path segment, rendered as a swatch with the token name and value.
 * Parsed once at module load (pure string work, SSR-safe).
 *
 * Each swatch is painted with `var(--tecton-color-…)`, not with the parsed
 * value: e2e/compare.spec.ts compares the colour the stylesheet actually
 * resolves (`data-token`) with the value in the file (`data-value`).
 */
type Token = { name: string; group: string; value: string }

const PREFIX = "--tecton-color-"

const tokens: Token[] = []
// The export declares light (:root) first and dark (.dark) second; the compare
// pages render dark, so only the dark block is read: from the `.dark` selector
// at the start of a line (the header comment mentions `.dark` too) to the end
// of its rule.
const darkStart = tokensCss.search(/^\.dark\b/m)
if (darkStart < 0) throw new Error("tecton-tokens.css has no .dark block")
const darkBlock = tokensCss.slice(
  darkStart,
  tokensCss.indexOf("}", darkStart) + 1
)
for (const match of darkBlock.matchAll(
  /--tecton-color-([a-z0-9-]+)\s*:\s*([^;]+);/g
)) {
  const [, name, rawValue] = match
  const value = rawValue.trim()
  const group = name.split("-")[0] ?? name
  tokens.push({ name, group, value })
}

const groupOrder = [
  "text",
  "bg",
  "divider",
  "action",
  "focus",
  "status",
  "accent",
  "component",
]

const groupTitles: Record<string, string> = {
  text: "Text",
  bg: "Surfaces",
  divider: "Dividers",
  action: "Actions",
  focus: "Focus",
  status: "Status",
  accent: "Accents",
  component: "Components",
}

const groups = [
  ...groupOrder,
  ...Array.from(new Set(tokens.map((token) => token.group))).filter(
    (group) => !groupOrder.includes(group)
  ),
]
  .map((group) => ({
    group,
    title: groupTitles[group] ?? group,
    tokens: tokens.filter((token) => token.group === group),
  }))
  .filter((section) => section.tokens.length > 0)

export default function TokensMatrix() {
  return (
    <Page>
      {groups.map(({ group, title, tokens: groupTokens }) => (
        <Section key={group} title={title}>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-x-6 gap-y-3">
            {groupTokens.map((token) => (
              <div
                key={token.name}
                data-token={token.name}
                data-value={token.value}
                className="min-w-0"
              >
                <ColorSwatch
                  color={`var(${PREFIX}${token.name})`}
                  size="lg"
                  shape="square"
                  label={token.name.slice(group.length + 1) || token.name}
                  value={
                    <>
                      <span>{token.value}</span>
                      <span className="ml-2 opacity-60">
                        {PREFIX}
                        {token.name}
                      </span>
                    </>
                  }
                  className="min-w-0"
                />
              </div>
            ))}
          </div>
        </Section>
      ))}
    </Page>
  )
}
