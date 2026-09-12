// Synced from shadcn/ui (apps/v4/examples/aria/sheet-no-close-button.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { Button } from "@tecton/react/components/button"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@tecton/react/components/sheet"

export default function SheetNoCloseButton() {
  return (
    <SheetTrigger>
      <Button variant="outline">Open Sheet</Button>
      <Sheet showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>No Close Button</SheetTitle>
          <SheetDescription>
            This sheet doesn&apos;t have a close button in the top-right corner.
            Click outside to close.
          </SheetDescription>
        </SheetHeader>
      </Sheet>
    </SheetTrigger>
  )
}
