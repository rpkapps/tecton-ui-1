import {
  HexagonsBackground,
  backgroundIntensities,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

export default function BackgroundIntensity() {
  return (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
      {backgroundIntensities.map((intensity) => (
        <BackgroundPreview
          key={intensity}
          className="h-36"
          background={
            <HexagonsBackground tone="saffron" intensity={intensity} />
          }
        >
          <span className="text-sm font-medium">{intensity}</span>
          <span className="text-xs text-muted-foreground">
            Body copy over the pattern
          </span>
        </BackgroundPreview>
      ))}
    </div>
  )
}
