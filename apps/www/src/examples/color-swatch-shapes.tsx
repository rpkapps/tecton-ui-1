import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

export default function ColorSwatchShapes() {
  return (
    <div className="flex items-center gap-6">
      <ColorSwatch shape="square" size="lg" color="#f59e0b" label="Square" />
      <ColorSwatch shape="rounded" size="lg" color="#f59e0b" label="Rounded" />
      <ColorSwatch shape="circle" size="lg" color="#f59e0b" label="Circle" />
    </div>
  )
}
