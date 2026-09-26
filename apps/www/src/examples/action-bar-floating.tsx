"use client"

import * as React from "react"
import { ArchiveIcon, FolderInputIcon, TagIcon, Trash2Icon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  ActionBar,
  ActionBarActions,
  ActionBarSelection,
} from "@tecton/react/tecton/action-bar"
import {
  OverflowDivider,
  OverflowItem,
  OverflowLabel,
} from "@tecton/react/tecton/overflow"

const documents = Array.from({ length: 14 }, (_, index) => ({
  id: `doc-${index + 1}`,
  name: `Daily drilling report ${String(index + 1).padStart(2, "0")}.pdf`,
}))

export default function ActionBarFloating() {
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(["doc-2", "doc-5"])
  )
  const toggle = (id: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  const clear = () => setSelected(new Set())

  return (
    // The bar is sticky inside the scroll container, so it stays within the panel.
    <div className="relative h-72 w-full max-w-xl overflow-y-auto rounded-md border">
      <ul className="divide-y">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex items-center gap-3 px-3 py-2 text-sm"
          >
            <Checkbox
              aria-label={`Select ${document.name}`}
              checked={selected.has(document.id)}
              onCheckedChange={(checked) => toggle(document.id, checked)}
            />
            {document.name}
          </li>
        ))}
      </ul>
      <ActionBar
        placement="floating"
        open={selected.size > 0}
        onOpenChange={(open) => {
          if (!open) clear()
        }}
        aria-label="Selected documents"
        className="mb-4"
      >
        <ActionBarSelection
          count={selected.size}
          label="documents"
          onClear={clear}
        />
        <ActionBarActions aria-label="Document actions">
          <OverflowItem
            value="move"
            label="Move to"
            icon={<FolderInputIcon />}
            priority={2}
          >
            <Button variant="outline" size="sm">
              <FolderInputIcon data-icon="inline-start" />
              <OverflowLabel>Move to</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem
            value="tag"
            label="Add tag"
            icon={<TagIcon />}
            priority={1}
          >
            <Button variant="outline" size="sm">
              <TagIcon data-icon="inline-start" />
              <OverflowLabel>Add tag</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowItem value="archive" label="Archive" icon={<ArchiveIcon />}>
            <Button variant="outline" size="sm">
              <ArchiveIcon data-icon="inline-start" />
              <OverflowLabel>Archive</OverflowLabel>
            </Button>
          </OverflowItem>
          <OverflowDivider />
          <OverflowItem
            value="delete"
            label="Delete"
            icon={<Trash2Icon />}
            variant="destructive"
            labelBehavior="keep"
          >
            <Button variant="destructive" size="sm">
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </OverflowItem>
        </ActionBarActions>
      </ActionBar>
    </div>
  )
}
