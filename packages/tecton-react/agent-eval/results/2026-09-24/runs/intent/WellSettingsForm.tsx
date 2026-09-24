import { useState, type FormEvent, type Key } from "react"

import { Button } from "@tecton/react/components/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Spinner } from "@tecton/react/components/spinner"
import { Switch } from "@tecton/react/components/switch"
import { Textarea } from "@tecton/react/components/textarea"

const OPERATORS = ["Equinor", "Aker BP", "Vår Energi", "ConocoPhillips"] as const

type WellSettingsValues = {
  name: string
  operator: string
  notify: boolean
  notes: string
}

export function WellSettingsForm({
  onSave,
}: {
  onSave: (values: WellSettingsValues) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [operator, setOperator] = useState<string | null>(null)
  const [notify, setNotify] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleOperatorChange = (key: Key | null) => {
    setOperator(key === null ? null : String(key))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        name,
        operator: operator ?? "",
        notify,
        notes,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="well-name">Well name</FieldLabel>
          <Input
            id="well-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="well-operator">Operator</FieldLabel>
          <Select
            placeholder="Select an operator"
            selectedKey={operator}
            onSelectionChange={handleOperatorChange}
          >
            <SelectTrigger id="well-operator">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((operatorName) => (
                <SelectItem key={operatorName} id={operatorName}>
                  {operatorName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="horizontal">
          <FieldLabel htmlFor="well-notify">Notify me on alarms</FieldLabel>
          <Switch
            id="well-notify"
            isSelected={notify}
            onChange={setNotify}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="well-notes">Notes</FieldLabel>
          <Textarea
            id="well-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
          />
        </Field>

        <Button type="submit" isDisabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Spinner data-icon="inline-start" />
              Saving
            </>
          ) : (
            "Save"
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}
