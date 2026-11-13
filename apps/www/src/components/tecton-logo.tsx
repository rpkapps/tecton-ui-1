import { cn } from "cn"

export function TectonLogo({ className }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}favicon.svg`}
      alt=""
      aria-hidden
      draggable={false}
      className={cn("select-none", className)}
    />
  )
}
