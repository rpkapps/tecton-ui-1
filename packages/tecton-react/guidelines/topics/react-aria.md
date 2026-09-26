---
title: "React Aria props instead of Radix props"
description: >
  The Radix-to-React-Aria prop map for @tecton/react, because an agent's prior is
  shadcn on Radix and most of these substitutions render a dead control rather
  than an error. Covers onPress instead of onClick, isDisabled instead of
  disabled, isSelected and onChange instead of checked and onCheckedChange,
  value / defaultValue / onChange on Select and Combobox and selectedKey /
  defaultSelectedKey / onSelectionChange on Tabs instead of Radix's
  onValueChange, isOpen and onOpenChange with DialogTrigger
  wrapping both the Button and the Dialog (there is no DialogContent), the
  absence of asChild and what replaces it (LinkButton, buttonVariants, the render
  prop on Badge and ButtonGroupText, the element-valued render on DrawerTrigger), id
  instead of value on SelectItem, TabsTrigger and TabsContent, isInvalid on React
  Aria controls versus aria-invalid on Input and Textarea plus data-invalid on
  Field, and why Link and LinkButton exist. Load before writing any prop, handler
  or controlled state on a Tecton component.
sources:
  - "src/components/button.tsx"
  - "src/components/select.tsx"
  - "src/components/dialog.tsx"
  - "src/components/checkbox.tsx"
  - "src/components/switch.tsx"
  - "src/components/tabs.tsx"
  - "src/components/drawer.tsx"
  - "src/components/field.tsx"
  - "src/tecton/link.tsx"
  - "../../apps/www/content/docs/components/button.mdx"
  - "../../apps/www/content/docs/components/select.mdx"
  - "../../apps/www/content/docs/components/dialog.mdx"
  - "../../apps/www/content/docs/components/checkbox.mdx"
  - "../../apps/www/content/docs/components/tabs.mdx"
  - "../../apps/www/content/docs/components/drawer.mdx"
  - "../../apps/www/content/docs/forms/tanstack-form.mdx"
---

# React Aria props, not Radix props

This builds on `tecton rules`. Read it first for imports, the
palette and the variant rules.

The components under `@tecton/react/components/` are shadcn/ui built on
**react-aria-components**, not Radix. The markup and the variant names are the
ones you expect; the props are not. A Radix prop on a React Aria component
usually leaves a control that renders correctly and does nothing.

`Drawer` is the exception: it is built on Base UI (`@base-ui/react/drawer`) and
uses `open` / `onOpenChange` and an element-valued `render`.

## The map

| Radix | React Aria in `@tecton/react` | Components |
| --- | --- | --- |
| `onClick` | `onPress` | `Button`, `LinkButton`, `Link`, `Toggle`, `DialogClose`, `InputGroupButton`, `ChipRemove` |
| `disabled` | `isDisabled` | every React Aria control: `Button`, `Select`, `SelectItem`, `Checkbox`, `Switch`, `RadioGroup`, `Tabs`, `TabsTrigger`, `Slider`, `Link` |
| `checked` / `onCheckedChange` | `isSelected` / `onChange(isSelected: boolean)` | `Checkbox`, `Switch`, `Toggle` |
| `defaultChecked` | `defaultSelected` | `Checkbox`, `Switch`, `Toggle` |
| `value` / `onValueChange` | `value` / `onChange(key)` | `Select`, `Combobox` |
| `defaultValue` | `defaultValue` (unchanged) | `Select`, `Combobox` |
| `value` / `onValueChange` | `selectedKey` / `onSelectionChange(key)` | `Tabs` |
| `defaultValue` | `defaultSelectedKey` | `Tabs` |
| `value` on an item | `id` | `SelectItem`, `TabsTrigger`, `TabsContent` |
| `open` / `onOpenChange` | `isOpen` / `onOpenChange(isOpen: boolean)` on `DialogTrigger` | `Dialog`, `AlertDialog`, `Sheet`, `Popover`, `Tooltip` |
| `defaultOpen` | `defaultOpen` (unchanged) | `DialogTrigger` |
| `DialogContent` | `Dialog` itself is the content | `Dialog` |
| `asChild` | `LinkButton`, `buttonVariants`, or a `render` prop where the component offers one | `Button`, `Badge`, `ButtonGroupText`, `DrawerTrigger` |
| `aria-invalid` | `isInvalid` on React Aria controls; `aria-invalid` stays on `Input` and `Textarea` | `Select`, `Checkbox`, `RadioGroup` |

`Select` also accepts `selectedKey` / `defaultSelectedKey` /
`onSelectionChange`, but react-aria-components marks them `@deprecated` there
(and on `ComboBox`); write `value` / `defaultValue` / `onChange`. `Tabs` has no
`value` and keeps `selectedKey`. `RadioGroup` keeps `value` / `onChange` — it
is a value group, not a key collection. `Input` and `Textarea` render a real `<input>` / `<textarea>`, so
they keep `value`, `onChange(event)`, `disabled` and `aria-invalid`.

## Common Mistakes

### [CRITICAL] onClick instead of onPress

Wrong:

```tsx
<Button variant="outline" onClick={() => exportScene()}>
  Export
</Button>
```

Correct:

```tsx
<Button variant="outline" onPress={() => exportScene()}>
  Export
</Button>
```

React Aria keeps `onClick` as a documented alias of `onPress`, so this compiles
and fires on a mouse click while losing the press details React Aria provides
for touch, pen and keyboard interaction — which is why nothing surfaces until a
tablet user reports it.

Source: @react-types/shared/src/events.d.ts:135 ("Not recommended – use `onPress` instead"); packages/tecton-react/src/components/button.tsx:62

### [CRITICAL] disabled instead of isDisabled

Wrong:

```tsx
<Checkbox disabled />
<Select disabled value={horizon} onChange={setHorizon}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
</Select>
```

Correct:

```tsx
<Checkbox isDisabled />
<Select isDisabled value={horizon} onChange={setHorizon}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
</Select>
```

`Checkbox` renders a `<label>` and `Select` renders a `<div>`, so a `disabled`
attribute has no meaning on either element; React Aria writes `data-disabled`
from `isDisabled`, and that is the attribute the Tecton disabled classes key on, so
the control keeps its normal appearance and stays fully operable.

Source: packages/tecton-react/src/components/checkbox.tsx:16 (`data-[disabled]:cursor-not-allowed`); apps/www/content/docs/components/checkbox.mdx (Disabled)

### [CRITICAL] checked and onCheckedChange on Checkbox or Switch

Wrong:

```tsx
<Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
```

Correct:

```tsx
<Switch isSelected={twoFactor} onChange={setTwoFactor} />
```

React Aria's toggle state is `isSelected` / `defaultSelected` / `onChange(isSelected: boolean)`;
with `checked` and `onCheckedChange` the switch falls back to uncontrolled, so
it flips on click and keeps its own state while `twoFactor` never changes.

Source: react-stately useToggleState.d.ts:3 (`ToggleStateOptions`); apps/www/content/docs/forms/tanstack-form.mdx (Switch)

### [CRITICAL] onValueChange on Select, value on SelectItem

Wrong:

```tsx
<Select value={datum} onValueChange={setDatum}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="msl">Mean sea level</SelectItem>
  </SelectContent>
</Select>
```

Correct:

```tsx
<Select value={datum} onChange={setDatum}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem id="msl">Mean sea level</SelectItem>
  </SelectContent>
</Select>
```

`value` / `defaultValue` on `Select` are right — they are React Aria's own
names — but the handler is `onChange(key: Key | null)`, and an item is keyed by
`id`. `onValueChange` is not a prop, so it never fires, and `value` on a
`SelectItem` is its data object, so no item matches the selection. Do not fall
back to `selectedKey` / `onSelectionChange`: they are deprecated on `Select`.

Source: react-stately useSelectState.d.ts (`SelectProps`: `ValueBase`, `@deprecated selectedKey`); packages/tecton-react/src/components/select.tsx (`SelectProps<T, M>`)

### [CRITICAL] value and onValueChange on Tabs

Wrong:

```tsx
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
  </TabsList>
  <TabsContent value="account">…</TabsContent>
</Tabs>
```

Correct:

```tsx
<Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
  <TabsList>
    <TabsTrigger id="account">Account</TabsTrigger>
  </TabsList>
  <TabsContent id="account">Make changes to your account here.</TabsContent>
</Tabs>
```

React Aria collections key on `id`, and the selected tab is `selectedKey` /
`defaultSelectedKey` with `onSelectionChange(key)` — `Tabs` has no `value`;
`value` on a `Tab` is the item's data object for dynamic collections, not its
key, so the controlled key matches nothing and no panel is ever selected.

Source: react-aria-components Tabs.d.ts:55 (`id?: Key`), ListBox.d.ts:122; apps/www/content/docs/components/tabs.mdx (Usage)

### [HIGH] Select controlled with the empty string

Wrong:

```tsx
<Select
  placeholder="Select"
  value={field.state.value}
  onChange={(key) => field.handleChange(String(key))}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem id="en">English</SelectItem>
  </SelectContent>
</Select>
```

Correct:

```tsx
<Select
  placeholder="Select"
  value={field.state.value || null}
  onChange={(key) => field.handleChange(key ? String(key) : "")}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem id="en">English</SelectItem>
  </SelectContent>
</Select>
```

React Aria uses `null` for "nothing selected", so an empty-string `value`
is a key that no `SelectItem` owns: the trigger renders blank instead of the
placeholder, and `String(null)` writes the literal `"null"` back into the form
state.

Source: apps/www/content/docs/forms/tanstack-form.mdx (Select)

### [HIGH] DialogContent, and open on the Dialog

Wrong:

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete well</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

Correct:

```tsx
<DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
  <Button>Open</Button>
  <Dialog>
    <DialogHeader>
      <DialogTitle>Delete well</DialogTitle>
      <DialogDescription>This cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose>Cancel</DialogClose>
      <Button onPress={() => deleteWell()}>Delete</Button>
    </DialogFooter>
  </Dialog>
</DialogTrigger>
```

`DialogTrigger` wraps both children and owns the overlay state (`isOpen`,
`defaultOpen`, `onOpenChange`); the module exports no `DialogContent` at all,
because `Dialog` already renders the overlay, the modal and the close button.

Source: packages/tecton-react/src/components/dialog.tsx:172 (exports); apps/www/content/docs/components/dialog.mdx (Composition)

### [HIGH] asChild to compose a trigger or a link

Wrong:

```tsx
<Button asChild>
  <a href="/wells">Wells</a>
</Button>
<Badge asChild>
  <a href="/wells/balder">Balder</a>
</Badge>
<DrawerTrigger asChild>
  <Button variant="outline">Open</Button>
</DrawerTrigger>
```

Correct:

```tsx
<LinkButton href="/wells">Wells</LinkButton>
<Badge render={(props) => <a {...props} href="/wells/balder" />}>Balder</Badge>
<DrawerTrigger render={<Button variant="outline" />}>Open</DrawerTrigger>
```

No component in the package accepts `asChild`; React Aria's `Button` always
applies `role="button"`, which would override the link semantics of a nested
`<a>`, so navigation goes through `LinkButton` (or `buttonVariants({ variant, size })`
on a plain `<a>`) while `Badge` and `ButtonGroupText` take a **function** `render`
and the Base UI `DrawerTrigger` / `DrawerClose` take an **element** `render`.

Source: apps/www/content/docs/components/button.mdx:99 (As Link); packages/tecton-react/src/components/badge.tsx:52; apps/www/content/docs/components/drawer.mdx (Migrating from Vaul)

### [HIGH] aria-invalid on a React Aria control

Wrong:

```tsx
<Field>
  <FieldLabel htmlFor="language">Spoken language</FieldLabel>
  <Select id="language" aria-invalid={isInvalid}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
  </Select>
  <FieldError errors={field.state.meta.errors} />
</Field>
```

Correct:

```tsx
<Field data-invalid={isInvalid}>
  <FieldLabel htmlFor="language">Spoken language</FieldLabel>
  <Select id="language" isInvalid={isInvalid}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
  </Select>
  {isInvalid && <FieldError errors={field.state.meta.errors} />}
</Field>
```

React Aria puts the validation state on the control's own element as
`data-invalid`, which is what `Select`, `Checkbox` and `RadioGroup` style
against, and `Field` colours its label and description from `data-invalid` on
itself — a raw `aria-invalid` on the wrapper element reaches neither, so the
field looks valid while the error text sits underneath it. `Input` and
`Textarea` are real DOM elements and do keep `aria-invalid`.

Source: apps/www/content/docs/forms/tanstack-form.mdx (Displaying Errors); packages/tecton-react/src/components/field.tsx:55 (`data-[invalid=true]:text-destructive`)

### [MEDIUM] Button used for navigation

Wrong:

```tsx
<Button onPress={() => navigate("/wells")}>Wells</Button>
<p>
  See the <Button variant="link" onPress={() => navigate("/docs")}>docs</Button>.
</p>
```

Correct:

```tsx
<LinkButton href="/wells">Wells</LinkButton>
<p>
  See the <Link href="/docs">docs</Link>.
</p>
```

React Aria's `Button` always renders `role="button"`, so the destination is
invisible to assistive technology and the browser affordances of a link — middle
click, open in new tab, the status bar URL — are all gone; `LinkButton` is the
same `buttonVariants` on React Aria's `Link`, and `@tecton/react/tecton/link`
exports `Link` for inline text links with `variant` and `isExternal`.

Source: apps/www/content/docs/components/button.mdx:99; packages/tecton-react/src/components/button.tsx:72; packages/tecton-react/src/tecton/link.tsx
