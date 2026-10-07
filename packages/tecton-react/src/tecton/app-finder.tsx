"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { CheckIcon, ChevronDownIcon, SearchXIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@tecton/react/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tecton/react/components/popover"

/**
 * Tecton AppFinder — the shell's application switcher. The trigger shows
 * the current app as a tinted code tile (plus its name from `sm` up) in
 * the top bar; the menu is a searchable, category-grouped list built on
 * `Command`, so it stays usable with a hundred registered
 * micro-frontends. Typing filters across every group and highlights the
 * match; `onSelect` on `AppFinderList` receives the chosen app's `value`
 * and the popover closes.
 */

/** Closes the menu; provided by `AppFinder`. */
const AppFinderRootContext = React.createContext<{ close: () => void }>({
  close: () => {},
})

/** The query, owned by the palette so it resets whenever the menu opens. */
const AppFinderSearchContext = React.createContext<{
  query: string
  setQuery: (query: string) => void
}>({ query: "", setQuery: () => {} })

/** The list's `onSelect`, called by the item that is chosen. */
const AppFinderListContext = React.createContext<
  ((value: string) => void) | undefined
>(undefined)

const appFinderIconVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md font-mono font-medium tracking-wide uppercase select-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-foreground",
        blue: "bg-blue-120 text-blue-830",
        azure: "bg-azure-120 text-azure-830",
        green: "bg-green-120 text-green-830",
        lime: "bg-lime-120 text-lime-830",
        yellow: "bg-yellow-120 text-yellow-1000",
        saffron: "bg-saffron-120 text-saffron-830",
        red: "bg-red-120 text-red-830",
        pink: "bg-pink-120 text-pink-830",
        orchid: "bg-orchid-120 text-orchid-830",
        mauve: "bg-mauve-120 text-mauve-830",
        violet: "bg-violet-120 text-violet-830",
        lilac: "bg-lilac-120 text-lilac-830",
      },
      size: {
        sm: "size-6 text-[10px]",
        default: "size-7 text-[11px]",
      },
    },
    defaultVariants: { tone: "neutral", size: "default" },
  }
)

type AppFinderTone = NonNullable<
  VariantProps<typeof appFinderIconVariants>["tone"]
>

/** The tinted code tile shared by the trigger and the items. */
function AppFinderIcon({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof appFinderIconVariants>) {
  return (
    <span
      data-slot="app-finder-icon"
      className={cn(appFinderIconVariants({ tone, size }), className)}
      {...props}
    />
  )
}

type AppFinderProps = {
  /** Whether the menu is open (controlled). */
  open?: boolean
  /** Whether the menu is initially open (uncontrolled). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** `AppFinderTrigger` and `AppFinderMenu`. */
  children?: React.ReactNode
}

function AppFinder({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: AppFinderProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange]
  )
  const context = React.useMemo(
    () => ({ close: () => setOpen(false) }),
    [setOpen]
  )
  return (
    <AppFinderRootContext.Provider value={context}>
      <Popover open={open} onOpenChange={(next) => setOpen(next)}>
        {children}
      </Popover>
    </AppFinderRootContext.Provider>
  )
}

type AppFinderTriggerProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  /** Short code (or glyph) of the current app, shown in the tile. */
  children?: React.ReactNode
  /** Name of the current app; shown next to the tile from `sm` up. */
  name?: string
  /** Colour of the tile; use the app's category tone. */
  tone?: AppFinderTone
}

function AppFinderTrigger({
  className,
  children,
  name,
  tone,
  "aria-label": ariaLabel,
  ...props
}: AppFinderTriggerProps) {
  return (
    <PopoverTrigger
      data-slot="app-finder-trigger"
      render={
        <Button
          variant="ghost"
          size="sm"
          aria-label={
            ariaLabel ??
            (name ? `Switch application, current: ${name}` : undefined)
          }
          className={cn(
            "h-8 gap-1.5 rounded-lg ps-1 pe-1.5 font-medium",
            className
          )}
          {...props}
        />
      }
    >
      <AppFinderIcon tone={tone} size="sm">
        {children}
      </AppFinderIcon>
      {name ? (
        <span className="hidden max-w-40 truncate sm:inline">{name}</span>
      ) : null}
      <ChevronDownIcon
        data-icon="inline-end"
        className="size-3.5 text-muted-foreground"
      />
    </PopoverTrigger>
  )
}

type AppFinderMenuProps = Pick<
  React.ComponentProps<typeof PopoverContent>,
  "side" | "align" | "sideOffset" | "alignOffset" | "container"
> & {
  className?: string
  /** `AppFinderInput`, `AppFinderList`, … */
  children: React.ReactNode
  /** Accessible name of the palette. Default "Applications". */
  "aria-label"?: string
}

function AppFinderMenu({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  "aria-label": ariaLabel = "Applications",
  ...props
}: AppFinderMenuProps) {
  return (
    <PopoverContent
      data-slot="app-finder-menu"
      aria-label={ariaLabel}
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "w-[26rem] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden rounded-lg p-0",
        className
      )}
      {...props}
    >
      <AppFinderPalette>{children}</AppFinderPalette>
    </PopoverContent>
  )
}

/**
 * Items match when their name or a keyword contains the query, ignoring
 * case, and keep their order; the `value` (an id) is not matched.
 */
function filterByKeywords(_value: string, search: string, keywords?: string[]) {
  const needle = search.trim().toLocaleLowerCase()
  if (!needle) return 1
  return keywords?.some((word) => word.toLocaleLowerCase().includes(needle))
    ? 1
    : 0
}

/** Mounted with the popup, so the query resets every time the menu opens. */
function AppFinderPalette({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = React.useState("")
  const context = React.useMemo(() => ({ query, setQuery }), [query])
  return (
    <AppFinderSearchContext.Provider value={context}>
      <Command className="rounded-lg!" filter={filterByKeywords}>
        {children}
      </Command>
    </AppFinderSearchContext.Provider>
  )
}

function AppFinderInput({
  placeholder = "Search applications…",
  autoFocus = true,
  ...props
}: Omit<React.ComponentProps<typeof CommandInput>, "value" | "onValueChange">) {
  const { query, setQuery } = React.useContext(AppFinderSearchContext)
  return (
    <CommandInput
      data-slot="app-finder-input"
      placeholder={placeholder}
      autoFocus={autoFocus}
      value={query}
      onValueChange={setQuery}
      {...props}
    />
  )
}

type AppFinderListProps = Omit<
  React.ComponentProps<typeof CommandList>,
  "onSelect"
> & {
  /** Called with the `value` of the chosen app; the menu closes afterwards. */
  onSelect?: (value: string) => void
  /** Shown when the search matches nothing. */
  emptyMessage?: React.ReactNode
  /** Second line of the empty state. */
  emptyHint?: React.ReactNode
}

function AppFinderList({
  className,
  onSelect,
  emptyMessage = "No applications match",
  emptyHint = "Try the app's short code or its category",
  children,
  ...props
}: AppFinderListProps) {
  return (
    <AppFinderListContext.Provider value={onSelect}>
      <CommandList
        data-slot="app-finder-list"
        className={cn("max-h-[min(24rem,60vh)]", className)}
        {...props}
      >
        <CommandEmpty className="flex flex-col items-center gap-1 py-8">
          <SearchXIcon className="mb-1 size-5 text-muted-foreground" />
          <span className="font-medium">{emptyMessage}</span>
          {emptyHint ? (
            <span className="text-xs text-muted-foreground">{emptyHint}</span>
          ) : null}
        </CommandEmpty>
        {children}
      </CommandList>
    </AppFinderListContext.Provider>
  )
}

type AppFinderGroupProps = React.ComponentProps<typeof CommandGroup> & {
  /**
   * Leave the group out while a query is typed: use it on "Recent" or
   * "Favourites" so apps don't show twice in the results.
   */
  hideWhileSearching?: boolean
}

function AppFinderGroup({
  className,
  hideWhileSearching,
  ...props
}: AppFinderGroupProps) {
  const { query } = React.useContext(AppFinderSearchContext)
  if (hideWhileSearching && query.trim()) return null
  return (
    <CommandGroup
      data-slot="app-finder-group"
      className={cn(
        "not-first:border-t not-first:border-border **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:tracking-wide **:[[cmdk-group-heading]]:uppercase",
        className
      )}
      {...props}
    />
  )
}

type AppFinderItemProps = Omit<
  React.ComponentProps<typeof CommandItem>,
  "children" | "value" | "keywords"
> & {
  /** Identity of the app, passed to `onSelect`. */
  value: string
  /** Leading glyph or short code of the app. */
  icon?: React.ReactNode
  /** Colour of the tile; use the app's category tone. */
  tone?: AppFinderTone
  /** Display name; the filter matches it. */
  name: string
  description?: React.ReactNode
  /** Extra words the filter should match (short code, aliases). */
  keywords?: string[]
  /** Marks the app the shell is currently showing. */
  current?: boolean
}

/** Wraps the first occurrence of `query` in `text` so it stands out. */
function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim()
  if (!needle) return <>{text}</>
  const index = text.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase())
  if (index < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-xs bg-primary/20 font-semibold text-inherit">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  )
}

function AppFinderItem({
  className,
  icon,
  tone,
  name,
  description,
  keywords,
  current,
  value,
  onSelect,
  ...props
}: AppFinderItemProps) {
  const { query } = React.useContext(AppFinderSearchContext)
  const { close } = React.useContext(AppFinderRootContext)
  const onListSelect = React.useContext(AppFinderListContext)
  return (
    <CommandItem
      data-slot="app-finder-item"
      data-current={current ? "" : undefined}
      value={value}
      keywords={[name, ...(keywords ?? [])]}
      onSelect={() => {
        onSelect?.(value)
        onListSelect?.(value)
        close()
      }}
      className={cn(
        "items-center gap-2.5 rounded-md px-2 py-1.5 [&>svg:last-child]:hidden",
        className
      )}
      {...props}
    >
      {icon ? (
        <AppFinderIcon data-slot="app-finder-item-icon" tone={tone}>
          {typeof icon === "string" ? (
            <Highlight text={icon} query={query} />
          ) : (
            icon
          )}
        </AppFinderIcon>
      ) : null}
      <span className="grid min-w-0 flex-1 leading-tight">
        <span className="truncate font-medium">
          <Highlight text={name} query={query} />
        </span>
        {description ? (
          <span className="truncate text-xs text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      {current ? (
        <span
          data-slot="app-finder-item-current"
          className="ms-auto inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
        >
          Current
          <CheckIcon className="size-4 text-primary" aria-hidden />
        </span>
      ) : null}
    </CommandItem>
  )
}

export {
  AppFinder,
  AppFinderTrigger,
  AppFinderMenu,
  AppFinderInput,
  AppFinderList,
  AppFinderGroup,
  AppFinderItem,
  AppFinderIcon,
  appFinderIconVariants,
}
export type {
  AppFinderProps,
  AppFinderGroupProps,
  AppFinderItemProps,
  AppFinderListProps,
  AppFinderMenuProps,
  AppFinderTone,
  AppFinderTriggerProps,
}
