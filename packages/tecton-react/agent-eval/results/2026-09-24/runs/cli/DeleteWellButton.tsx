import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@tecton/react/components/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"

export function DeleteWellButton({
  wellId,
  wellName,
  deleteWell,
}: {
  wellId: string
  wellName: string
  deleteWell: (id: string) => Promise<void>
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      await deleteWell(wellId)
      toast.success(`${wellName} deleted`)
    } catch {
      toast.error(`Failed to delete ${wellName}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialogTrigger>
      <Button variant="destructive" isDisabled={isDeleting}>
        Delete
      </Button>
      <AlertDialog size="sm">
        <AlertDialogTitle>Delete {wellName}?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete this well. This action cannot be
          undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onPress={handleConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
