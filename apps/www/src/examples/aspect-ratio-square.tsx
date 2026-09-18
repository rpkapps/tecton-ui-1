// Synced from shadcn/ui (apps/v4/examples/aria/aspect-ratio-square.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import Image from "@/components/shims/image"

import { AspectRatio } from "@tecton/react/components/aspect-ratio"

export function AspectRatioSquare() {
  return (
    <AspectRatio
      ratio={1 / 1}
      className="w-full max-w-[12rem] rounded-lg bg-muted"
    >
      <Image
        src="https://avatar.vercel.sh/tecton1"
        alt="Photo"
        fill
        className="rounded-lg object-cover grayscale dark:brightness-20"
      />
    </AspectRatio>
  )
}
