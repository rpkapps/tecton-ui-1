import { Chip } from "@tecton/react/tecton/chip"

export default function ChipColors() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip color="default">Default</Chip>
      <Chip color="primary">Primary</Chip>
      <Chip color="info">Info</Chip>
      <Chip color="success">Success</Chip>
      <Chip color="warning">Warning</Chip>
      <Chip color="error">Error</Chip>
    </div>
  )
}
