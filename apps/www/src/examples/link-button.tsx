import { ArrowRightIcon } from "lucide-react"

import { LinkButton } from "@tecton/react/tecton/link"

export default function LinkButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <LinkButton href="#">
        Open well <ArrowRightIcon data-icon="inline-end" />
      </LinkButton>
      <LinkButton href="#" variant="outline">
        Daily report
      </LinkButton>
      <LinkButton href="#" variant="ghost" size="sm">
        All wells
      </LinkButton>
      <LinkButton href="#" variant="secondary" disabled>
        Archived
      </LinkButton>
    </div>
  )
}
