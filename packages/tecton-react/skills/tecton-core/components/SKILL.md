---
name: components
description: >
  The 59 shadcn/ui component modules in @tecton/react on the React Aria base. Load
  before writing JSX with Button, Dialog, Select, Tabs, DropdownMenu, Popover,
  Tooltip, Accordion, Combobox, Checkbox, Switch, ToggleGroup, AlertDialog,
  Sheet or any other @tecton/react/components/* import. The base is React
  Aria, not Radix, so the API differs from stock shadcn in ways that fail at
  runtime or silently: onPress not onClick, isDisabled not disabled,
  isSelected not checked, id not value on collection items,
  defaultSelectedKey/defaultExpandedKeys not defaultValue, a single XTrigger
  that wraps both trigger and overlay instead of Trigger+Content+asChild, and
  no asChild prop at all. Also covers the Tecton-only variant axes on alert,
  badge, separator, input, textarea and select.
metadata:
  type: sub-skill
  library: '@tecton/react'
  library_version: '0.0.0'
  framework: react
requires:
  - 'tecton-core'
sources:
  - 'rpkapps/tecton-ui-1:docs/UPSTREAM.md'
  - 'rpkapps/tecton-ui-1:packages/tecton-react/src/components/button.tsx'
  - 'rpkapps/tecton-ui-1:packages/tecton-react/src/components/badge.tsx'
  - 'rpkapps/tecton-ui-1:packages/tecton-react/src/components/alert.tsx'
  - 'rpkapps/tecton-ui-1:apps/www/content/docs/components'
---

# Tecton UI — Components

Every component under `@tecton/react/components/` is the shadcn/ui component
built on **`react-aria-components`**. The markup, the slots and the
composition are shadcn's; the props are React Aria's.

An agent's prior for "shadcn/ui" is the Radix build. On this base that prior
is wrong for almost every interactive component, and the failure is usually
quiet: an extra prop is dropped, a handler never fires, a control never
disables.

## Setup

```tsx
import { Button } from "@tecton/react/components/button"
import { Badge } from "@tecton/react/components/badge"

export function Toolbar({ busy, onRun }: { busy: boolean; onRun: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button onPress={onRun} isDisabled={busy}>
        Run model
      </Button>
      <Badge variant="success">Ready</Badge>
    </div>
  )
}
```

One import per component, from its own module. There is no root export.

## The React Aria translation table

| Stock shadcn / Radix          | Tecton (React Aria)                             |
| ----------------------------- | ----------------------------------------------- |
| `onClick`                     | `onPress`                                       |
| `disabled`                    | `isDisabled`                                    |
| `checked` / `onCheckedChange` | `isSelected` / `onChange` (receives a `boolean`) |
| `required`                    | `isRequired`                                    |
| `open` / `onOpenChange`       | `isOpen` / `onOpenChange`, or let the trigger own it |
| `<SelectItem value="x">`      | `<SelectItem id="x">`                           |
| `<TabsTrigger value="x">`     | `<TabsTrigger id="x">`                          |
| `<Tabs defaultValue="x">`     | `<Tabs defaultSelectedKey="x">`                 |
| `<Accordion defaultValue>`    | `<Accordion defaultExpandedKeys={["x"]}>`       |
| `<Button asChild><a/></Button>` | `<LinkButton href="…">`                       |
| `Trigger` + `Content` + `Portal` | one `XTrigger` wrapping trigger **and** overlay |

`onChange` on a React Aria form control receives the **value**, not an event:
`onChange={(isSelected: boolean) => …}` for `Checkbox` and `Switch`,
`onChange={(value: string) => …}` for `RadioGroup`.

## Core patterns

### Overlays: the trigger wraps the overlay

`DropdownMenu`, `Popover`, `Tooltip`, `Dialog`, `AlertDialog`, `Sheet` and
`Select` all follow one shape. The `XTrigger` is a **wrapper**, not the button
itself — it takes the trigger element and the overlay as siblings, and wires
them together. There is no portal component to render and no `asChild`.

```tsx
import { Button } from "@tecton/react/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tecton/react/components/dropdown-menu"

;<DropdownMenuTrigger>
  <Button variant="outline">Actions</Button>
  <DropdownMenu placement="bottom start" className="w-40">
    <DropdownMenuLabel>Well</DropdownMenuLabel>
    <DropdownMenuItem onAction={rename}>Rename</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onAction={archive}>Archive</DropdownMenuItem>
  </DropdownMenu>
</DropdownMenuTrigger>
```

A `Dialog` works the same way, and the trigger may wrap a `<form>` so the
dialog's fields submit with it:

```tsx
<DialogTrigger>
  <Button variant="outline">Edit</Button>
  <Dialog className="sm:max-w-sm">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Change your display name.</DialogDescription>
    </DialogHeader>
    <FieldGroup>
      <Field>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue="Pedro" />
      </Field>
    </FieldGroup>
    <DialogFooter>
      <DialogClose variant="outline">Cancel</DialogClose>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </Dialog>
</DialogTrigger>
```

### Collections are keyed by `id`

`Select`, `Tabs`, `Accordion`, `ToggleGroup`, `Combobox`, `Menu` and
`ListBox` items take `id`, and the parent's selection props take those keys.

```tsx
<Select placeholder="Select a horizon" className="w-48">
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Horizons</SelectLabel>
      {horizons.map((h) => (
        <SelectItem key={h.id} id={h.id}>
          {h.name}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

`placeholder` sits on `Select`, not on `SelectValue`.

```tsx
<Tabs defaultSelectedKey="overview">
  <TabsList>
    <TabsTrigger id="overview">Overview</TabsTrigger>
    <TabsTrigger id="logs">Logs</TabsTrigger>
  </TabsList>
  <TabsContent id="overview">…</TabsContent>
  <TabsContent id="logs">…</TabsContent>
</Tabs>
```

`RadioGroup` is the exception that proves the rule: it is value-based, so the
group takes `defaultValue`/`value` and each `RadioGroupItem` takes `value`.

### The Tecton variant axes

Tecton adds axes that stock shadcn does not have. Reach for these before you
reach for `className`.

| Component                    | Tecton axis                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| `Alert`                      | `variant`: + `success` `warning` `info`; `appearance`: `default` `outline` `filled` |
| `Badge`                      | `variant`: + `success` `warning` `info`; `appearance`: `solid` `outline`; `size`: `default` `md` `lg` |
| `Separator`                  | `emphasis`: `subtle` `default` `strong`                        |
| `Input`, `Textarea`          | `variant`: `outline` `filled` `text`                           |
| `SelectTrigger`              | `variant`: `outline` `filled` `text`; `size`: `sm` `default`    |

Stock axes that still apply: `Button` `variant` (`default` `outline`
`secondary` `ghost` `destructive` `link`) and `size` (`default` `xs` `sm` `lg`
`icon` `icon-xs` `icon-sm` `icon-lg`).

```tsx
<Alert variant="warning" appearance="filled">
  <AlertTitle>Survey is stale</AlertTitle>
  <AlertDescription>Re-run the deviation survey.</AlertDescription>
</Alert>

<Badge variant="info" appearance="outline" size="lg">Draft</Badge>
<Separator emphasis="strong" />
<Input variant="filled" placeholder="Search wells" />
```

### Icons inside a control

Mark the position so the control can adjust its padding:

```tsx
<Button>
  <WellIcon data-icon="inline-start" /> New well
</Button>
```

See `tecton-core/icons`.

## References

- [Full component index and variant axes](references/component-index.md)

## Common Mistakes

### CRITICAL `onClick` and `disabled` on a Tecton control

Wrong:

```tsx
<Button onClick={() => save()} disabled={isSaving}>Save</Button>
```

Correct:

```tsx
<Button onPress={() => save()} isDisabled={isSaving}>Save</Button>
```

`Button` spreads its props onto a `react-aria-components` `Button`, which
handles neither. React passes `onClick` through to the DOM node so it *often*
appears to work with a mouse — but it never fires from keyboard activation or
touch, and `disabled` sets the native attribute without the `data-disabled`
state the variants style, so a "disabled" button still looks enabled and its
`onClick` still runs.

Source: `packages/tecton-react/src/components/button.tsx`

### CRITICAL `asChild` to render a component as a link

Wrong:

```tsx
<Button asChild>
  <a href="/wells">All wells</a>
</Button>
```

Correct:

```tsx
import { LinkButton } from "@tecton/react/components/button"

;<LinkButton href="/wells">All wells</LinkButton>
```

`asChild` is a Radix primitive. It does not exist anywhere in this library, so
React forwards it to the DOM as an unknown attribute: the anchor renders
unstyled inside a button, and you get a nested-interactive-element a11y
violation. `LinkButton` wraps React Aria's `Link` with the same variants.

Source: `packages/tecton-react/src/components/button.tsx`

### CRITICAL `value` instead of `id` on a collection item

Wrong:

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
</Tabs>
```

Correct:

```tsx
<Tabs defaultSelectedKey="overview">
  <TabsList>
    <TabsTrigger id="overview">Overview</TabsTrigger>
  </TabsList>
  <TabsContent id="overview">…</TabsContent>
</Tabs>
```

React Aria collections identify items by `key`/`id`. With `value`, no item
carries a key React Aria recognises, `defaultValue` matches nothing, and the
tab list renders with no selected tab and no panel — with no error.

Source: `apps/www/src/examples/tabs-demo.tsx`

### HIGH Trigger + Content + Portal instead of a wrapping trigger

Wrong:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Rename</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Correct:

```tsx
<DropdownMenuTrigger>
  <Button>Actions</Button>
  <DropdownMenu>
    <DropdownMenuItem onAction={rename}>Rename</DropdownMenuItem>
  </DropdownMenu>
</DropdownMenuTrigger>
```

`DropdownMenuContent` is not exported — the overlay component is
`DropdownMenu`, and `DropdownMenuTrigger` is the wrapper that pairs it with
its trigger. The same shape applies to `Popover`, `Tooltip`, `Dialog`,
`AlertDialog` and `Sheet`. Written the Radix way this fails to compile; an
agent that "fixes" it by inventing local wrappers ends up with an untethered
overlay that never positions.

Source: `apps/www/src/examples/dropdown-menu-demo.tsx`

### HIGH `onCheckedChange` and an event-shaped `onChange`

Wrong:

```tsx
<Checkbox checked={remember} onCheckedChange={setRemember} />
<Switch onChange={(e) => setEnabled(e.target.checked)} />
```

Correct:

```tsx
<Checkbox isSelected={remember} onChange={setRemember} />
<Switch onChange={(isSelected) => setEnabled(isSelected)} />
```

React Aria passes the new **value** to `onChange`, not a DOM event, and the
controlled prop is `isSelected`. Reading `e.target.checked` off a boolean
yields `undefined`, which turns the control uncontrolled and silently
sticks it off.

Source: `packages/tecton-react/src/blocks/login-01/components/login-form.tsx`

### MEDIUM Wrapping an icon-only button without a label

Wrong:

```tsx
<Button size="icon"><CloseIcon /></Button>
```

Correct:

```tsx
<Button size="icon" aria-label="Close panel">
  <CloseIcon />
</Button>
```

An icon-only control has no accessible name. React Aria does not invent one,
so the button is announced as "button" and is unreachable by name in tests
and by assistive technology. Tecton is an enterprise product with a11y
requirements; this is a real defect, not a lint nit.

Source: `docs/OVERFLOW-RULES.md § 4.4`

See also: `tecton-core/styling/SKILL.md` — reach for a variant before a
`className`, and never a stock Tailwind colour.
