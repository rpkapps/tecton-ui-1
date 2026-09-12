import * as React from "react"

import { CopyButton } from "@tecton/react/tecton/copy-button"

export default function CopyButtonFeedback() {
  const [last, setLast] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <CopyButton value="Top Balder" variant="ghost" onCopied={setLast} />
        <CopyButton value="Top Sele" variant="ghost" onCopied={setLast} />
        <CopyButton value="Base Cretaceous" variant="ghost" onCopied={setLast} />
      </div>
      <p className="text-xs text-muted-foreground">
        {last ? `Copied "${last}"` : "Nothing copied yet"}
      </p>
    </div>
  )
}
