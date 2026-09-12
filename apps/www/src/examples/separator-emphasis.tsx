import { Separator } from "@tecton/react/components/separator"

const emphases = ["subtle", "default", "strong"] as const

export default function SeparatorEmphasis() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-4 text-sm">
        {emphases.map((emphasis) => (
          <div key={emphasis} className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              emphasis="{emphasis}"
            </span>
            <Separator emphasis={emphasis} />
          </div>
        ))}
      </div>
      <div className="flex h-8 items-center gap-4 text-sm">
        <span>Subtle</span>
        <Separator orientation="vertical" emphasis="subtle" />
        <span>Default</span>
        <Separator orientation="vertical" emphasis="default" />
        <span>Strong</span>
        <Separator orientation="vertical" emphasis="strong" />
      </div>
    </div>
  )
}
