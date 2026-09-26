// Synced from shadcn/ui (apps/v4/examples/base/button-render.tsx) by scripts/sync-upstream-docs.mts — do not edit.
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
