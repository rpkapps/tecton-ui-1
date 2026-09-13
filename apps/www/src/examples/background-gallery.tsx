import {
  BackgroundEffect,
  backgroundEffects,
  type BackgroundEffectName,
} from "@tecton/react/tecton/background"

import { BackgroundPreview } from "@/components/background-preview"

const effects = Object.keys(backgroundEffects) as BackgroundEffectName[]

/** Every effect behind the same sample; switch the site theme for the other mode. */
export default function BackgroundGallery() {
  return (
    <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
      {effects.map((effect) => (
        <BackgroundPreview
          key={effect}
          className="h-40"
          background={<BackgroundEffect effect={effect} tone="azure" />}
        >
          <span className="text-sm font-medium">{effect}</span>
          <span className="text-xs text-muted-foreground">
            Sample text stays readable
          </span>
        </BackgroundPreview>
      ))}
    </div>
  )
}
