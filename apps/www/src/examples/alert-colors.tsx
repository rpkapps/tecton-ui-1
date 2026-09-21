// Synced from shadcn/ui (apps/v4/examples/aria/alert-colors.tsx) by scripts/sync-upstream-docs.mts — do not edit.
import { WarningIcon } from "@tecton/react/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertColors() {
  return (
    <Alert className="max-w-md border-yellow-160 bg-yellow-120 text-yellow-1000">
      <WarningIcon />
      <AlertTitle>Your subscription will expire in 3 days.</AlertTitle>
      <AlertDescription>
        Renew now to avoid service interruption or upgrade to a paid plan to
        continue using the service.
      </AlertDescription>
    </Alert>
  )
}
