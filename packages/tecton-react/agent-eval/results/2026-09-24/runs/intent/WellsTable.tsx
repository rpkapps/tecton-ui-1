import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@tecton/react/components/table"
import { Badge } from "@tecton/react/components/badge"
import { Button } from "@tecton/react/components/button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@tecton/react/components/empty"
import { WellIcon } from "@tecton/react/icons"

type Well = {
  id: string
  name: string
  field: string
  status: "producing" | "shut-in" | "drilling"
  updatedAt: string
}

type WellsTableProps = {
  wells: Array<Well>
  onCreate: () => void
}

const STATUS_LABEL: Record<Well["status"], string> = {
  producing: "Producing",
  "shut-in": "Shut in",
  drilling: "Drilling",
}

const STATUS_VARIANT: Record<
  Well["status"],
  "success" | "warning" | "info"
> = {
  producing: "success",
  "shut-in": "warning",
  drilling: "info",
}

function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) {
    return updatedAt
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function WellsTable({ wells, onCreate }: WellsTableProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onPress={onCreate}>
          <WellIcon data-icon="inline-start" /> New well
        </Button>
      </div>
      <Table aria-label="Wells">
        <TableHeader>
          <TableHead id="name" isRowHeader>
            Name
          </TableHead>
          <TableHead id="field">Field</TableHead>
          <TableHead id="status">Status</TableHead>
          <TableHead id="updatedAt">Last updated</TableHead>
        </TableHeader>
        <TableBody
          renderEmptyState={() => (
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <WellIcon />
                </EmptyMedia>
                <EmptyTitle>No wells yet</EmptyTitle>
                <EmptyDescription>
                  Create your first well to start tracking it here.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onPress={onCreate}>
                  <WellIcon data-icon="inline-start" /> New well
                </Button>
              </EmptyContent>
            </Empty>
          )}
        >
          {wells.map((well) => (
            <TableRow key={well.id} id={well.id}>
              <TableCell className="font-medium">{well.name}</TableCell>
              <TableCell>{well.field}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[well.status]}>
                  {STATUS_LABEL[well.status]}
                </Badge>
              </TableCell>
              <TableCell>{formatUpdatedAt(well.updatedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
