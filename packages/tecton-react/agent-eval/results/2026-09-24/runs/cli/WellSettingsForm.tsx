import { useState } from "react";

import { Button } from "@tecton/react/components/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field";
import { Input } from "@tecton/react/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select";
import { Spinner } from "@tecton/react/components/spinner";
import { Switch } from "@tecton/react/components/switch";
import { Textarea } from "@tecton/react/components/textarea";

const OPERATORS = ["Equinor", "Aker BP", "Vår Energi", "ConocoPhillips"] as const;

export function WellSettingsForm({
  onSave,
}: {
  onSave: (values: {
    name: string;
    operator: string;
    notify: boolean;
    notes: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [operator, setOperator] = useState<string | null>(null);
  const [notify, setNotify] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ name, operator: operator ?? "", notify, notes });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FieldGroup className="w-full">
      <Field>
        <FieldLabel htmlFor="well-name">Well name</FieldLabel>
        <Input
          id="well-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSaving}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="well-operator">Operator</FieldLabel>
        <Select
          placeholder="Select operator"
          selectedKey={operator}
          onSelectionChange={(key) => setOperator(key === null ? null : String(key))}
          isDisabled={isSaving}
        >
          <SelectTrigger id="well-operator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((op) => (
              <SelectItem key={op} id={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="well-notify">Notify me on alarms</FieldLabel>
          <FieldDescription>
            Get notified when this well raises an alarm.
          </FieldDescription>
        </FieldContent>
        <Switch
          id="well-notify"
          isSelected={notify}
          onChange={setNotify}
          isDisabled={isSaving}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="well-notes">Notes</FieldLabel>
        <Textarea
          id="well-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSaving}
          rows={5}
        />
      </Field>

      <Button isDisabled={isSaving} onPress={handleSave} className="w-full">
        {isSaving ? (
          <>
            <Spinner data-icon="inline-start" />
            Saving…
          </>
        ) : (
          "Save"
        )}
      </Button>
    </FieldGroup>
  );
}
