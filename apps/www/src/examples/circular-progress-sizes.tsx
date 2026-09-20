import { CircularProgress } from "@tecton/react/tecton/circular-progress"

const sizes = ["xs", "sm", "md", "lg", "xl"] as const

export default function CircularProgressSizes() {
  return (
    <div className="flex items-end gap-6">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <CircularProgress
            size={size}
            value={64}
            aria-label={`Size ${size}`}
            showValue={size !== "xs"}
          />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  )
}
