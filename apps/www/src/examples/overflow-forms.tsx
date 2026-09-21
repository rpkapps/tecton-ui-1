"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  DownloadIcon,
  FilterIcon,
  SearchIcon,
  VisibilityIcon,
} from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@tecton/react/components/dialog"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"
import { Input } from "@tecton/react/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Toggle } from "@tecton/react/components/toggle"
import {
  OverflowDivider,
  OverflowGroup,
  OverflowItem,
  OverflowLabel,
  Toolbar,
} from "@tecton/react/tecton/overflow"

const fields = ["All fields", "Gullfaks", "Statfjord", "Snorre"]
const formats = ["CSV", "Excel", "PDF"]

export default function OverflowForms() {
  const [query, setQuery] = React.useState("")
  const [field, setField] = React.useState("All fields")
  const [preview, setPreview] = React.useState(true)
  const [searchOpen, setSearchOpen] = React.useState(false)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="min-w-40 resize-x overflow-hidden rounded-md border p-2">
        <Toolbar aria-label="List tools">
          {/* Elastic: shrinks before anything collapses; its menu form opens a dialog with the same input. */}
          <OverflowItem
            id="search"
            priority={3}
            elastic={{ min: "8rem", max: "20rem" }}
            overflow={
              <DropdownMenuItem
                id="search"
                onAction={() => setSearchOpen(true)}
              >
                <SearchIcon />
                Search…
              </DropdownMenuItem>
            }
          >
            <Input
              aria-label="Search wells"
              placeholder="Search wells"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </OverflowItem>

          {/* A select overflows into a submenu with radio items. */}
          <OverflowItem
            id="field"
            priority={2}
            overflow={
              <DropdownMenuSub>
                <DropdownMenuSubTrigger id="field">
                  <FilterIcon />
                  Field
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuGroup
                    selectionMode="single"
                    selectedKeys={[field]}
                    onSelectionChange={(keys) =>
                      setField(String([...keys][0] ?? "All fields"))
                    }
                  >
                    {fields.map((item) => (
                      <DropdownMenuItem key={item} id={item}>
                        {item}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            }
          >
            <Select
              aria-label="Field"
              selectedKey={field}
              onSelectionChange={(key) => setField(String(key))}
              className="w-36"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map((item) => (
                  <SelectItem key={item} id={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OverflowItem>

          <OverflowDivider />

          {/* A toggle overflows into a checkbox item. */}
          <OverflowItem
            id="preview"
            priority={1}
            overflow={
              <DropdownMenuGroup
                selectionMode="multiple"
                selectedKeys={preview ? ["preview"] : []}
                onSelectionChange={(keys) =>
                  setPreview(keys === "all" || keys.has("preview"))
                }
              >
                <DropdownMenuItem id="preview">
                  <VisibilityIcon />
                  Preview pane
                </DropdownMenuItem>
              </DropdownMenuGroup>
            }
          >
            <Toggle
              variant="outline"
              aria-label="Preview pane"
              isSelected={preview}
              onChange={setPreview}
            >
              <VisibilityIcon />
            </Toggle>
          </OverflowItem>

          {/* A dropdown keeps its label and chevron; it overflows into a submenu. */}
          <OverflowGroup id="export" label="Export">
            <OverflowItem
              id="export"
              labelBehavior="keep"
              overflow={
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger id="export">
                    <DownloadIcon />
                    Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {formats.map((format) => (
                      <DropdownMenuItem key={format} id={format}>
                        {format}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              }
            >
              <DropdownMenuTrigger>
                <Button variant="outline">
                  <DownloadIcon data-icon="inline-start" />
                  <OverflowLabel>Export</OverflowLabel>
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuLabel>Format</DropdownMenuLabel>
                  {formats.map((format) => (
                    <DropdownMenuItem key={format} id={format}>
                      {format}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenu>
              </DropdownMenuTrigger>
            </OverflowItem>
          </OverflowGroup>
        </Toolbar>
      </div>
      <Dialog
        isOpen={searchOpen}
        onOpenChange={setSearchOpen}
        className="sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle>Search wells</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          aria-label="Search wells"
          placeholder="Search wells"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Dialog>
      <p className="text-xs text-muted-foreground">
        Drag the corner to resize. {field}
        {query ? ` · "${query}"` : ""}
        {preview ? " · preview on" : ""}
      </p>
    </div>
  )
}
