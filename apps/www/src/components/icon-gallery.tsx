"use client"

import * as React from "react"
import { cn } from "cn"
import { toast } from "sonner"

import { Input } from "@tecton/react/components/input"
import { ToggleGroup, ToggleGroupItem } from "@tecton/react/components/toggle-group"
import { Tooltip, TooltipTrigger } from "@tecton/react/components/tooltip"
import { tectonIcons } from "@tecton/react/icons"
import { Chip } from "@tecton/react/tecton/chip"

const sizes = [16, 20, 24] as const

export function IconGallery() {
  const [query, setQuery] = React.useState("")
  const [variant, setVariant] = React.useState<"outlined" | "filled">("outlined")
  const [size, setSize] = React.useState<(typeof sizes)[number]>(20)

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tectonIcons
    return tectonIcons.filter(
      (icon) =>
        icon.name.toLowerCase().includes(q) ||
        icon.slug.includes(q) ||
        icon.description.toLowerCase().includes(q)
    )
  }, [query])

  const counts = React.useMemo(() => {
    const c = { svg: 0, "lucide-fallback": 0, placeholder: 0 }
    for (const icon of tectonIcons) c[icon.source] += 1
    return c
  }, [])

  return (
    <div data-not-typeset className="my-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Search icons"
          placeholder="Search icons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <ToggleGroup
          aria-label="Variant"
          selectionMode="single"
          selectedKeys={[variant]}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const next = [...keys][0]
            if (next === "outlined" || next === "filled") setVariant(next)
          }}
        >
          <ToggleGroupItem id="outlined">Outlined</ToggleGroupItem>
          <ToggleGroupItem id="filled">Filled</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup
          aria-label="Size"
          selectionMode="single"
          selectedKeys={[String(size)]}
          disallowEmptySelection
          onSelectionChange={(keys) => {
            const next = Number([...keys][0])
            if (sizes.includes(next as (typeof sizes)[number])) setSize(next as (typeof sizes)[number])
          }}
        >
          {sizes.map((s) => (
            <ToggleGroupItem key={s} id={String(s)}>
              {s}px
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Chip size="xs" color="success" variant="outlined">
            {counts.svg} svg
          </Chip>
          <Chip size="xs" color="info" variant="outlined">
            {counts["lucide-fallback"]} lucide
          </Chip>
          <Chip size="xs" variant="outlined">
            {counts.placeholder} placeholder
          </Chip>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
        {items.map((icon) => (
          <TooltipTrigger key={icon.slug}>
            <button
              type="button"
              className={cn(
                "flex flex-col items-center gap-2 rounded-md border bg-card p-3 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60",
                icon.source === "placeholder" && "border-dashed"
              )}
              onClick={() => {
                const snippet = `import { ${icon.name}Icon } from "@tecton/react/icons"`
                navigator.clipboard?.writeText(snippet)
                toast(`Copied ${icon.name}Icon import`)
              }}
            >
              <icon.Icon size={size} variant={variant} />
              <span className="w-full truncate text-center text-muted-foreground">{icon.name}</span>
            </button>
            <Tooltip>
              {icon.description}
              {icon.source !== "svg" && ` · ${icon.source === "placeholder" ? "placeholder" : `lucide ${icon.lucide}`}`}
            </Tooltip>
          </TooltipTrigger>
        ))}
      </div>
      {!items.length && (
        <p className="text-sm text-muted-foreground">No icons match “{query}”.</p>
      )}
    </div>
  )
}
