// Synced from shadcn/ui (apps/v4/examples/aria/empty-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { FolderCodeIcon } from "lucide-react"
import { ArrowUpRightIcon } from "lucide-react"

import { Button, LinkButton } from "@tecton/react/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@tecton/react/components/empty"

export default function EmptyDemo() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderCodeIcon />
        </EmptyMedia>
        <EmptyTitle>No Projects Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any projects yet. Get started by creating
          your first project.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button>Create Project</Button>
        <Button variant="outline">Import Project</Button>
      </EmptyContent>
      <LinkButton
        href="#"
        variant="link"
        className="text-muted-foreground"
        size="sm"
      >
        Learn More <ArrowUpRightIcon />
      </LinkButton>
    </Empty>
  )
}
