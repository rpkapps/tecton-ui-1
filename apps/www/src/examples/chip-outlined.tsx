import { Chip } from "@tecton/react/tecton/chip"

export default function ChipOutlined() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip variant="outlined" color="default">
        Default
      </Chip>
      <Chip variant="outlined" color="primary">
        Primary
      </Chip>
      <Chip variant="outlined" color="info">
        Info
      </Chip>
      <Chip variant="outlined" color="success">
        Success
      </Chip>
      <Chip variant="outlined" color="warning">
        Warning
      </Chip>
      <Chip variant="outlined" color="error">
        Error
      </Chip>
    </div>
  )
}
