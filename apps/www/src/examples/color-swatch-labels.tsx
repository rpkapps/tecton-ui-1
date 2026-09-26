import { ColorSwatch } from "@tecton/react/tecton/color-swatch"

const facies = [
  { name: "Sandstone", color: "#f59e0b" },
  { name: "Shale", color: "#64748b" },
  { name: "Limestone", color: "#38bdf8" },
  { name: "Coal", color: "#1e293b" },
]

export default function ColorSwatchLabels() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      {facies.map((item) => (
        <ColorSwatch
          key={item.name}
          color={item.color}
          label={item.name}
          detail={item.color}
        />
      ))}
    </div>
  )
}
