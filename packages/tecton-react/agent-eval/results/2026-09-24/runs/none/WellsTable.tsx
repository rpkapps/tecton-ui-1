import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react";
import { Well as WellIcon } from "@tecton/react/icons";

interface WellRow {
  id: string;
  name: string;
  field: string;
  status: "producing" | "shut-in" | "drilling";
  updatedAt: string;
}

const STATUS_VARIANT = {
  producing: "success",
  "shut-in": "warning",
  drilling: "info",
} as const;

const STATUS_LABEL: Record<WellRow["status"], string> = {
  producing: "Producing",
  "shut-in": "Shut in",
  drilling: "Drilling",
};

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EmptyWellsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <WellIcon aria-hidden className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">No wells yet</p>
        <p className="text-sm text-muted-foreground">
          Wells you create will show up here. Get started by adding your
          first well.
        </p>
      </div>
      <Button onPress={onCreate}>
        <WellIcon aria-hidden />
        New well
      </Button>
    </div>
  );
}

export function WellsTable({
  wells,
  onCreate,
}: {
  wells: WellRow[];
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button onPress={onCreate}>
          <WellIcon aria-hidden />
          New well
        </Button>
      </div>

      {wells.length === 0 ? (
        <EmptyWellsState onCreate={onCreate} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wells.map((well) => (
              <TableRow key={well.id}>
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
      )}
    </div>
  );
}
