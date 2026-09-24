"use client"

import * as React from "react"
import { toast } from "@tecton/react"
import { Button } from "@tecton/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react"

export function DeleteWellButton({
  wellId,
  wellName,
  deleteWell,
}: {
  wellId: string
  wellName: string
  deleteWell: (id: string) => Promise<void>
}) {
  const [open, setOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteWell(wellId)
      setOpen(false)
      toast.success(`"${wellName}" was deleted.`)
    } catch (error) {
      toast.error(
        `Couldn't delete "${wellName}". ${
          error instanceof Error ? error.message : "Please try again."
        }`,
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete well?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &quot;{wellName}&quot;. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel isDisabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            isDisabled={isDeleting}
            onPress={handleConfirmDelete}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
