import { useId, useState, type FormEvent } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@tecton/react";

const OPERATORS = ["Equinor", "Aker BP", "Vår Energi", "ConocoPhillips"] as const;

export interface WellSettingsValues {
  name: string;
  operator: string;
  notify: boolean;
  notes: string;
}

export function WellSettingsForm({
  onSave,
}: {
  onSave: (values: WellSettingsValues) => Promise<void>;
}) {
  const nameId = useId();
  const operatorId = useId();
  const notifyId = useId();
  const notesId = useId();

  const [name, setName] = useState("");
  const [operator, setOperator] = useState<string>(OPERATORS[0]);
  const [notify, setNotify] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ name, operator, notify, notes });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Well name</Label>
        <Input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Njord A-12"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={operatorId}>Operator</Label>
        <Select value={operator} onValueChange={setOperator}>
          <SelectTrigger id={operatorId}>
            <SelectValue placeholder="Select an operator" />
          </SelectTrigger>
          <SelectContent>
            {OPERATORS.map((op) => (
              <SelectItem key={op} value={op}>
                {op}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={notifyId}>Notify me on alarms</Label>
        <Switch id={notifyId} checked={notify} onCheckedChange={setNotify} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea
          id={notesId}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Additional notes about this well"
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
