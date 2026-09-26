// Synced from shadcn/ui (apps/v4/examples/base/empty-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { cn } from "cn"
import { ArrowUpRightIcon, FolderCodeIcon } from "lucide-react"

import { Button, buttonVariants } from "@tecton/react/components/button"
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
      <a
        href="#"
        className={cn(
          buttonVariants({ variant: "link", size: "sm" }),
          "text-muted-foreground"
        )}
      >
        Learn More <ArrowUpRightIcon />
      </a>
    </Empty>
  )
}
