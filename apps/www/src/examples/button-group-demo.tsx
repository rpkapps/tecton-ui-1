// Synced from shadcn/ui (apps/v4/examples/aria/button-group-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import * as React from "react"
import { ArchiveIcon, ArrowLeftIcon, CalendarAddOnIcon, DeleteIcon, FilterListIcon, LabelIcon, MarkEmailReadIcon, MoreHorizIcon, ScheduleIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { ButtonGroup } from "@tecton/react/components/button-group"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

export default function ButtonGroupDemo() {
  const [label, setLabel] = React.useState("personal")

  return (
    <ButtonGroup>
      <ButtonGroup className="hidden sm:flex">
        <Button variant="outline" size="icon" aria-label="Go Back">
          <ArrowLeftIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Archive</Button>
        <Button variant="outline">Report</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Snooze</Button>
        <DropdownMenuTrigger>
          <Button variant="outline" size="icon" aria-label="More Options">
            <MoreHorizIcon />
          </Button>
          <DropdownMenu placement="bottom end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <MarkEmailReadIcon />
                Mark as Read
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArchiveIcon />
                Archive
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <ScheduleIcon />
                Snooze
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CalendarAddOnIcon />
                Add to Calendar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FilterListIcon />
                Add to List
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <LabelIcon />
                  Label As...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  selectionMode="single"
                  selectedKeys={[label]}
                  onSelectionChange={(keys) => setLabel([...keys][0] as string)}
                >
                  <DropdownMenuItem id="personal">Personal</DropdownMenuItem>
                  <DropdownMenuItem id="work">Work</DropdownMenuItem>
                  <DropdownMenuItem id="other">Other</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <DeleteIcon />
                Trash
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenu>
        </DropdownMenuTrigger>
      </ButtonGroup>
    </ButtonGroup>
  )
}
