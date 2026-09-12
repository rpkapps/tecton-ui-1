import { PlusIcon, ShareIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderTitle,
} from "@tecton/react/tecton/page-header"

export default function PageHeaderActionsExample() {
  return (
    <PageHeader className="w-full max-w-2xl">
      <PageHeaderContent>
        <PageHeaderTitle>Wells</PageHeaderTitle>
        <PageHeaderDescription>23 wells across 4 fields.</PageHeaderDescription>
      </PageHeaderContent>
      <PageHeaderActions>
        <Button variant="outline">
          <ShareIcon data-icon="inline-start" />
          Share
        </Button>
        <Button>
          <PlusIcon data-icon="inline-start" />
          New well
        </Button>
      </PageHeaderActions>
    </PageHeader>
  )
}
