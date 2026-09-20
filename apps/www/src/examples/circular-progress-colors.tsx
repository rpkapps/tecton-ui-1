import { CircularProgress } from "@tecton/react/tecton/circular-progress"

const colors = [
  "primary",
  "foreground",
  "info",
  "success",
  "warning",
  "error",
] as const

export default function CircularProgressColors() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      {colors.map((color) => (
        <div key={color} className="flex flex-col items-center gap-2">
          <CircularProgress color={color} value={72} aria-label={color} />
          <span className="text-xs text-muted-foreground">{color}</span>
        </div>
      ))}
    </div>
  )
}
