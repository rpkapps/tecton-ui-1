// Synced from shadcn/ui (apps/v4/examples/base/native-select-invalid.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  NativeSelect,
  NativeSelectOption,
} from "@tecton/react/components/native-select"

export function NativeSelectInvalid() {
  return (
    <NativeSelect aria-invalid="true">
      <NativeSelectOption value="">Error state</NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
    </NativeSelect>
  )
}
