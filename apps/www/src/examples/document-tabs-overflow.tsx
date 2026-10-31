"use client"

import * as React from "react"

import { WellIcon } from "@tecton/react/icons/well"
import {
  DocumentTabs,
  DocumentTabsAdd,
  DocumentTabsClose,
  DocumentTabsLabel,
  DocumentTabsList,
  DocumentTabsTrigger,
} from "@tecton/react/tecton/document-tabs"

const WELLS = Array.from({ length: 10 }, (_, index) => ({
  id: `well-${index + 1}`,
  name: `Well-${String(index + 1).padStart(2, "0")}`,
}))

export default function DocumentTabsOverflow() {
  const [wells, setWells] = React.useState(WELLS)
  const [active, setActive] = React.useState("well-8")

  return (
    <DocumentTabs
      value={active}
      onValueChange={setActive}
      onClose={(ids) =>
        setWells((all) => all.filter((well) => !ids.includes(well.id)))
      }
      className="w-full max-w-xl overflow-hidden rounded-md border"
    >
      <DocumentTabsList aria-label="Open wells">
        {wells.map((well) => (
          <DocumentTabsTrigger key={well.id} value={well.id}>
            <WellIcon />
            <DocumentTabsLabel>{well.name}</DocumentTabsLabel>
            <DocumentTabsClose />
          </DocumentTabsTrigger>
        ))}
        <DocumentTabsAdd
          onClick={() => {
            const id = `well-${Date.now()}`
            setWells((all) => [...all, { id, name: "Untitled well" }])
            setActive(id)
          }}
        />
      </DocumentTabsList>
    </DocumentTabs>
  )
}
