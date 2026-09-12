import { InboxIcon } from "lucide-react"

import { Button } from "@tecton/react/components/button"
import { CountBadge } from "@tecton/react/tecton/count-badge"

function Inbox() {
  return (
    <Button variant="outline" size="icon" aria-label="Inbox">
      <InboxIcon />
    </Button>
  )
}

export default function CountBadgeMax() {
  return (
    <div className="flex items-center gap-6">
      <CountBadge count={0}>
        <Inbox />
      </CountBadge>
      <CountBadge count={0} showZero color="neutral">
        <Inbox />
      </CountBadge>
      <CountBadge count={1250} max={999} color="error">
        <Inbox />
      </CountBadge>
      <CountBadge content="New" color="success">
        <Inbox />
      </CountBadge>
    </div>
  )
}
