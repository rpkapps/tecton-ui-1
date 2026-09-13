import {
  BackgroundEffect,
  backgroundEffects,
  type BackgroundEffectName,
} from "@tecton/react/tecton/background"

const effects = Object.keys(backgroundEffects) as BackgroundEffectName[]

/** Every effect behind the same sample; switch the site theme for the other mode. */
export default function BackgroundGallery() {
  return (
    <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
      {effects.map((effect) => (
        <div
          key={effect}
          className="relative isolate flex h-40 flex-col justify-end overflow-hidden rounded-lg border bg-background p-3"
        >
          <BackgroundEffect effect={effect} tone="azure" />
          <span className="text-sm font-medium">{effect}</span>
          <span className="text-xs text-muted-foreground">
            Sample text stays readable
          </span>
        </div>
      ))}
    </div>
  )
}
