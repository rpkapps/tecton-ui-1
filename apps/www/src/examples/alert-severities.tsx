import {
  CheckCircleIcon,
  ErrorIcon,
  InfoIcon,
  WarningIcon,
} from "@tecton/react/icons"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

export default function AlertSeverities() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="success">
        <CheckCircleIcon />
        <AlertTitle>Three FDA alternatives ranked</AlertTitle>
        <AlertDescription>
          Alternative B has the lowest cost per barrel.
        </AlertDescription>
      </Alert>
      <Alert variant="warning">
        <WarningIcon />
        <AlertTitle>Unsaved changes</AlertTitle>
        <AlertDescription>
          Three horizons have edits that are not yet committed.
        </AlertDescription>
      </Alert>
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>Model out of date</AlertTitle>
        <AlertDescription>
          Horizon K70 changed after the last run.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <ErrorIcon />
        <AlertTitle>Simulation failed</AlertTitle>
        <AlertDescription>
          The grid has 12 cells with negative volume.
        </AlertDescription>
      </Alert>
    </div>
  )
}
