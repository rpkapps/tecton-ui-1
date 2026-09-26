"use client"

import * as React from "react"
import { cn } from "cn"
import {
  FullscreenIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
} from "lucide-react"
import { Button, buttonVariants } from "@tecton/react/components/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@tecton/react/components/resizable"
import { Separator } from "@tecton/react/components/separator"
import { Tabs, TabsList, TabsTrigger } from "@tecton/react/components/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@tecton/react/components/toggle-group"
import { CopyButton } from "@tecton/react/tecton/copy-button"

import { CodeBlock } from "@/components/code-block"
import type { BlockMeta } from "@/lib/blocks"
import { listSources, loadSource } from "@/lib/sources"

type View = "preview" | "code"
/** Preview width as a percentage of the available width (desktop / tablet / mobile). */
const sizes = { "100": "Desktop", "60": "Tablet", "30": "Mobile" } as const
type Size = keyof typeof sizes
/** react-resizable-panels' PanelImperativeHandle, derived from the generated component. */
type PanelHandle =
  NonNullable<
    React.ComponentProps<typeof ResizablePanel>["panelRef"]
  > extends React.Ref<infer T>
    ? NonNullable<T>
    : never

function BlockCode({ name }: { name: string }) {
  const files = React.useMemo(() => listSources(`blocks/${name}/`), [name])
  const [selected, setSelected] = React.useState(files[0])
  const [code, setCode] = React.useState<string | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    if (!selected) return
    setCode(null)
    setFailed(false)
    loadSource(selected).then(
      (source) => {
        if (!cancelled) setCode(source)
      },
      () => {
        if (!cancelled) setFailed(true)
      }
    )
    return () => {
      cancelled = true
    }
  }, [selected, attempt])

  if (!files.length) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No source files found.
      </p>
    )
  }

  return (
    <div className="flex h-full min-h-96 flex-col divide-y md:flex-row md:divide-x md:divide-y-0">
      <ul
        aria-label="Files"
        className="flex shrink-0 gap-1 overflow-x-auto p-2 text-xs md:block md:w-60 md:overflow-auto"
      >
        <li className="hidden px-2 py-1.5 font-medium text-muted-foreground md:block">
          Files
        </li>
        {files.map((file) => (
          <li key={file} className="shrink-0">
            <button
              type="button"
              onClick={() => setSelected(file)}
              aria-current={file === selected ? "true" : undefined}
              className={cn(
                "w-full truncate rounded-md px-2 py-1.5 text-left font-mono text-muted-foreground hover:text-foreground",
                file === selected && "bg-accent text-foreground"
              )}
              title={file}
            >
              {file.replace(`blocks/${name}/`, "")}
            </button>
          </li>
        ))}
      </ul>
      <div className="min-w-0 flex-1 overflow-auto [&_[data-code-block]]:m-0! [&_[data-code-block]]:rounded-none [&_[data-code-block]]:border-0">
        {failed ? (
          <div
            role="alert"
            className="flex h-48 flex-col items-center justify-center gap-3 p-4 text-sm text-muted-foreground"
          >
            <p>
              Could not load <code>{selected}</code>.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Retry
            </Button>
          </div>
        ) : code === null ? (
          <div className="h-48 animate-pulse" />
        ) : (
          <CodeBlock
            code={code}
            lang={selected.endsWith(".ts") ? "ts" : "tsx"}
            title={`${selected}${selected.includes(".") ? "" : ".tsx"}`}
            className="min-h-full [&>div>pre]:max-h-none"
          />
        )}
      </div>
    </div>
  )
}

/**
 * Gallery entry for a block, after ui.shadcn.com/blocks: one toolbar row
 * (view switch, title, viewport toggles, full screen, install command) above
 * a resizable iframe preview or the block's source files.
 */
export function BlockViewer({
  block,
  height = "720px",
  className,
}: {
  block: BlockMeta
  /** Height of the preview / code area on `md` and up. */
  height?: string
  className?: string
}) {
  const [view, setView] = React.useState<View>("preview")
  const [size, setSize] = React.useState<Size>("100")
  const panel = React.useRef<PanelHandle | null>(null)
  const command = `npx shadcn@latest add @tecton/${block.name}`

  const resize = (next: Size) => {
    setSize(next)
    panel.current?.resize(`${next}%`)
  }

  return (
    <div
      id={block.name}
      data-slot="block-viewer"
      data-view={view}
      style={{ "--height": height } as React.CSSProperties}
      className={cn(
        "group/block-viewer flex min-w-0 scroll-mt-24 flex-col gap-4",
        className
      )}
    >
      <div className="flex w-full items-center gap-2 **:data-[slot=separator]:h-4! **:data-[slot=separator]:self-center">
        <Tabs
          value={view}
          onValueChange={(value) => setView(value as View)}
          className="gap-0"
        >
          <TabsList className="bg-transparent p-0 group-data-horizontal/tabs:h-8">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </Tabs>
        <Separator orientation="vertical" className="mx-1 hidden lg:block" />
        <a
          href={`#${block.name}`}
          className="min-w-0 truncate text-sm font-medium underline-offset-4 hover:underline"
        >
          {block.title}
        </a>
        <span className="hidden min-w-0 truncate text-sm text-muted-foreground xl:inline">
          {block.description}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden h-7 items-center gap-1 rounded-md border p-[2px] lg:flex">
            <ToggleGroup
              aria-label="Preview width"
              value={[size]}
              onValueChange={(value) => {
                if (value[0]) resize(value[0] as Size)
              }}
              spacing={0}
              className="gap-0.5"
            >
              <ToggleGroupItem
                value="100"
                aria-label={sizes["100"]}
                className="size-[22px] min-w-0 rounded-sm p-0"
              >
                <MonitorIcon className="size-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="60"
                aria-label={sizes["60"]}
                className="size-[22px] min-w-0 rounded-sm p-0"
              >
                <TabletIcon className="size-3.5" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="30"
                aria-label={sizes["30"]}
                className="size-[22px] min-w-0 rounded-sm p-0"
              >
                <SmartphoneIcon className="size-3.5" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Separator orientation="vertical" className="mx-0.5" />
            <a
              href={`/view/${block.name}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Open in a new tab"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-xs" }),
                "size-[22px] rounded-sm"
              )}
            >
              <FullscreenIcon className="size-3.5" />
            </a>
          </div>
          <a
            href={`/view/${block.name}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in a new tab"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "lg:hidden"
            )}
          >
            <FullscreenIcon />
          </a>
          <Separator orientation="vertical" className="mx-1 hidden lg:block" />
          <CopyButton
            value={command}
            size="sm"
            variant="outline"
            aria-label={`Copy ${command}`}
          >
            <span className="hidden sm:inline">Copy command</span>
          </CopyButton>
        </div>
      </div>

      <div className="relative group-data-[view=code]/block-viewer:hidden">
        <ResizablePanelGroup
          orientation="horizontal"
          className="relative z-10 md:min-h-(--height)"
        >
          <ResizablePanel
            panelRef={panel}
            defaultSize="100%"
            minSize="30%"
            className="relative aspect-[4/2.5] overflow-hidden rounded-xl border bg-background md:aspect-auto md:h-(--height)"
          >
            <iframe
              src={`/view/${block.name}`}
              title={block.title}
              loading="lazy"
              className="relative z-20 size-full bg-background"
            />
          </ResizablePanel>
          <ResizableHandle className="relative hidden w-3 bg-transparent after:absolute after:inset-y-auto after:top-1/2 after:right-0 after:left-auto after:h-8 after:w-[6px] after:translate-x-[-1px] after:-translate-y-1/2 after:rounded-full after:bg-border after:transition-all hover:after:h-10 md:block" />
          <ResizablePanel defaultSize="0%" minSize="0%" />
        </ResizablePanelGroup>
      </div>

      <div className="bg-code text-code-foreground mr-[14px] hidden overflow-hidden rounded-xl border group-data-[view=code]/block-viewer:block md:h-(--height)">
        {view === "code" && <BlockCode name={block.name} />}
      </div>
    </div>
  )
}
