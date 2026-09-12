"use client"

import { cn } from "cn"

import { Chip } from "@tecton/react/tecton/chip"
import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

import map from "../../../../packages/tecton-react/tokens/tecton.map.json"
import theme from "../../../../packages/tecton-react/registry/theme.json"

type Mapping = {
  dark: string
  light?: string
  confidence: "exact" | "approximated" | "derived"
  note?: string
}

const confidenceColor = {
  exact: "success",
  approximated: "warning",
  derived: "info",
} as const

function Value({ value }: { value: string }) {
  const isColor = /^(#|oklch|rgb|hsl)/.test(value)
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs">
      {isColor && <ColorSwatch color={value} size="sm" shape="square" />}
      {value}
    </span>
  )
}

function Rows({
  entries,
  compact,
}: {
  entries: [string, Mapping][]
  compact?: boolean
}) {
  const light = theme.cssVars.light as Record<string, string>
  const dark = theme.cssVars.dark as Record<string, string>
  return (
    <>
      {entries.map(([name, mapping]) => (
        <tr key={name} className="border-b border-border-subtle align-top">
          <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">--{name}</td>
          <td className="py-2 pr-3 font-mono text-xs break-all text-muted-foreground">
            {mapping.dark}
            {mapping.light && mapping.light !== mapping.dark && (
              <span className="block opacity-70">light: {mapping.light}</span>
            )}
          </td>
          <td className="py-2 pr-3 whitespace-nowrap">
            <Value value={dark[name] ?? "—"} />
          </td>
          <td className="py-2 pr-3 whitespace-nowrap">
            <Value value={light[name] ?? "—"} />
          </td>
          <td className="py-2 pr-3">
            <Chip size="xs" variant="outlined" color={confidenceColor[mapping.confidence]}>
              {mapping.confidence}
            </Chip>
          </td>
          {!compact && (
            <td className="py-2 text-xs text-muted-foreground">{mapping.note}</td>
          )}
        </tr>
      ))}
    </>
  )
}

/** Generated from tokens/tecton.map.json + registry/theme.json. */
export function TokenTable({ compact, className }: { compact?: boolean; className?: string }) {
  const standard = Object.entries(map.shadcn as Record<string, Mapping>)
  const extra = Object.entries(map.extra as Record<string, Mapping>)

  return (
    <div data-not-typeset className={cn("my-6 overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium">shadcn variable</th>
            <th className="py-2 pr-3 font-medium">Tecton token</th>
            <th className="py-2 pr-3 font-medium">dark</th>
            <th className="py-2 pr-3 font-medium">light</th>
            <th className="py-2 pr-3 font-medium">confidence</th>
            {!compact && <th className="py-2 font-medium">note</th>}
          </tr>
        </thead>
        <tbody>
          <Rows entries={standard} compact={compact} />
          <tr>
            <td colSpan={compact ? 5 : 6} className="pt-6 pb-2 text-xs font-medium text-muted-foreground">
              Extra tokens (Tecton components only)
            </td>
          </tr>
          <Rows entries={extra} compact={compact} />
        </tbody>
      </table>
    </div>
  )
}
