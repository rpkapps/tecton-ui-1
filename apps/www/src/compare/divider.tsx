import * as React from "react"

import { Divider } from "@tecton/react/tecton/divider"

import { Matrix, Page, Section } from "./matrix"

/**
 * Mirrors 049_components-divider__variant-matrix.png.
 * HORIZONTAL: columns Subtle · Medium · Strong, one card with three
 * placeholder lines separated by dividers. VERTICAL: two placeholder blocks
 * separated by a vertical divider, one per emphasis.
 */
const emphases = [
  { label: "Subtle", emphasis: "subtle" },
  { label: "Medium", emphasis: "medium" },
  { label: "Strong", emphasis: "strong" },
] as const

function Line() {
  return <span className="block h-1.5 w-full rounded-full bg-muted" />
}

function Block() {
  return (
    <span className="flex size-12 items-center justify-center">
      <span className="block h-1.5 w-6 rounded-full bg-muted" />
    </span>
  )
}

export default function DividerMatrix() {
  return (
    <Page>
      <Section title="Horizontal" eyebrow>
        <Matrix
          columns={emphases.map(({ label }) => label)}
          rows={[
            {
              label: "Horizontal",
              cells: emphases.map(({ emphasis }) => (
                <div
                  key={emphasis}
                  className="flex w-96 flex-col gap-2 rounded-md bg-card px-3 py-3"
                >
                  <Line />
                  <Divider emphasis={emphasis} />
                  <Line />
                  <Divider emphasis={emphasis} />
                  <Line />
                </div>
              )),
            },
          ]}
          gapX="gap-x-10"
        />
      </Section>

      <Section title="Vertical" eyebrow>
        <Matrix
          columns={emphases.map(({ label }) => label)}
          rows={[
            {
              label: "Vertical",
              cells: emphases.map(({ emphasis }) => (
                <div
                  key={emphasis}
                  className="flex items-stretch rounded-md bg-card"
                >
                  <Block />
                  <Divider emphasis={emphasis} orientation="vertical" />
                  <Block />
                </div>
              )),
            },
          ]}
          gapX="gap-x-10"
        />
      </Section>
    </Page>
  )
}
