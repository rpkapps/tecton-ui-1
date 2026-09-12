import { StatusAlert } from "@tecton/react/tecton/status-alert"

export default function StatusAlertSeverities() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <StatusAlert
        severity="error"
        title="Well log failed to load"
        description="The LAS file for 34/10-A-12 is missing a depth curve."
      />
      <StatusAlert
        severity="warning"
        title="Unsaved changes"
        description="Three horizons have edits that are not yet committed."
      />
      <StatusAlert
        severity="info"
        title="Processing"
        description="Seismic volume is being resampled in the background."
      />
      <StatusAlert
        severity="success"
        title="Export complete"
        description="Well design has been exported to the FDA workspace."
      />
    </div>
  )
}
