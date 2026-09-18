// Synced from shadcn/ui (apps/v4/examples/aria/avatar-basic.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@tecton/react/components/avatar"

export default function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage
        src="https://avatar.vercel.sh/casey"
        alt="@casey"
        className="grayscale"
      />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
