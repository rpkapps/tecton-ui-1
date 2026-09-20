import * as React from "react"

import { CountBadge } from "@tecton/react/tecton/count-badge"

import { Caption, Matrix, Page } from "./matrix"

/**
 * Mirrors 024_components-badge__standard-all-colors.png: a row of avatar
 * placeholders with a "1" count badge in every colour, captioned beneath.
 * CountBadge's colours are Badge's variant names, so Tecton's "primary" is
 * `default` and both "default" and "secondary" land on `secondary`. A second
 * row shows the dot variant (the sibling "all colors" story).
 */
const colors = [
  { label: "default", color: "secondary" },
  { label: "primary", color: "default" },
  { label: "secondary", color: "secondary" },
  { label: "error", color: "destructive" },
  { label: "warning", color: "warning" },
  { label: "info", color: "info" },
  { label: "success", color: "success" },
] as const

function Anchor() {
  return <span className="block size-10 rounded-full bg-muted" />
}

export default function BadgeMatrix() {
  return (
    <Page>
      <div className="flex flex-wrap gap-10">
        {colors.map(({ label, color }) => (
          <div key={label} className="flex flex-col items-center gap-3">
            <CountBadge color={color} count={1}>
              <Anchor />
            </CountBadge>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <Matrix
        columns={colors.map(({ label }) => label)}
        rows={[
          {
            label: "Standard",
            cells: colors.map(({ label, color }) => (
              <CountBadge key={label} color={color} count={1}>
                <Anchor />
              </CountBadge>
            )),
          },
          {
            label: "Dot",
            cells: colors.map(({ label, color }) => (
              <CountBadge key={label} color={color} variant="dot">
                <Anchor />
              </CountBadge>
            )),
          },
        ]}
      />
      <Caption>
        "default" and "secondary" are both rendered with the CountBadge
        `secondary` colour; "primary" is its `default`.
      </Caption>
    </Page>
  )
}
