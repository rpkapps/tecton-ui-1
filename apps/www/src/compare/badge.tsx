import * as React from "react"

import { CountBadge } from "@tecton/react/tecton/count-badge"

import { Caption, Matrix, Page } from "./matrix"

/**
 * Mirrors 024_components-badge__standard-all-colors.png: a row of avatar
 * placeholders with a "1" count badge in every colour, captioned beneath.
 * Tecton's "secondary" badge colour has no CountBadge equivalent and is
 * rendered with `neutral`. A second row shows the dot variant (the sibling
 * "all colors" story).
 */
const colors = [
  { label: "default", color: "default" },
  { label: "primary", color: "primary" },
  { label: "secondary", color: "neutral" },
  { label: "error", color: "error" },
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
        "secondary" is rendered with the CountBadge `neutral` colour.
      </Caption>
    </Page>
  )
}
