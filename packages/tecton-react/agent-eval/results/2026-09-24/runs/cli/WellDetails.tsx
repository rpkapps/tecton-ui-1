import { useState } from "react";
import { FileTextIcon } from "lucide-react";
import { Button } from "@tecton/react/components/button";
import {
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@tecton/react/components/sheet";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@tecton/react/components/tabs";
import {
  Item,
  ItemGroup,
  ItemSeparator,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from "@tecton/react/components/item";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@tecton/react/components/empty";

interface Well {
  name: string;
  operator: string;
  spudDate: string;
  depthM: number;
  logs: string[];
}

export function WellDetails({ well }: { well: Well }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <SheetTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline">Details</Button>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{well.name}</SheetTitle>
        </SheetHeader>
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(String(key))}
          className="flex-1 px-4"
        >
          <TabsList aria-label="Well details sections">
            <TabsTrigger id="overview">Overview</TabsTrigger>
            <TabsTrigger id="logs">Logs</TabsTrigger>
          </TabsList>
          <TabsContent id="overview">
            <ItemGroup>
              <Item variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle>Operator</ItemTitle>
                  <ItemDescription>{well.operator}</ItemDescription>
                </ItemContent>
              </Item>
              <ItemSeparator />
              <Item variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle>Spud date</ItemTitle>
                  <ItemDescription>{well.spudDate}</ItemDescription>
                </ItemContent>
              </Item>
              <ItemSeparator />
              <Item variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle>Depth</ItemTitle>
                  <ItemDescription>{well.depthM.toLocaleString()} m</ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </TabsContent>
          <TabsContent id="logs">
            {well.logs.length > 0 ? (
              <ItemGroup>
                {well.logs
                  .flatMap((log, index) => [
                    index > 0 ? <ItemSeparator key={`sep-${index}`} /> : null,
                    <Item key={log} variant="outline" size="sm">
                      <ItemContent>
                        <ItemTitle>{log}</ItemTitle>
                      </ItemContent>
                    </Item>,
                  ])
                  .filter(Boolean)}
              </ItemGroup>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileTextIcon />
                  </EmptyMedia>
                  <EmptyTitle>No logs</EmptyTitle>
                  <EmptyDescription>
                    No logs have been recorded for this well.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </SheetTrigger>
  );
}
