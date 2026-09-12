// Synced from shadcn/ui (apps/v4/examples/aria/native-select-disabled.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  NativeSelect,
  NativeSelectOption,
} from "@tecton/react/components/native-select"

export function NativeSelectDisabled() {
  return (
    <NativeSelect disabled>
      <NativeSelectOption value="">Disabled</NativeSelectOption>
      <NativeSelectOption value="apple">Apple</NativeSelectOption>
      <NativeSelectOption value="banana">Banana</NativeSelectOption>
      <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
    </NativeSelect>
  )
}
