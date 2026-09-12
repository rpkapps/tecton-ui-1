import { cn } from "cn"

export function TectonLogo({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      aria-hidden
      draggable={false}
      className={cn("select-none", className)}
    />
  )
}
