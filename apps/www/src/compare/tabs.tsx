import * as React from "react"
import { cn } from "cn"
import { SearchIcon } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"

import { Caption, ColumnHeader, Page, Section } from "./matrix"

/**
 * Mirrors 097_components-tab__state-matrix.png.
 * Blocks Underline / Filled × Horizontal / Vertical × Medium / Small.
 * Storybook columns: enabled · hovered · focused · pressed · activated ·
 * disabled. The three prop-driven states are rendered as three tabs of one
 * `TabsList` (value = activated, disabled = disabled) so the tabs
 * keep their real spacing.
 *
 * Mapping: Underline → `variant="line"`, Filled → `variant="default"`.
 */
const variants = [
  { label: "Underline", variant: "line" },
  { label: "Filled", variant: "default" },
] as const

const orientations = ["horizontal", "vertical"] as const
const sizes = ["md", "sm"] as const

const states = [
  { id: "enabled", label: "enabled" },
  { id: "activated", label: "activated" },
  { id: "disabled", label: "disabled" },
] as const

function TabRow({
  variant,
  orientation,
  size,
}: {
  variant: (typeof variants)[number]["variant"]
  orientation: (typeof orientations)[number]
  size: (typeof sizes)[number]
}) {
  const horizontal = orientation === "horizontal"
  const slot = horizontal ? "w-24" : size === "sm" ? "h-7" : "h-9"

  const labels = (
    <div className={cn("flex", horizontal ? "flex-row" : "flex-col gap-[3px]")}>
      {states.map((state) => (
        <ColumnHeader
          key={state.id}
          className={cn(
            "flex items-center",
            slot,
            horizontal && "justify-center"
          )}
        >
          {state.label}
        </ColumnHeader>
      ))}
    </div>
  )

  const tabs = (
    <Tabs orientation={orientation} value="activated">
      <TabsList
        variant={variant}
        aria-label={`${variant} ${orientation} ${size}`}
        className={cn(
          horizontal && size === "sm" && "group-data-horizontal/tabs:h-7"
        )}
      >
        {states.map((state) => (
          <TabsTrigger
            key={state.id}
            value={state.id}
            disabled={state.id === "disabled"}
            className={cn(
              "flex-none justify-center",
              slot,
              size === "sm" &&
                "px-1.5 text-xs [&_svg:not([class*='size-'])]:size-3.5"
            )}
          >
            <SearchIcon data-icon="inline-start" />
            Tab
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )

  return horizontal ? (
    <div className="flex flex-col gap-1">
      {labels}
      {tabs}
    </div>
  ) : (
    <div className="flex items-start gap-4">
      {labels}
      {tabs}
    </div>
  )
}

export default function TabsMatrix() {
  return (
    <Page>
      {variants.map(({ label, variant }) => (
        <Section key={variant} title={label}>
          {orientations.map((orientation) => (
            <Section
              key={orientation}
              title={
                <span className="text-sm">
                  {orientation === "horizontal" ? "Horizontal" : "Vertical"}
                </span>
              }
            >
              {sizes.map((size) => (
                <div key={size} className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">
                    {size === "md" ? "Medium" : "Small"}
                  </span>
                  <TabRow
                    variant={variant}
                    orientation={orientation}
                    size={size}
                  />
                </div>
              ))}
            </Section>
          ))}
        </Section>
      ))}
      <Caption>
        hovered, focused and pressed columns from Storybook are omitted.
      </Caption>
    </Page>
  )
}
