"use client"

import { toast } from "sonner"

import { Button } from "@tecton/react/components/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
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
  const handleDelete = async () => {
    try {
      await deleteWell(wellId)
      toast.success(`${wellName} deleted`)
    } catch {
      toast.error(`Couldn't delete ${wellName}`)
    }
  }

  return (
    <AlertDialogTrigger>
      <Button variant="destructive">Delete</Button>
      <AlertDialog>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {wellName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this well. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onPress={handleDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
