import { SeismicBackground } from "@tecton/react/tecton/background"

const tones = [
  "neutral",
  "primary",
  "azure",
  "saffron",
  "lime",
  "blue",
] as const

export default function BackgroundTones() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
      {tones.map((tone) => (
        <div
          key={tone}
          className="relative isolate flex h-32 items-end overflow-hidden rounded-lg border bg-background p-3"
        >
          <SeismicBackground tone={tone} intensity="high" />
          <span className="text-sm font-medium">{tone}</span>
        </div>
      ))}
    </div>
  )
}
