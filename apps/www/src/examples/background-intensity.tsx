import { ReservoirCellsBackground } from "@tecton/react/tecton/background"

const intensities = ["low", "medium", "high"] as const

export default function BackgroundIntensity() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
      {intensities.map((intensity) => (
        <div
          key={intensity}
          className="relative isolate flex h-36 flex-col justify-end overflow-hidden rounded-lg border bg-background p-3"
        >
          <ReservoirCellsBackground tone="saffron" intensity={intensity} />
          <span className="text-sm font-medium">{intensity}</span>
          <span className="text-xs text-muted-foreground">
            Body copy over the pattern
          </span>
        </div>
      ))}
    </div>
  )
}
