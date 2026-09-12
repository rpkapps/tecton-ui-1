import { Divider } from "@tecton/react/tecton/divider"

export default function DividerEmphasis() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 text-xs text-muted-foreground">
      <div>
        <span>Subtle</span>
        <Divider emphasis="subtle" className="mt-1" />
      </div>
      <div>
        <span>Medium</span>
        <Divider emphasis="medium" className="mt-1" />
      </div>
      <div>
        <span>Strong</span>
        <Divider emphasis="strong" className="mt-1" />
      </div>
    </div>
  )
}
