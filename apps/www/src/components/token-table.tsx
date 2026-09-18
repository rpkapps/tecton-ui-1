"use client"

import { cn } from "cn"

import { Badge } from "@tecton/react/components/badge"
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

function Value({ label, value }: { label: string; value: string }) {
  const isColor = /^(#|oklch|rgb|hsl)/.test(value)
  return (
    <span className="flex items-center gap-2 font-mono text-xs whitespace-nowrap">
      <span className="w-8 text-[10px] text-muted-foreground uppercase">
        {label}
      </span>
      {isColor && <ColorSwatch color={value} size="sm" shape="square" />}
      {value}
    </span>
  )
}

function Rows({
  entries,
  compact,
  provenance,
}: {
  entries: [string, Mapping][]
  compact?: boolean
  provenance: boolean
}) {
  const light = theme.cssVars.light as Record<string, string>
  const dark = theme.cssVars.dark as Record<string, string>
  return (
    <>
      {entries.map(([name, mapping]) => (
        <tr key={name} className="border-b border-border-subtle align-top">
          <td className="max-w-56 py-2 pr-4 font-mono text-xs">
            <span className="block whitespace-nowrap">--{name}</span>
            <span className="block text-muted-foreground">{mapping.dark}</span>
            {mapping.light && mapping.light !== mapping.dark && (
              <span className="block text-muted-foreground opacity-70">
                light: {mapping.light}
              </span>
            )}
          </td>
          <td className="flex flex-col gap-1 py-2 pr-4">
            <Value label="dark" value={dark[name] ?? "�"} />
            <Value label="light" value={light[name] ?? "�"} />
          </td>
          {provenance && (
            <td className="py-2 pr-4">
              <Badge
                appearance="outline"
                variant={confidenceColor[mapping.confidence]}
              >
                {mapping.confidence}
              </Badge>
            </td>
          )}
          {provenance && !compact && (
            <td className="py-2 text-xs text-muted-foreground">
              {mapping.note}
            </td>
          )}
        </tr>
      ))}
    </>
  )
}

/**
 * Generated from tokens/tecton.map.json + registry/theme.json.
 *
 * `provenance` adds how the value was derived (confidence + note). That is
 * maintenance information, so the application-facing Theming page turns it off
 * and only the contributor page shows it.
 */
export function TokenTable({
  compact,
  provenance = true,
  className,
}: {
  compact?: boolean
  provenance?: boolean
  className?: string
}) {
  const standard = Object.entries(map.shadcn as Record<string, Mapping>)
  const extra = Object.entries(map.extra as Record<string, Mapping>)
  const columns = 2 + (provenance ? (compact ? 1 : 2) : 0)

  return (
    <div data-not-typeset className={cn("my-6 overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">
              theme variable / Tecton token
            </th>
            <th className="py-2 pr-4 font-medium">value</th>
            {provenance && <th className="py-2 pr-4 font-medium">confidence</th>}
            {provenance && !compact && <th className="py-2 font-medium">note</th>}
          </tr>
        </thead>
        <tbody>
          <Rows entries={standard} compact={compact} provenance={provenance} />
          <tr>
            <td
              colSpan={columns}
              className="pt-6 pb-2 text-xs font-medium text-muted-foreground"
            >
              Extra tokens (Tecton components only)
            </td>
          </tr>
          <Rows entries={extra} compact={compact} provenance={provenance} />
        </tbody>
      </table>
    </div>
  )
}
