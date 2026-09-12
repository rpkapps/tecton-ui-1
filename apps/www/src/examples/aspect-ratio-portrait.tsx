// Synced from shadcn/ui (apps/v4/examples/aria/aspect-ratio-portrait.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import Image from "@/components/shims/image"

import { AspectRatio } from "@tecton/react/components/aspect-ratio"

export function AspectRatioPortrait() {
  return (
    <AspectRatio
      ratio={9 / 16}
      className="w-full max-w-[10rem] rounded-lg bg-muted"
    >
      <Image
        src="https://avatar.vercel.sh/shadcn1"
        alt="Photo"
        fill
        className="rounded-lg object-cover grayscale dark:brightness-20"
      />
    </AspectRatio>
  )
}
