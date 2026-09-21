import { MailIcon, NotificationsIcon } from "@tecton/react/icons"

import { Button } from "@tecton/react/components/button"
import { CountBadge } from "@tecton/react/tecton/count-badge"

export default function CountBadgeDemo() {
  return (
    <div className="flex items-center gap-6">
      <CountBadge count={4}>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <NotificationsIcon />
        </Button>
      </CountBadge>
      <CountBadge count={128} color="destructive">
        <Button variant="outline" size="icon" aria-label="Messages">
          <MailIcon />
        </Button>
      </CountBadge>
    </div>
  )
}
