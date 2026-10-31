"use client"

import * as React from "react"
import { CopyIcon, PinIcon } from "lucide-react"

import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@tecton/react/components/context-menu"
import { WellIcon } from "@tecton/react/icons/well"
import {
  DocumentTabs,
  DocumentTabsClose,
  DocumentTabsLabel,
  DocumentTabsList,
  DocumentTabsMenu,
  DocumentTabsMenuClose,
  DocumentTabsMenuCloseOthers,
  DocumentTabsMenuRename,
  DocumentTabsTrigger,
} from "@tecton/react/tecton/document-tabs"

type Well = { id: string; name: string; pinned?: boolean }

const WELLS: Array<Well> = [
  { id: "ow-b-01", name: "OW-B: Well-01" },
  { id: "ow-b-02", name: "OW-B: Well-02" },
]

export default function DocumentTabsMenuExample() {
  const [wells, setWells] = React.useState(WELLS)
  const [active, setActive] = React.useState(WELLS[0].id)

  function duplicate(id: string) {
    const well = wells.find((w) => w.id === id)!
    const copy = { id: `${id}-${Date.now()}`, name: `${well.name} (copy)` }
    setWells((all) => {
      const at = all.findIndex((w) => w.id === id)
      return [...all.slice(0, at + 1), copy, ...all.slice(at + 1)]
    })
    setActive(copy.id)
  }

  function togglePin(id: string) {
    setWells((all) =>
      all.map((w) => (w.id === id ? { ...w, pinned: !w.pinned } : w))
    )
  }

  return (
    <DocumentTabs
      value={active}
      onValueChange={setActive}
      onClose={(ids) =>
        setWells((all) => all.filter((w) => !ids.includes(w.id)))
      }
      onRename={(id, name) =>
        setWells((all) => all.map((w) => (w.id === id ? { ...w, name } : w)))
      }
      className="w-full overflow-hidden rounded-md border"
    >
      <DocumentTabsList aria-label="Open wells">
        {wells.map((well) => (
          <DocumentTabsTrigger key={well.id} value={well.id}>
            {well.pinned ? <PinIcon /> : <WellIcon />}
            <DocumentTabsLabel>{well.name}</DocumentTabsLabel>
            {/* A pinned tab has no close button, so it cannot close. */}
            {well.pinned ? null : <DocumentTabsClose />}
          </DocumentTabsTrigger>
        ))}
        <DocumentTabsMenu className="min-w-56">
          {(id) => (
            <>
              <DocumentTabsMenuRename />
              <ContextMenuItem onClick={() => duplicate(id)}>
                <CopyIcon />
                Duplicate
              </ContextMenuItem>
              <ContextMenuItem onClick={() => togglePin(id)}>
                <PinIcon />
                {wells.find((w) => w.id === id)?.pinned ? "Unpin" : "Pin"}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <DocumentTabsMenuClose variant="destructive" />
              <DocumentTabsMenuCloseOthers />
            </>
          )}
        </DocumentTabsMenu>
      </DocumentTabsList>
    </DocumentTabs>
  )
}
