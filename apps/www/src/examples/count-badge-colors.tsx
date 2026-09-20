import { CountBadge } from "@tecton/react/tecton/count-badge"

const colors = [
  "default",
  "secondary",
  "destructive",
  "success",
  "warning",
  "info",
] as const

export default function CountBadgeColors() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {colors.map((color, index) => (
        <CountBadge key={color} color={color} count={index + 1}>
          <span className="flex size-9 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            {color.slice(0, 3)}
          </span>
        </CountBadge>
      ))}
    </div>
  )
}
