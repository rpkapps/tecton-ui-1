// Synced from shadcn/ui (apps/v4/examples/aria/avatar-badge.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@tecton/react/components/avatar"

export function AvatarWithBadge() {
  return (
    <Avatar>
      <AvatarImage src="https://avatar.vercel.sh/casey" alt="@casey" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge className="bg-green-560" />
    </Avatar>
  )
}
