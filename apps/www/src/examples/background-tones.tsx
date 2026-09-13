import { SeismicBackground } from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

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
        <BackgroundPreview
          key={tone}
          className="h-32"
          background={<SeismicBackground tone={tone} intensity="high" />}
        >
          <span className="text-sm font-medium">{tone}</span>
        </BackgroundPreview>
      ))}
    </div>
  )
}
