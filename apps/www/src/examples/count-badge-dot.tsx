import { Avatar, AvatarFallback } from "@tecton/react/components/avatar"
import { CountBadge } from "@tecton/react/tecton/count-badge"

export default function CountBadgeDot() {
  return (
    <div className="flex items-center gap-6">
      <CountBadge variant="dot" color="success" anchor="bottom-right">
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </CountBadge>
      <CountBadge variant="dot" color="warning" anchor="bottom-right">
        <Avatar>
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </CountBadge>
      <CountBadge variant="dot" color="secondary" anchor="bottom-right">
        <Avatar>
          <AvatarFallback>MS</AvatarFallback>
        </Avatar>
      </CountBadge>
    </div>
  )
}
