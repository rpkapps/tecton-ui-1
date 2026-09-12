import { Badge } from "@tecton/react/components/badge"

const variants = ["success", "warning", "info", "destructive"] as const

export default function BadgeStatus() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {variants.map((variant) => (
          <Badge key={variant} variant={variant}>
            {variant}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {variants.map((variant) => (
          <Badge key={variant} variant={variant} appearance="outline">
            {variant}
          </Badge>
        ))}
      </div>
    </div>
  )
}
