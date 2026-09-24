import { useState } from "react";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@tecton/react";

interface Well {
  name: string;
  operator: string;
  spudDate: string;
  depthM: number;
  logs: string[];
}

export function WellDetails({ well }: { well: Well }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  return (
    <>
      <Button onClick={() => setOpen(true)}>Details</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{well.name}</SheetTitle>
          </SheetHeader>

          <Tabs value={tab} onValueChange={setTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3 px-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operator</span>
                <span>{well.operator}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spud date</span>
                <span>{well.spudDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depth</span>
                <span>{well.depthM} m</span>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="px-4">
              {well.logs.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5">
                  {well.logs.map((log) => (
                    <li key={log}>{log}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No logs available.</p>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}
