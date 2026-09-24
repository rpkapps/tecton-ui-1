import * as React from "react"
import { Button } from "@tecton/react/components/button"
import {
  Sheet,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@tecton/react/components/sheet"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@tecton/react/components/tabs"

interface Well {
  name: string
  operator: string
  spudDate: string
  depthM: number
  logs: string[]
}

export function WellDetails({ well }: { well: Well }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedTab, setSelectedTab] = React.useState<string>("overview")

  return (
    <SheetTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline">Details</Button>
      <Sheet side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{well.name}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(String(key))}
          >
            <TabsList aria-label="Well details">
              <TabsTrigger id="overview">Overview</TabsTrigger>
              <TabsTrigger id="logs">Logs</TabsTrigger>
            </TabsList>
            <TabsContent id="overview">
              <dl className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Operator</dt>
                  <dd>{well.operator}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Spud date</dt>
                  <dd>{well.spudDate}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Depth</dt>
                  <dd>{well.depthM} m</dd>
                </div>
              </dl>
            </TabsContent>
            <TabsContent id="logs">
              <ul className="flex flex-col gap-2">
                {well.logs.map((log) => (
                  <li key={log}>{log}</li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </Sheet>
    </SheetTrigger>
  )
}
