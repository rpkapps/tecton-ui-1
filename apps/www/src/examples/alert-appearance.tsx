import { TriangleAlertIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"

const appearances = ["default", "outline", "filled"] as const

export default function AlertAppearance() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {appearances.map((appearance) => (
        <Alert key={appearance} variant="warning" appearance={appearance}>
          <TriangleAlertIcon />
          <AlertTitle>Unsaved changes</AlertTitle>
          <AlertDescription>
            appearance="{appearance}" — three horizons have edits that are not
            yet committed.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
