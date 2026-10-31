"use client"

import * as React from "react"
import { HomeIcon } from "lucide-react"

import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import { LogCurveIcon } from "@tecton/react/icons/log-curve"
import { OilRigOffshoreIcon } from "@tecton/react/icons/oil-rig-offshore"
import { TrajectoryIcon } from "@tecton/react/icons/trajectory"
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

type View = { id: string; name: string; kind: "overview" | "logs" | "path" }
type Well = { id: string; name: string; field: string; views: Array<View> }

const OVERVIEW: View = {
  id: "overview",
  name: "Well Overview",
  kind: "overview",
}

const WELLS: Array<Well> = [
  {
    id: "ow-b-01",
    name: "OW-B: Well-01",
    field: "Orion Discovery",
    views: [OVERVIEW, { id: "logs", name: "Log Viewer", kind: "logs" }],
  },
  {
    id: "ow-b-02",
    name: "OW-B: Well-02",
    field: "Orion Discovery",
    views: [OVERVIEW],
  },
]

const VIEW_ICONS = {
  overview: WellIcon,
  logs: LogCurveIcon,
  path: TrajectoryIcon,
}

function WellViews({
  well,
  onChange,
}: {
  well: Well
  onChange: (views: Array<View>) => void
}) {
  const [active, setActive] = React.useState(well.views[0].id)
  return (
    <DocumentTabs
      value={active}
      onValueChange={setActive}
      onClose={(ids) => onChange(well.views.filter((v) => !ids.includes(v.id)))}
      onRename={(id, name) =>
        onChange(well.views.map((v) => (v.id === id ? { ...v, name } : v)))
      }
      onReorder={(ids) =>
        onChange(ids.map((id) => well.views.find((v) => v.id === id)!))
      }
    >
      <DocumentTabsList size="sm" aria-label={`${well.name} views`}>
        {well.views.map((view) => {
          const Icon = VIEW_ICONS[view.kind]
          return (
            <DocumentTabsTrigger key={view.id} value={view.id}>
              <Icon />
              <DocumentTabsLabel>{view.name}</DocumentTabsLabel>
              {/* The overview is pinned: no close button. */}
              {view.kind === "overview" ? null : <DocumentTabsClose />}
            </DocumentTabsTrigger>
          )
        })}
        <DocumentTabsAdd
          aria-label="New view"
          onClick={() => {
            const id = `path-${Date.now()}`
            onChange([...well.views, { id, name: "Trajectory", kind: "path" }])
            setActive(id)
          }}
        />
      </DocumentTabsList>
      {well.views.map((view) => (
        <DocumentTabsContent
          key={view.id}
          value={view.id}
          className="grid h-40 place-items-center text-muted-foreground"
        >
          {well.name} · {view.name}
        </DocumentTabsContent>
      ))}
    </DocumentTabs>
  )
}

export default function DocumentTabsNested() {
  const [wells, setWells] = React.useState(WELLS)
  const [active, setActive] = React.useState(WELLS[0].id)

  const update = (id: string, change: Partial<Well>) =>
    setWells((all) => all.map((w) => (w.id === id ? { ...w, ...change } : w)))

  return (
    <DocumentTabs
      value={active}
      onValueChange={setActive}
      onClose={(ids) =>
        setWells((all) => all.filter((w) => !ids.includes(w.id)))
      }
      onRename={(id, name) => update(id, { name })}
      onReorder={(ids) =>
        setWells((all) => ids.map((id) => all.find((w) => w.id === id)!))
      }
      className="w-full overflow-hidden rounded-md border"
    >
      <div className="flex items-stretch border-b border-border-subtle bg-card">
        <div className="flex shrink-0 items-center gap-1 border-e border-border-subtle px-3">
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium">
            <OilRigOffshoreIcon className="size-4" />
            DWP
          </span>
          <Button variant="ghost" size="icon-sm" aria-label="Home">
            <HomeIcon />
          </Button>
        </div>
        <DocumentTabsList aria-label="Open wells" className="flex-1 border-b-0">
          {wells.map((well) => (
            <DocumentTabsTrigger key={well.id} value={well.id}>
              <WellIcon />
              <DocumentTabsLabel>{well.name}</DocumentTabsLabel>
              <Badge variant="outline">{well.field}</Badge>
              <DocumentTabsClose />
            </DocumentTabsTrigger>
          ))}
          <DocumentTabsAdd
            aria-label="Open well"
            onClick={() => {
              const id = `well-${Date.now()}`
              setWells((all) => [
                ...all,
                {
                  id,
                  name: "Untitled well",
                  field: "Orion Discovery",
                  views: [OVERVIEW],
                },
              ])
              setActive(id)
            }}
          />
        </DocumentTabsList>
      </div>
      {wells.map((well) => (
        <DocumentTabsContent key={well.id} value={well.id}>
          <WellViews
            well={well}
            onChange={(views) => update(well.id, { views })}
          />
        </DocumentTabsContent>
      ))}
    </DocumentTabs>
  )
}
