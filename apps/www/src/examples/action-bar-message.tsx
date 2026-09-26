"use client"

import * as React from "react"

import { Button } from "@tecton/react/components/button"
import { Field, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  ActionBar,
  ActionBarActions,
  ActionBarMessage,
} from "@tecton/react/tecton/action-bar"
import { OverflowItem } from "@tecton/react/tecton/overflow"

const initial = { name: "34/10-A-12", operator: "Equinor" }

export default function ActionBarMessageExample() {
  const [saved, setSaved] = React.useState(initial)
  const [draft, setDraft] = React.useState(initial)
  const dirty = draft.name !== saved.name || draft.operator !== saved.operator
  const discard = () => setDraft(saved)
  const save = () => setSaved(draft)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="action-bar-message-name">Well</FieldLabel>
        <Input
          id="action-bar-message-name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="action-bar-message-operator">Operator</FieldLabel>
        <Input
          id="action-bar-message-operator"
          value={draft.operator}
          onChange={(event) =>
            setDraft({ ...draft, operator: event.target.value })
          }
        />
      </Field>
      <ActionBar
        placement="toolbar"
        isOpen={dirty}
        onDismiss={discard}
        aria-label="Unsaved changes"
      >
        <ActionBarMessage>You have unsaved changes</ActionBarMessage>
        <ActionBarActions aria-label="Save or discard">
          <OverflowItem
            id="discard"
            label="Discard"
            onAction={discard}
            labelBehavior="keep"
          >
            <Button variant="ghost" size="sm">
              Discard
            </Button>
          </OverflowItem>
          {/* Unwrapped: the primary action is fixed. */}
          <Button size="sm" onPress={save}>
            Save
          </Button>
        </ActionBarActions>
      </ActionBar>
    </div>
  )
}
