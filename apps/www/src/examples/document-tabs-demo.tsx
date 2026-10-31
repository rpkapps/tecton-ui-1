"use client"

import * as React from "react"

import { Badge } from "@tecton/react/components/badge"
import { WellIcon } from "@tecton/react/icons/well"
import {
  DocumentTabs,
  DocumentTabsAdd,
  DocumentTabsClose,
  DocumentTabsContent,
  DocumentTabsLabel,
  DocumentTabsList,
  DocumentTabsTrigger,
} from "@tecton/react/tecton/document-tabs"

type Well = { id: string; name: string; field?: string }

const WELLS: Array<Well> = [
  { id: "ow-b-01", name: "OW-B: Well-01", field: "Orion Discovery" },
  { id: "ow-b-02", name: "OW-B: Well-02" },
  { id: "ow-c-07", name: "OW-C: Well-07" },
]

export default function DocumentTabsDemo() {
  const [wells, setWells] = React.useState(WELLS)
  const [active, setActive] = React.useState(WELLS[0].id)
  const created = React.useRef(0)

  function addWell() {
    created.current += 1
    const id = `new-${created.current}`
    const name = `Untitled well ${created.current}`
    setWells((all) => [...all, { id, name }])
    setActive(id)
  }

  return (
    <DocumentTabs
      value={active}
      onValueChange={setActive}
      onClose={(ids) =>
        setWells((all) => all.filter((well) => !ids.includes(well.id)))
      }
      onRename={(id, name) =>
        setWells((all) =>
          all.map((well) => (well.id === id ? { ...well, name } : well))
        )
      }
      onReorder={(ids) =>
        setWells((all) => ids.map((id) => all.find((well) => well.id === id)!))
      }
      className="w-full overflow-hidden rounded-md border"
    >
      <DocumentTabsList aria-label="Open wells">
        {wells.map((well) => (
          <DocumentTabsTrigger key={well.id} value={well.id}>
            <WellIcon />
            <DocumentTabsLabel>{well.name}</DocumentTabsLabel>
            {well.field ? <Badge variant="outline">{well.field}</Badge> : null}
            <DocumentTabsClose />
          </DocumentTabsTrigger>
        ))}
        <DocumentTabsAdd onClick={addWell} />
      </DocumentTabsList>
      {wells.map((well) => (
        <DocumentTabsContent
          key={well.id}
          value={well.id}
          className="p-6 text-muted-foreground"
        >
          {well.name}: double-click or press F2 to rename, Delete to close, drag
          or Ctrl+Shift+Arrow to move.
        </DocumentTabsContent>
      ))}
      {wells.length === 0 ? (
        <p className="p-6 text-muted-foreground">No open wells.</p>
      ) : null}
    </DocumentTabs>
  )
}
