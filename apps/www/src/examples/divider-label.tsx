import { Divider } from "@tecton/react/tecton/divider"

export default function DividerLabel() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6 text-sm">
      <p>Alternative A — 3 wells, 2 templates</p>
      <Divider>or</Divider>
      <p>Alternative B — 4 wells, 1 template</p>
      <Divider emphasis="strong">Archived alternatives</Divider>
    </div>
  )
}
