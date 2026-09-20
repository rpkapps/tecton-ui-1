import { Meter } from "@tecton/react/tecton/meter"

const colors = ["default", "info", "success", "warning", "error"] as const

export default function MeterColors() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      {colors.map((color) => (
        <Meter key={color} label={color} color={color} value={60} />
      ))}
    </div>
  )
}
