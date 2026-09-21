// Synced from shadcn/ui (apps/v4/examples/aria/alert-basic.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { CheckCircleIcon } from "@tecton/react/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertBasic() {
  return (
    <Alert className="max-w-md">
      <CheckCircleIcon />
      <AlertTitle>Account updated successfully</AlertTitle>
      <AlertDescription>
        Your profile information has been saved. Changes will be reflected
        immediately.
      </AlertDescription>
    </Alert>
  )
}
