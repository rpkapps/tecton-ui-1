// Synced from shadcn/ui (apps/v4/examples/aria/collapsible-basic.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { ChevronDownIcon } from "@tecton/react/icons"
import { Button } from "@tecton/react/components/button"
import { Card, CardContent } from "@tecton/react/components/card"
import {
  Collapsible,
  CollapsibleContent,
} from "@tecton/react/components/collapsible"

export function CollapsibleBasic() {
  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardContent>
        <Collapsible className="rounded-md data-open:bg-muted">
          <Button slot="trigger" variant="ghost" className="w-full">
            Product details
            <ChevronDownIcon className="ml-auto group-data-panel-open/button:rotate-180" />
          </Button>
          <CollapsibleContent>
            <div className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
              <div>
                This panel can be expanded or collapsed to reveal additional
                content.
              </div>
              <Button size="xs">Learn More</Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
