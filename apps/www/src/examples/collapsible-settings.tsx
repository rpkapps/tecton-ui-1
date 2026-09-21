// Synced from shadcn/ui (apps/v4/examples/aria/collapsible-settings.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { CollapseContentIcon, ExpandContentIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@tecton/react/components/collapsible"
import { Field, FieldGroup, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

export function CollapsibleSettings() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Card className="mx-auto w-full max-w-xs" size="sm">
      <CardHeader>
        <CardTitle>Radius</CardTitle>
        <CardDescription>Set the corner radius of the element.</CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible
          isExpanded={isOpen}
          onExpandedChange={setIsOpen}
          className="flex items-start gap-2"
        >
          <FieldGroup className="grid w-full grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="radius-x" className="sr-only">
                Radius X
              </FieldLabel>
              <Input id="radius" placeholder="0" defaultValue={0} />
            </Field>
            <Field>
              <FieldLabel htmlFor="radius-y" className="sr-only">
                Radius Y
              </FieldLabel>
              <Input id="radius" placeholder="0" defaultValue={0} />
            </Field>
            <CollapsibleContent>
              <div className="col-span-full grid grid-cols-subgrid gap-2">
                <Field>
                  <FieldLabel htmlFor="radius-x" className="sr-only">
                    Radius X
                  </FieldLabel>
                  <Input id="radius" placeholder="0" defaultValue={0} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="radius-y" className="sr-only">
                    Radius Y
                  </FieldLabel>
                  <Input id="radius" placeholder="0" defaultValue={0} />
                </Field>
              </div>
            </CollapsibleContent>
          </FieldGroup>
          <Button slot="trigger" variant="outline" size="icon">
            {isOpen ? <CollapseContentIcon /> : <ExpandContentIcon />}
          </Button>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
