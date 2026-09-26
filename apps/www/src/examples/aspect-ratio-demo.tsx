// Synced from shadcn/ui (apps/v4/examples/base/aspect-ratio-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import Image from "@/components/shims/image"

import { AspectRatio } from "@tecton/react/components/aspect-ratio"

export default function AspectRatioDemo() {
  return (
    <AspectRatio ratio={16 / 9} className="w-full max-w-sm rounded-lg bg-muted">
      <Image
        src="https://avatar.vercel.sh/shadcn1"
        alt="Photo"
        fill
        className="rounded-lg object-cover grayscale dark:brightness-20"
      />
    </AspectRatio>
  )
}
