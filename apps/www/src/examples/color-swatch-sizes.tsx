import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

const sizes = ["xs", "sm", "md", "lg", "xl"] as const

export default function ColorSwatchSizes() {
  return (
    <div className="flex items-end gap-4">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <ColorSwatch size={size} color="#38bdf8" aria-label={`Size ${size}`} />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  )
}
