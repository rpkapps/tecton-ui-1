"use client"

import * as React from "react"
import { TextQuoteIcon } from "lucide-react"

import {
  Composer,
  ComposerAttachments,
  ComposerField,
  ComposerHint,
  ComposerInput,
  ComposerStatusMessage,
  ComposerSubmit,
  ComposerSuggestion,
  ComposerSuggestions,
  ComposerToolbar,
  type ComposerAttachmentItem,
} from "@tecton/react/tecton/composer"

export default function ComposerContext() {
  const [items, setItems] = React.useState<ComposerAttachmentItem[]>([
    {
      id: "selection",
      label: "Selected text",
      description: "“Flaring at A-7 exceeded the permit for 14 minutes.”",
      icon: <TextQuoteIcon />,
    },
  ])
  const [sent, setSent] = React.useState<string | null>(null)

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Composer
        onSubmit={({ text }) => {
          setSent(text)
          setItems([])
        }}
      >
        <ComposerSuggestions>
          <ComposerSuggestion value="Explain this" />
          <ComposerSuggestion value="Who should know?" />
          <ComposerSuggestion value="Draft the incident note" submit />
        </ComposerSuggestions>
        <ComposerField>
          <ComposerAttachments
            items={items}
            onRemove={(id) =>
              setItems((current) => current.filter((item) => item.id !== id))
            }
          />
          <ComposerInput placeholder="Ask about the selection…" />
          <ComposerToolbar>
            <ComposerSubmit />
          </ComposerToolbar>
        </ComposerField>
        <ComposerHint isVisible={false} />
        <ComposerStatusMessage />
      </Composer>
      {sent !== null && (
        <p className="text-sm text-muted-foreground">Sent: {sent}</p>
      )}
    </div>
  )
}
