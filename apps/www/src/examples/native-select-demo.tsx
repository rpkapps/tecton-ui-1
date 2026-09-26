// Synced from shadcn/ui (apps/v4/examples/base/native-select-demo.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import {
  NativeSelect,
  NativeSelectOption,
} from "@tecton/react/components/native-select"

export default function NativeSelectDemo() {
  return (
    <NativeSelect>
      <NativeSelectOption value="">Select status</NativeSelectOption>
      <NativeSelectOption value="todo">Todo</NativeSelectOption>
      <NativeSelectOption value="in-progress">In Progress</NativeSelectOption>
      <NativeSelectOption value="done">Done</NativeSelectOption>
      <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
    </NativeSelect>
  )
}
