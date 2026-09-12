import { StatusAlert } from "@tecton/react/tecton/status-alert"

export default function StatusAlertDemo() {
  return (
    <StatusAlert
      className="max-w-md"
      severity="info"
      title="Interpretation synced"
      description="Top Balder was updated from the shared project 2 minutes ago."
    />
  )
}
