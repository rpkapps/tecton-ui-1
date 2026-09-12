import { Chip, ChipGroup, ChipList } from "@tecton/react/tecton/chip"

const variants = [
  "secondary",
  "default",
  "info",
  "success",
  "warning",
  "destructive",
] as const

export default function ChipVariants() {
  return (
    <div className="flex flex-col items-center gap-3">
      <ChipGroup aria-label="Solid chips" selectionMode="multiple">
        <ChipList>
          {variants.map((variant) => (
            <Chip key={variant} id={variant} variant={variant}>
              {variant}
            </Chip>
          ))}
        </ChipList>
      </ChipGroup>
      <ChipGroup aria-label="Outline chips" selectionMode="multiple">
        <ChipList>
          {variants.map((variant) => (
            <Chip
              key={variant}
              id={variant}
              variant={variant}
              appearance="outline"
            >
              {variant}
            </Chip>
          ))}
        </ChipList>
      </ChipGroup>
    </div>
  )
}
