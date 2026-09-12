"use client"

import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { FileTextIcon, LayoutGridIcon, PaletteIcon, SearchIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@tecton/react/components/command"
import { Kbd } from "@tecton/react/components/kbd"

import { getSearchIndex, type SearchEntry } from "@/lib/search"

const staticEntries: SearchEntry[] = [
  { title: "Blocks", url: "/blocks", section: "Site" },
  { title: "Themes", url: "/themes", section: "Site" },
]

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [entries, setEntries] = React.useState<SearchEntry[] | null>(null)
  const navigate = useNavigate()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          e.target instanceof HTMLElement &&
          (e.target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName))
        ) {
          return
        }
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (open && !entries) {
      getSearchIndex()
        .then((index) => setEntries([...index, ...staticEntries]))
        .catch(() => setEntries(staticEntries))
    }
  }, [open, entries])

  const sections = React.useMemo(() => {
    const map = new Map<string, SearchEntry[]>()
    for (const entry of entries ?? []) {
      const list = map.get(entry.section) ?? []
      list.push(entry)
      map.set(entry.section, list)
    }
    return [...map.entries()]
  }, [entries])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 justify-start gap-2 px-0 text-muted-foreground md:w-56 md:px-2.5"
        onPress={() => setOpen(true)}
        aria-label="Search documentation"
      >
        <SearchIcon className="md:hidden" />
        <span className="hidden flex-1 text-left text-xs font-normal md:inline">
          Search documentation…
        </span>
        <Kbd className="hidden md:inline-flex">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search the documentation">
        <Command>
          <CommandInput placeholder="Search components, pages…" />
          <CommandList
            onAction={(key) => {
              setOpen(false)
              navigate({ to: String(key) })
            }}
            renderEmptyState={() => (
              <CommandEmpty>
                {entries ? "No results found." : "Loading…"}
              </CommandEmpty>
            )}
          >
            {sections.map(([section, items]) => (
              <CommandGroup key={section} heading={section}>
                {items.map((item) => (
                  <CommandItem key={item.url} id={item.url} textValue={item.title}>
                    {section === "Site" ? (
                      item.url === "/themes" ? (
                        <PaletteIcon />
                      ) : (
                        <LayoutGridIcon />
                      )
                    ) : (
                      <FileTextIcon />
                    )}
                    <span>{item.title}</span>
                    {item.description && (
                      <span className="ml-1 truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
