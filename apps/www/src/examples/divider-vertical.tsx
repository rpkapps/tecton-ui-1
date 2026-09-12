import { Divider } from "@tecton/react/tecton/divider"

export default function DividerVertical() {
  return (
    <div className="flex h-6 items-center gap-3 text-sm">
      <span>Wells</span>
      <Divider orientation="vertical" emphasis="subtle" />
      <span>Horizons</span>
      <Divider orientation="vertical" />
      <span>Faults</span>
      <Divider orientation="vertical" emphasis="strong" />
      <span>Grids</span>
    </div>
  )
}
