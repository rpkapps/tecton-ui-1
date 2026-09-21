import { cn } from "cn"
import { ProgressActivityIcon } from "@tecton/react/icons"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <ProgressActivityIcon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
