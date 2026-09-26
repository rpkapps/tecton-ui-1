"use client"

import * as React from "react"
import { CheckCheckIcon, NotebookPenIcon, SquarePenIcon } from "lucide-react"

import {
  Composer,
  ComposerCommands,
  ComposerField,
  ComposerHint,
  ComposerInput,
  ComposerStatusMessage,
  ComposerSubmit,
  ComposerToolbar,
  type ComposerCommandItem,
} from "@tecton/react/tecton/composer"

const COMMANDS: ComposerCommandItem[] = [
  {
    value: "new",
    command: "new",
    label: "Start a new conversation",
    group: "Chat",
    icon: <SquarePenIcon />,
  },
  {
    value: "acknowledge",
    command: "acknowledge",
    label: "Acknowledge alert A-7",
    group: "On this page",
    icon: <CheckCheckIcon />,
  },
  {
    value: "note",
    command: "note",
    label: "Add a note to well 34/10-A-12",
    group: "On this page",
    icon: <NotebookPenIcon />,
  },
]

export default function ComposerCommandsDemo() {
  const [log, setLog] = React.useState<string[]>([])

  return (
    <div className="flex w-full max-w-md flex-col gap-3 pt-40">
      <Composer
        onSubmit={({ text }) =>
          setLog((current) => [...current, `Sent: ${text}`])
        }
      >
        <ComposerField>
          <ComposerCommands
            items={COMMANDS}
            onCommand={(item, composer) => {
              if (item.value === "new") {
                setLog([])
                return
              }
              // Leave the rest for the user to finish, as a prompt.
              composer.setValue(`${item.label}: `)
            }}
          />
          <ComposerInput placeholder="Type / for commands…" />
          <ComposerToolbar>
            <ComposerSubmit />
          </ComposerToolbar>
        </ComposerField>
        <ComposerHint />
        <ComposerStatusMessage />
      </Composer>
      {log.map((line, index) => (
        <p key={index} className="text-sm text-muted-foreground">
          {line}
        </p>
      ))}
    </div>
  )
}
