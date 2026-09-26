"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  DownloadIcon,
  EyeIcon,
  FilterIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@tecton/react/components/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
            value="search"
            priority={3}
            elastic={{ min: "8rem", max: "20rem" }}
            overflow={
              <DropdownMenuItem onClick={() => setSearchOpen(true)}>
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
            value="field"
            priority={2}
            overflow={
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FilterIcon />
                  Field
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={field}
                    onValueChange={setField}
                  >
                    {fields.map((item) => (
                      <DropdownMenuRadioItem key={item} value={item}>
                        {item}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            }
          >
            <Select
              value={field}
              onValueChange={(value) => {
                if (value) setField(value)
              }}
            >
              <SelectTrigger aria-label="Field" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </OverflowItem>

          <OverflowDivider />

          {/* A toggle overflows into a checkbox item. */}
          <OverflowItem
            value="preview"
            priority={1}
            overflow={
              <DropdownMenuCheckboxItem
                checked={preview}
                onCheckedChange={setPreview}
              >
                <EyeIcon />
                Preview pane
              </DropdownMenuCheckboxItem>
            }
          >
            <Toggle
              variant="outline"
              aria-label="Preview pane"
              pressed={preview}
              onPressedChange={setPreview}
            >
              <EyeIcon />
            </Toggle>
          </OverflowItem>

          {/* A dropdown keeps its label and chevron; it overflows into a submenu. */}
          <OverflowGroup value="export" label="Export">
            <OverflowItem
              value="export"
              labelBehavior="keep"
              overflow={
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <DownloadIcon />
                    Export
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {formats.map((format) => (
                      <DropdownMenuItem key={format}>{format}</DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              }
            >
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  <DownloadIcon data-icon="inline-start" />
                  <OverflowLabel>Export</OverflowLabel>
                  <ChevronDownIcon data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-auto">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Format</DropdownMenuLabel>
                    {formats.map((format) => (
                      <DropdownMenuItem key={format}>{format}</DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </OverflowItem>
          </OverflowGroup>
        </Toolbar>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-sm">
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
        </DialogContent>
      </Dialog>
      <p className="text-xs text-muted-foreground">
        Drag the corner to resize. {field}
        {query ? ` · "${query}"` : ""}
        {preview ? " · preview on" : ""}
      </p>
    </div>
  )
}
