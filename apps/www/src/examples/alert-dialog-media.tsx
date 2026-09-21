// Synced from shadcn/ui (apps/v4/examples/aria/alert-dialog-media.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { AddCircleIcon } from "@tecton/react/icons"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@tecton/react/components/alert-dialog"
import { Button } from "@tecton/react/components/button"

export function AlertDialogWithMedia() {
  return (
    <AlertDialogTrigger>
      <Button variant="outline">Share Project</Button>
      <AlertDialog>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AddCircleIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Share this project?</AlertDialogTitle>
          <AlertDialogDescription>
            Anyone with the link will be able to view and edit this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Share</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialog>
    </AlertDialogTrigger>
  )
}
