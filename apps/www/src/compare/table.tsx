import * as React from "react"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  MoreVerticalIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table"

import { Page } from "./matrix"

/**
 * Mirrors 100_components-table__overview.png: the medium-density user table
 * with a selection column, sortable headers, status cells, a row-action
 * column and the pagination footer ("Rows per page: 100 · Page 1 of 13").
 * The third row is selected like the capture.
 */
const users = [
  {
    id: "USR-2048",
    name: "Avery Stone",
    email: "avery.stone@landmark.dev",
    location: "Houston",
    status: "Active",
  },
  {
    id: "USR-2049",
    name: "Maya Chen",
    email: "maya.chen@landmark.dev",
    location: "Calgary",
    status: "Active",
  },
  {
    id: "USR-2050",
    name: "Noah Patel",
    email: "noah.patel@landmark.dev",
    location: "London",
    status: "Pending",
  },
  {
    id: "USR-2051",
    name: "Elena Ruiz",
    email: "elena.ruiz@landmark.dev",
    location: "Stavanger",
    status: "Active",
  },
  {
    id: "USR-2052",
    name: "Theo Brooks",
    email: "theo.brooks@landmark.dev",
    location: "Perth",
    status: "Disabled",
  },
]

function SortableHead({
  children,
  active,
  ...props
}: Omit<React.ComponentProps<typeof TableHead>, "children"> & {
  children?: React.ReactNode
  active?: boolean
}) {
  return (
    <TableHead {...props}>
      <span className="inline-flex items-center gap-1.5">
        {children}
        {active ? (
          <ArrowDownIcon className="size-3.5 text-muted-foreground" />
        ) : (
          <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />
        )}
      </span>
    </TableHead>
  )
}

export default function TableMatrix() {
  return (
    <Page>
      <div className="w-full max-w-4xl">
        <Table
          aria-label="Users"
          selectionMode="multiple"
          defaultSelectedKeys={["USR-2050"]}
        >
          <TableHeader>
            <TableHead className="w-10">
              <Checkbox slot="selection" aria-label="Select all" />
            </TableHead>
            <SortableHead isRowHeader active>
              User
            </SortableHead>
            <SortableHead>Email</SortableHead>
            <SortableHead>Location</SortableHead>
            <SortableHead>Account status</SortableHead>
            <SortableHead className="text-right">ID</SortableHead>
            <TableHead className="w-10 text-right">
              <Button variant="ghost" size="icon-xs" aria-label="Settings">
                <SettingsIcon />
              </Button>
            </TableHead>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow
                key={user.id}
                id={user.id}
                className={index % 2 === 1 ? "bg-muted/30" : undefined}
              >
                <TableCell>
                  <Checkbox
                    slot="selection"
                    aria-label={`Select ${user.name}`}
                  />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <UserIcon className="size-4 text-muted-foreground" />
                    {user.name}
                  </span>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.location}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2">
                    <CircleCheckIcon className="size-4 text-muted-foreground" />
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">{user.id}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Row actions"
                  >
                    <MoreVerticalIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div
          data-slot="table-pagination"
          className="flex items-center justify-end gap-6 border-t bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            Rows per page:
            <span className="inline-flex items-center gap-1 text-foreground">
              100
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            </span>
          </span>
          <span>Page 1 of 13</span>
          <span className="inline-flex items-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous page"
              isDisabled
            >
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Next page">
              <ChevronRightIcon />
            </Button>
          </span>
        </div>
      </div>
    </Page>
  )
}
