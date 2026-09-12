// Synced from shadcn/ui (apps/v4/examples/aria/button-render.tsx) by scripts/sync-upstream-docs.mts — do not edit.
"use client"

import { buttonVariants } from "@tecton/react/components/button"

export default function ButtonRender() {
  return (
    <a
      href="#"
      className={buttonVariants({ variant: "secondary", size: "sm" })}
    >
      Login
    </a>
  )
}
