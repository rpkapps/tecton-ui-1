import { Badge } from "@tecton/react/components/badge";
import { Button } from "@tecton/react/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tecton/react/components/table";
import { WellIcon } from "@tecton/react/icons";

type WellStatus = "producing" | "shut-in" | "drilling";

type Well = {
  id: string;
  name: string;
  field: string;
  status: WellStatus;
  updatedAt: string;
};

const STATUS_LABEL: Record<WellStatus, string> = {
  producing: "Producing",
  "shut-in": "Shut in",
  drilling: "Drilling",
};

const STATUS_VARIANT: Record<WellStatus, "success" | "warning" | "info"> = {
  producing: "success",
  "shut-in": "warning",
  drilling: "info",
};

export function WellsTable({
  wells,
  onCreate,
}: {
  wells: Array<Well>;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onPress={onCreate}>
          <WellIcon data-icon="inline-start" />
          New well
        </Button>
      </div>

      {wells.length === 0 ? (
        <Empty className="border">
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
              <WellIcon data-icon="inline-start" />
              New well
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Table aria-label="Wells">
          <TableHeader>
            <TableHead id="name" isRowHeader>
              Name
            </TableHead>
            <TableHead id="field">Field</TableHead>
            <TableHead id="status">Status</TableHead>
            <TableHead id="updatedAt">Last updated</TableHead>
          </TableHeader>
          <TableBody>
            {wells.map((well) => (
              <TableRow key={well.id} id={well.id}>
                <TableCell className="font-medium">{well.name}</TableCell>
                <TableCell>{well.field}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[well.status]}>
                    {STATUS_LABEL[well.status]}
                  </Badge>
                </TableCell>
                <TableCell>{well.updatedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
