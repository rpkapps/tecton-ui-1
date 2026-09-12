import { Button } from "@tecton/react/components/button"
import { StatusAlert } from "@tecton/react/tecton/status-alert"

export default function StatusAlertWithAction() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <StatusAlert
        severity="warning"
        title="Unsaved changes"
        description="Three horizons have edits that are not yet committed."
        action={
          <Button variant="ghost" size="sm">
            Save
          </Button>
        }
      />
      <StatusAlert
        variant="outlined"
        severity="error"
        title="Connection lost"
        description="Reconnecting to the interpretation server."
        action={
          <Button variant="ghost" size="sm">
            Retry
          </Button>
        }
      />
    </div>
  )
}
