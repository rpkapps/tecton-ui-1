import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

export default function ColorSwatchDemo() {
  return (
    <div className="flex items-center gap-4">
      <ColorSwatch color="#f59e0b" aria-label="Sandstone" />
      <ColorSwatch color="#64748b" aria-label="Shale" />
      <ColorSwatch color="#38bdf8" aria-label="Limestone" />
      <ColorSwatch color="#1e293b" aria-label="Coal" />
    </div>
  )
}
