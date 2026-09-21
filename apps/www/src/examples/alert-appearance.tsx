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

const severities = [
  { variant: "success", icon: CheckCircleIcon, title: "Model saved" },
  { variant: "warning", icon: WarningIcon, title: "Unsaved changes" },
  { variant: "info", icon: InfoIcon, title: "Model out of date" },
  { variant: "destructive", icon: ErrorIcon, title: "Simulation failed" },
] as const

const appearances = ["outline", "filled"] as const

export default function AlertAppearance() {
  return (
    <div className="grid w-full gap-3 md:grid-cols-2">
      {appearances.map((appearance) => (
        <div key={appearance} className="flex flex-col gap-3">
          {severities.map(({ variant, icon: Icon, title }) => (
            <Alert key={variant} variant={variant} appearance={appearance}>
              <Icon />
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>appearance="{appearance}"</AlertDescription>
            </Alert>
          ))}
        </div>
      ))}
    </div>
  )
}
