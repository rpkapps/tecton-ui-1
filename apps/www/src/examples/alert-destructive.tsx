// Synced from shadcn/ui (apps/v4/examples/aria/alert-destructive.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { ErrorIcon } from "@tecton/react/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertDestructive() {
  return (
    <Alert variant="destructive" className="max-w-md">
      <ErrorIcon />
      <AlertTitle>Payment failed</AlertTitle>
      <AlertDescription>
        Your payment could not be processed. Please check your payment method
        and try again.
      </AlertDescription>
    </Alert>
  )
}
