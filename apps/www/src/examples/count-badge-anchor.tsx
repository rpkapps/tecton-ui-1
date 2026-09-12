import { CountBadge } from "@tecton/react/tecton/count-badge"

const anchors = ["top-left", "top-right", "bottom-left", "bottom-right"] as const

export default function CountBadgeAnchor() {
  return (
    <div className="flex flex-wrap items-center gap-8">
      {anchors.map((anchor) => (
        <CountBadge key={anchor} anchor={anchor} count={3}>
          <span className="flex size-10 items-center justify-center rounded-md border bg-card text-[0.625rem] text-muted-foreground">
            {anchor.replace("-", " ")}
          </span>
        </CountBadge>
      ))}
    </div>
  )
}
