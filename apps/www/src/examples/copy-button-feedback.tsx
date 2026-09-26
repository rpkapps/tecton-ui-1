import * as React from "react"

import { CopyButton } from "@tecton/react/tecton/copy-button"

export default function CopyButtonFeedback() {
  const [last, setLast] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {["Top Balder", "Top Sele", "Base Cretaceous"].map((value) => (
          <CopyButton
            key={value}
            value={value}
            variant="ghost"
            aria-label={`Copy ${value}`}
            onCopied={setLast}
          />
        ))}
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {last ? `Copied "${last}"` : "Nothing copied yet"}
      </p>
    </div>
  )
}
