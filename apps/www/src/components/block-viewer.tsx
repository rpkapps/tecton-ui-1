"use client"

import * as React from "react"
import { cn } from "cn"
import {
  ExternalLinkIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
} from "lucide-react"

import { LinkButton } from "@tecton/react/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@tecton/react/components/tabs"
import { ToggleGroup, ToggleGroupItem } from "@tecton/react/components/toggle-group"
import { Chip } from "@tecton/react/tecton/chip"
import { CopyButton } from "@tecton/react/tecton/copy-button"

import { CodeBlock } from "@/components/code-block"
import type { BlockMeta } from "@/lib/blocks"
import { listSources, loadSource } from "@/lib/sources"

const widths = { desktop: "100%", tablet: "768px", mobile: "400px" } as const
type Width = keyof typeof widths

function BlockSources({ name }: { name: string }) {
  const files = React.useMemo(() => listSources(`blocks/${name}/`), [name])
  const [selected, setSelected] = React.useState(files[0])
  const [code, setCode] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    if (!selected) return
    setCode(null)
    loadSource(selected).then((source) => {
      if (!cancelled) setCode(source)
    })
    return () => {
      cancelled = true
    }
  }, [selected])

  if (!files.length) {
    return <p className="p-4 text-sm text-muted-foreground">No source files found.</p>
  }

  return (
    <div className="flex min-h-96 divide-x">
      <ul className="w-56 shrink-0 overflow-auto py-2 text-xs">
        {files.map((file) => (
          <li key={file}>
            <button
              type="button"
              onClick={() => setSelected(file)}
              className={cn(
                "w-full truncate px-3 py-1.5 text-left font-mono text-muted-foreground hover:text-foreground",
                file === selected && "bg-accent text-foreground"
              )}
              title={file}
            >
              {file.replace(`blocks/${name}/`, "")}
            </button>
          </li>
        ))}
      </ul>
      <div className="min-w-0 flex-1 [&_[data-rehype-pretty-code-figure]]:m-0! [&_[data-rehype-pretty-code-figure]]:rounded-none [&_pre]:max-h-[36rem]">
        {code === null ? (
          <div className="h-48 animate-pulse" />
        ) : (
          <CodeBlock
            code={code}
            lang={selected?.endsWith(".ts") ? "ts" : "tsx"}
            title={`@tecton/react/${selected}${selected?.includes(".") ? "" : ".tsx"}`}
          />
        )}
      </div>
    </div>
  )
}

export function BlockViewer({
  block,
  compact = false,
  children,
}: {
  block: BlockMeta
  compact?: boolean
  children?: React.ReactNode
}) {
  const [width, setWidth] = React.useState<Width>("desktop")

  return (
    <div data-slot="block-viewer" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{block.title}</h3>
            <Chip size="xs" variant="outlined">
              {block.name}
            </Chip>
          </div>
          <p className="text-xs text-muted-foreground">{block.description}</p>
          <div className="mt-1.5 flex w-fit items-center gap-1 rounded-md border bg-code py-0.5 pr-0.5 pl-2 font-mono text-xs text-muted-foreground">
            <span>npx shadcn@latest add @tecton/{block.name}</span>
            <CopyButton value={`npx shadcn@latest add @tecton/${block.name}`} size="icon-xs" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {children}
          <ToggleGroup
            aria-label="Preview width"
            selectionMode="single"
            selectedKeys={[width]}
            disallowEmptySelection
            onSelectionChange={(keys) => setWidth([...keys][0] as Width)}
            className="hidden md:flex"
          >
            <ToggleGroupItem id="desktop" aria-label="Desktop">
              <MonitorIcon />
            </ToggleGroupItem>
            <ToggleGroupItem id="tablet" aria-label="Tablet">
              <TabletIcon />
            </ToggleGroupItem>
            <ToggleGroupItem id="mobile" aria-label="Mobile">
              <SmartphoneIcon />
            </ToggleGroupItem>
          </ToggleGroup>
          <LinkButton
            variant="outline"
            size="sm"
            href={`/view/${block.name}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLinkIcon data-icon="inline-start" /> Full screen
          </LinkButton>
        </div>
      </div>
      <Tabs defaultSelectedKey="preview" className="gap-3">
        <TabsList variant="line" className="h-8">
          <TabsTrigger id="preview">Preview</TabsTrigger>
          <TabsTrigger id="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent id="preview">
          <div className="flex w-full justify-center overflow-hidden rounded-xl border bg-muted/30 p-2">
            <iframe
              src={`/view/${block.name}`}
              title={block.title}
              loading="lazy"
              className={cn(
                "rounded-lg bg-background transition-[width]",
                compact ? "h-[560px]" : "h-[calc(100svh-14rem)] min-h-[600px]"
              )}
              style={{ width: widths[width], maxWidth: "100%" }}
            />
          </div>
        </TabsContent>
        <TabsContent id="code">
          <div className="overflow-hidden rounded-xl border">
            <BlockSources name={block.name} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
