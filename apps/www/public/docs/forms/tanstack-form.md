# TanStack Form

Build forms in React using TanStack Form, Zod and the React Aria components.

Source: /docs/forms/tanstack-form.md  
React Aria docs: https://tanstack.com/form

This guide explores how to build forms using TanStack Form. You'll learn to create forms with the `<Field />` component, implement schema validation with Zod, handle errors, and ensure accessibility.

It follows the [upstream shadcn/ui guide](https://ui.shadcn.com/docs/forms/tanstack-form); the examples are rewritten for the React Aria components, whose controls use `isSelected` / `onChange`, `selectedKey` / `onSelectionChange` and `isInvalid` instead of the Radix `checked` / `onCheckedChange`, `value` / `onValueChange` and `aria-invalid` props.

## Demo

We'll start by building the following form. It has a simple text input and a textarea. On submit, we'll validate the form data and display any errors.

> **Note:** For the purpose of this demo, we have intentionally disabled browser
> validation to show how schema validation and form errors work in TanStack
> Form. It is recommended to add basic browser validation in your production
> code.

**Example — `form-tanstack-demo`**

```tsx
"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@tecton/react/components/input-group"

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(32, "Bug title must be at most 32 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(100, "Description must be at most 100 characters."),
})

export function showSubmitted(value: unknown) {
  toast("You submitted the following values:", {
    description: (
      <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-muted p-4 text-muted-foreground">
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    ),
    position: "bottom-right",
    classNames: { content: "flex flex-col gap-2" },
  })
}

export default function BugReportForm() {
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Bug Report</CardTitle>
        <CardDescription>Help us improve by reporting bugs you encounter.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="bug-report-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="title"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Bug Title</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Login button not working on mobile"
                      autoComplete="off"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="description"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="I'm having an issue with the login button on mobile."
                        rows={6}
                        className="min-h-24 resize-none"
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="block-end">
                        <InputGroupText className="tabular-nums">
                          {field.state.value.length}/100 characters
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Include steps to reproduce, expected behavior, and what actually happened.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="bug-report-form">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

## Installation

```bash
npm install @tanstack/react-form zod
```

## Approach

This form leverages TanStack Form for powerful, headless form handling. We'll build our form using the `<Field />` component, which gives you **complete flexibility over the markup and styling**.

- Uses TanStack Form's `useForm` hook for form state management.
- `form.Field` component with render prop pattern for controlled inputs.
- `<Field />` components for building accessible forms.
- Client-side validation using Zod.
- Real-time validation feedback.

## Anatomy

Here's a basic example of a form using TanStack Form with the `<Field />` component.

```tsx showLineNumbers {15-31}
<form
  onSubmit={(e) => {
    e.preventDefault()
    form.handleSubmit()
  }}
>
  <FieldGroup>
    <form.Field
      name="title"
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>Bug Title</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
              placeholder="Login button not working on mobile"
              autoComplete="off"
            />
            <FieldDescription>
              Provide a concise title for your bug report.
            </FieldDescription>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  </FieldGroup>
  <Button type="submit">Submit</Button>
</form>
```

## Form

### Create a schema

We'll start by defining the shape of our form using a Zod schema.

```tsx showLineNumbers title="form.tsx"
import * as z from "zod"

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(32, "Bug title must be at most 32 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(100, "Description must be at most 100 characters."),
})
```

### Set up the form

Use the `useForm` hook from TanStack Form to create your form instance with Zod validation.

```tsx showLineNumbers title="form.tsx" {10-21}
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"

const formSchema = z.object({
  // ...
})

export function BugReportForm() {
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.success("Form submitted successfully")
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      {/* ... */}
    </form>
  )
}
```

We are using `onSubmit` to validate the form data here. TanStack Form supports other validation modes, which you can read about in the [documentation](https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation).

### Build the form

We can now build the form using the `form.Field` component from TanStack Form and the `<Field />` component.

**Source — `form.tsx`**

```tsx
"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@tecton/react/components/input-group"

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(32, "Bug title must be at most 32 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(100, "Description must be at most 100 characters."),
})

export function showSubmitted(value: unknown) {
  toast("You submitted the following values:", {
    description: (
      <pre className="mt-2 w-[320px] overflow-x-auto rounded-md bg-muted p-4 text-muted-foreground">
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    ),
    position: "bottom-right",
    classNames: { content: "flex flex-col gap-2" },
  })
}

export default function BugReportForm() {
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Bug Report</CardTitle>
        <CardDescription>Help us improve by reporting bugs you encounter.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="bug-report-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="title"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Bug Title</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Login button not working on mobile"
                      autoComplete="off"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <form.Field
              name="description"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="I'm having an issue with the login button on mobile."
                        rows={6}
                        className="min-h-24 resize-none"
                        aria-invalid={isInvalid}
                      />
                      <InputGroupAddon align="block-end">
                        <InputGroupText className="tabular-nums">
                          {field.state.value.length}/100 characters
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Include steps to reproduce, expected behavior, and what actually happened.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="bug-report-form">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

### Done

That's it. You now have a fully accessible form with client-side validation.

When you submit the form, the `onSubmit` function will be called with the validated form data. If the form data is invalid, TanStack Form will display the errors next to each field.

## Validation

### Client-side Validation

TanStack Form validates your form data using the Zod schema. Validation happens in real-time as the user types.

```tsx showLineNumbers title="form.tsx" {13-15}
import { useForm } from "@tanstack/react-form"

const formSchema = z.object({
  // ...
})

export function BugReportForm() {
  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
    },
  })

  return <form onSubmit={/* ... */}>{/* ... */}</form>
}
```

### Validation Modes

TanStack Form supports different validation strategies through the `validators` option:

| Mode         | Description                          |
| ------------ | ------------------------------------ |
| `"onChange"` | Validation triggers on every change. |
| `"onBlur"`   | Validation triggers on blur.         |
| `"onSubmit"` | Validation triggers on submit.       |

```tsx showLineNumbers title="form.tsx" {6-9}
const form = useForm({
  defaultValues: {
    title: "",
    description: "",
  },
  validators: {
    onSubmit: formSchema,
    onChange: formSchema,
    onBlur: formSchema,
  },
})
```

## Displaying Errors

Display errors next to the field using `<FieldError />`. For styling and accessibility:

- Add the `data-invalid` prop to the `<Field />` component.
- Add `aria-invalid` to native controls such as `<Input />` and `<Textarea />`, and `isInvalid` to the React Aria controls (`<Select />`, `<Checkbox />`, `<RadioGroup />`).

```tsx showLineNumbers title="form.tsx" {4,18}
<form.Field
  name="email"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          type="email"
          aria-invalid={isInvalid}
        />
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

## Working with Different Field Types

### Input

- For input fields, use `field.state.value` and `field.handleChange` on the `<Input />` component.
- To show errors, add the `aria-invalid` prop to the `<Input />` component and the `data-invalid` prop to the `<Field />` component.

**Example — `form-tanstack-input`**

```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"

import { showSubmitted } from "./form-tanstack-demo"

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(10, "Username must be at most 10 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
})

export default function FormTanstackInput() {
  const form = useForm({
    defaultValues: {
      username: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your profile information below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-input"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="username"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="form-tanstack-input-username">Username</FieldLabel>
                    <Input
                      id="form-tanstack-input-username"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="shadcn"
                      autoComplete="username"
                    />
                    <FieldDescription>
                      This is your public display name. Must be between 3 and 10 characters. Must
                      only contain letters, numbers, and underscores.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-input">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

```tsx showLineNumbers title="form.tsx" {6,11-14,22}
<form.Field
  name="username"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="form-tanstack-input-username">Username</FieldLabel>
        <Input
          id="form-tanstack-input-username"
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder="shadcn"
          autoComplete="username"
        />
        <FieldDescription>
          This is your public display name. Must be between 3 and 10 characters.
          Must only contain letters, numbers, and underscores.
        </FieldDescription>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

### Textarea

- For textarea fields, use `field.state.value` and `field.handleChange` on the `<Textarea />` component.
- To show errors, add the `aria-invalid` prop to the `<Textarea />` component and the `data-invalid` prop to the `<Field />` component.

**Example — `form-tanstack-textarea`**

```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Textarea } from "@tecton/react/components/textarea"

import { showSubmitted } from "./form-tanstack-demo"

const formSchema = z.object({
  about: z
    .string()
    .min(10, "Please provide at least 10 characters.")
    .max(200, "Please keep it under 200 characters."),
})

export default function FormTanstackTextarea() {
  const form = useForm({
    defaultValues: {
      about: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your profile information below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-textarea"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="about"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="form-tanstack-textarea-about">More about you</FieldLabel>
                    <Textarea
                      id="form-tanstack-textarea-about"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="I'm a software engineer..."
                      className="min-h-[120px]"
                    />
                    <FieldDescription>
                      Tell us more about yourself. This will be used to help us personalize your
                      experience.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-textarea">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

```tsx showLineNumbers title="form.tsx" {6,13-16,24}
<form.Field
  name="about"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor="form-tanstack-textarea-about">
          More about you
        </FieldLabel>
        <Textarea
          id="form-tanstack-textarea-about"
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder="I'm a software engineer..."
          className="min-h-[120px]"
        />
        <FieldDescription>
          Tell us more about yourself. This will be used to help us personalize
          your experience.
        </FieldDescription>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

### Select

- For select components, use `selectedKey` and `onSelectionChange` on the `<Select />` component. React Aria selects use `null` for "nothing selected", so map the empty string to `null` and back.
- To show errors, add the `isInvalid` prop to the `<Select />` component and the `data-invalid` prop to the `<Field />` component.

**Example — `form-tanstack-select`**

```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"

import { showSubmitted } from "./form-tanstack-demo"

const spokenLanguages = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Italian", value: "it" },
  { label: "Chinese", value: "zh" },
  { label: "Japanese", value: "ja" },
] as const

const formSchema = z.object({
  language: z
    .string()
    .min(1, "Please select your spoken language.")
    .refine((val) => val !== "auto", {
      message: "Auto-detection is not allowed. Please select a specific language.",
    }),
})

export default function FormTanstackSelect() {
  const form = useForm({
    defaultValues: {
      language: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-lg">
      <CardHeader>
        <CardTitle>Language Preferences</CardTitle>
        <CardDescription>Select your preferred spoken language.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-select"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="language"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field orientation="responsive" data-invalid={isInvalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-tanstack-select-language">
                        Spoken Language
                      </FieldLabel>
                      <FieldDescription>
                        For best results, select the language you speak.
                      </FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </FieldContent>
                    <Select
                      name={field.name}
                      placeholder="Select"
                      selectedKey={field.state.value || null}
                      onSelectionChange={(key) => field.handleChange(key ? String(key) : "")}
                      onBlur={field.handleBlur}
                      isInvalid={isInvalid}
                      className="min-w-[120px]"
                    >
                      <SelectTrigger id="form-tanstack-select-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem id="auto">Auto</SelectItem>
                        <SelectSeparator />
                        {spokenLanguages.map((language) => (
                          <SelectItem key={language.value} id={language.value}>
                            {language.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-select">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

```tsx showLineNumbers title="form.tsx" {6,18-22}
<form.Field
  name="language"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field orientation="responsive" data-invalid={isInvalid}>
        <FieldContent>
          <FieldLabel htmlFor="form-tanstack-select-language">
            Spoken Language
          </FieldLabel>
          <FieldDescription>
            For best results, select the language you speak.
          </FieldDescription>
          {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </FieldContent>
        <Select
          name={field.name}
          placeholder="Select"
          selectedKey={field.state.value || null}
          onSelectionChange={(key) => field.handleChange(key ? String(key) : "")}
          onBlur={field.handleBlur}
          isInvalid={isInvalid}
        >
          <SelectTrigger id="form-tanstack-select-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem id="auto">Auto</SelectItem>
            <SelectItem id="en">English</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    )
  }}
/>
```

### Checkbox

- For checkboxes, use `isSelected` and `onChange` on the `<Checkbox />` component.
- To show errors, add the `isInvalid` prop to the `<Checkbox />` component and the `data-invalid` prop to the `<Field />` component.
- For checkbox arrays, use `mode="array"` on the `<form.Field />` component and TanStack Form's array helpers.
- Remember to add `data-slot="checkbox-group"` to the `<FieldGroup />` component for proper styling and spacing.

**Example — `form-tanstack-checkbox`**

```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@tecton/react/components/field"

import { showSubmitted } from "./form-tanstack-demo"

const tasks = [
  { id: "push", label: "Push notifications" },
  { id: "email", label: "Email notifications" },
] as const

const formSchema = z.object({
  responses: z.boolean(),
  tasks: z
    .array(z.string())
    .min(1, "Please select at least one notification type.")
    .refine((value) => value.every((task) => tasks.some((t) => t.id === task)), {
      message: "Invalid notification type selected.",
    }),
})

export default function FormTanstackCheckbox() {
  const form = useForm({
    defaultValues: {
      responses: true,
      tasks: [] as string[],
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-checkbox"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="responses"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <div>
                    <FieldSet>
                      <FieldLegend variant="label">Responses</FieldLegend>
                      <FieldDescription>
                        Get notified for requests that take time, like research or image
                        generation.
                      </FieldDescription>
                      <FieldGroup data-slot="checkbox-group">
                        <Field orientation="horizontal" data-invalid={isInvalid}>
                          <Checkbox
                            id="form-tanstack-checkbox-responses"
                            name={field.name}
                            isSelected={field.state.value}
                            onChange={(checked) => field.handleChange(checked)}
                            isDisabled
                          />
                          <FieldLabel
                            htmlFor="form-tanstack-checkbox-responses"
                            className="font-normal"
                          >
                            Push notifications
                          </FieldLabel>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </div>
                )
              }}
            />
            <FieldSeparator />
            <form.Field
              name="tasks"
              mode="array"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <FieldGroup>
                    <FieldSet data-invalid={isInvalid}>
                      <FieldLegend variant="label">Tasks</FieldLegend>
                      <FieldDescription>
                        Get notified when tasks you&apos;ve created have updates.
                      </FieldDescription>
                      <FieldGroup data-slot="checkbox-group">
                        {tasks.map((task) => (
                          <Field key={task.id} orientation="horizontal" data-invalid={isInvalid}>
                            <Checkbox
                              id={`form-tanstack-checkbox-${task.id}`}
                              name={field.name}
                              isInvalid={isInvalid}
                              isSelected={field.state.value.includes(task.id)}
                              onChange={(checked) => {
                                if (checked) {
                                  field.pushValue(task.id)
                                } else {
                                  const index = field.state.value.indexOf(task.id)
                                  if (index > -1) field.removeValue(index)
                                }
                              }}
                            />
                            <FieldLabel
                              htmlFor={`form-tanstack-checkbox-${task.id}`}
                              className="font-normal"
                            >
                              {task.label}
                            </FieldLabel>
                          </Field>
                        ))}
                      </FieldGroup>
                    </FieldSet>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldGroup>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-checkbox">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

```tsx showLineNumbers title="form.tsx" {12,17,22-23,44}
<form.Field
  name="tasks"
  mode="array"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <FieldSet>
        <FieldLegend variant="label">Tasks</FieldLegend>
        <FieldDescription>
          Get notified when tasks you&apos;ve created have updates.
        </FieldDescription>
        <FieldGroup data-slot="checkbox-group">
          {tasks.map((task) => (
            <Field
              key={task.id}
              orientation="horizontal"
              data-invalid={isInvalid}
            >
              <Checkbox
                id={`form-tanstack-checkbox-${task.id}`}
                name={field.name}
                isInvalid={isInvalid}
                isSelected={field.state.value.includes(task.id)}
                onChange={(checked) => {
                  if (checked) {
                    field.pushValue(task.id)
                  } else {
                    const index = field.state.value.indexOf(task.id)
                    if (index > -1) {
                      field.removeValue(index)
                    }
                  }
                }}
              />
              <FieldLabel
                htmlFor={`form-tanstack-checkbox-${task.id}`}
                className="font-normal"
              >
                {task.label}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldSet>
    )
  }}
/>
```

### Radio Group

- For radio groups, use `value` and `onChange` on the `<RadioGroup />` component.
- To show errors, add the `isInvalid` prop to the `<RadioGroup />` component and the `data-invalid` prop to the `<Field />` component.

**Example — `form-tanstack-radiogroup`**

```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@tecton/react/components/field"
import { RadioGroup, RadioGroupItem } from "@tecton/react/components/radio-group"

import { showSubmitted } from "./form-tanstack-demo"

const plans = [
  {
    id: "starter",
    title: "Starter (100K tokens/month)",
    description: "For everyday use with basic features.",
  },
  {
    id: "pro",
    title: "Pro (1M tokens/month)",
    description: "For advanced AI usage with more features.",
  },
  {
    id: "enterprise",
    title: "Enterprise (Unlimited tokens)",
    description: "For large teams and heavy usage.",
  },
] as const

const formSchema = z.object({
  plan: z.string().min(1, "You must select a subscription plan to continue."),
})

export default function FormTanstackRadioGroup() {
  const form = useForm({
    defaultValues: {
      plan: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Subscription Plan</CardTitle>
        <CardDescription>See pricing and features for each plan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-radiogroup"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="plan"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <FieldSet>
                    <FieldLegend>Plan</FieldLegend>
                    <FieldDescription>
                      You can upgrade or downgrade your plan at any time.
                    </FieldDescription>
                    <RadioGroup
                      name={field.name}
                      value={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      isInvalid={isInvalid}
                      aria-label="Plan"
                    >
                      {plans.map((plan) => (
                        <FieldLabel key={plan.id} htmlFor={`form-tanstack-radiogroup-${plan.id}`}>
                          <Field orientation="horizontal" data-invalid={isInvalid}>
                            <FieldContent>
                              <FieldTitle>{plan.title}</FieldTitle>
                              <FieldDescription>{plan.description}</FieldDescription>
                            </FieldContent>
                            <RadioGroupItem
                              value={plan.id}
                              id={`form-tanstack-radiogroup-${plan.id}`}
                            />
                          </Field>
                        </FieldLabel>
                      ))}
                    </RadioGroup>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldSet>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-radiogroup">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

```tsx showLineNumbers title="form.tsx" {14-15,21}
<form.Field
  name="plan"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <FieldSet>
        <FieldLegend>Plan</FieldLegend>
        <FieldDescription>
          You can upgrade or downgrade your plan at any time.
        </FieldDescription>
        <RadioGroup
          name={field.name}
          value={field.state.value}
          onChange={field.handleChange}
          isInvalid={isInvalid}
          aria-label="Plan"
        >
          {plans.map((plan) => (
            <FieldLabel
              key={plan.id}
              htmlFor={`form-tanstack-radiogroup-${plan.id}`}
            >
              <Field orientation="horizontal" data-invalid={isInvalid}>
                <FieldContent>
                  <FieldTitle>{plan.title}</FieldTitle>
                  <FieldDescription>{plan.description}</FieldDescription>
                </FieldContent>
                <RadioGroupItem
                  value={plan.id}
                  id={`form-tanstack-radiogroup-${plan.id}`}
                />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldSet>
    )
  }}
/>
```

### Switch

- For switches, use `isSelected` and `onChange` on the `<Switch />` component.
- To show errors, add the `data-invalid` prop to the `<Field />` component (React Aria switches have no invalid state of their own).

**Example — `form-tanstack-switch`**

```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@tecton/react/components/field"
import { Switch } from "@tecton/react/components/switch"

import { showSubmitted } from "./form-tanstack-demo"

const formSchema = z.object({
  twoFactor: z.boolean().refine((val) => val === true, {
    message: "It is highly recommended to enable two-factor authentication.",
  }),
})

export default function FormTanstackSwitch() {
  const form = useForm({
    defaultValues: {
      twoFactor: false,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Manage your account security preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-switch"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="twoFactor"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field orientation="horizontal" data-invalid={isInvalid}>
                    <FieldContent>
                      <FieldLabel htmlFor="form-tanstack-switch-twoFactor">
                        Multi-factor authentication
                      </FieldLabel>
                      <FieldDescription>
                        Enable multi-factor authentication to secure your account.
                      </FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </FieldContent>
                    <Switch
                      id="form-tanstack-switch-twoFactor"
                      name={field.name}
                      isSelected={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-switch">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

```tsx showLineNumbers title="form.tsx" {6,14,19-20}
<form.Field
  name="twoFactor"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field orientation="horizontal" data-invalid={isInvalid}>
        <FieldContent>
          <FieldLabel htmlFor="form-tanstack-switch-twoFactor">
            Multi-factor authentication
          </FieldLabel>
          <FieldDescription>
            Enable multi-factor authentication to secure your account.
          </FieldDescription>
          {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </FieldContent>
        <Switch
          id="form-tanstack-switch-twoFactor"
          name={field.name}
          isSelected={field.state.value}
          onChange={field.handleChange}
        />
      </Field>
    )
  }}
/>
```

### Complex Forms

Here is an example of a more complex form with multiple fields and validation.

**Example — `form-tanstack-complex`**

```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import { Card, CardContent, CardFooter } from "@tecton/react/components/card"
import { Checkbox } from "@tecton/react/components/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@tecton/react/components/field"
import { RadioGroup, RadioGroupItem } from "@tecton/react/components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tecton/react/components/select"
import { Switch } from "@tecton/react/components/switch"

import { showSubmitted } from "./form-tanstack-demo"

const addons = [
  { id: "analytics", title: "Analytics", description: "Advanced analytics and reporting" },
  { id: "backup", title: "Backup", description: "Automated daily backups" },
  { id: "support", title: "Priority Support", description: "24/7 premium customer support" },
] as const

const formSchema = z.object({
  plan: z
    .string()
    .min(1, "Please select a subscription plan")
    .refine((value) => value === "basic" || value === "pro", {
      message: "Invalid plan selection. Please choose Basic or Pro",
    }),
  billingPeriod: z.string().min(1, "Please select a billing period"),
  addons: z
    .array(z.string())
    .min(1, "Please select at least one add-on")
    .max(3, "You can select up to 3 add-ons")
    .refine((value) => value.every((addon) => addons.some((a) => a.id === addon)), {
      message: "You selected an invalid add-on",
    }),
  emailNotifications: z.boolean(),
})

export default function FormTanstackComplex() {
  const form = useForm({
    defaultValues: {
      plan: "basic",
      billingPeriod: "monthly",
      addons: [] as string[],
      emailNotifications: false,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <form
          id="subscription-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field
              name="plan"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <FieldSet>
                    <FieldLegend>Subscription Plan</FieldLegend>
                    <FieldDescription>Choose your subscription plan.</FieldDescription>
                    <RadioGroup
                      name={field.name}
                      value={field.state.value}
                      onChange={field.handleChange}
                      isInvalid={isInvalid}
                      aria-label="Subscription plan"
                    >
                      <FieldLabel htmlFor="basic">
                        <Field orientation="horizontal" data-invalid={isInvalid}>
                          <FieldContent>
                            <FieldTitle>Basic</FieldTitle>
                            <FieldDescription>For individuals and small teams</FieldDescription>
                          </FieldContent>
                          <RadioGroupItem value="basic" id="basic" />
                        </Field>
                      </FieldLabel>
                      <FieldLabel htmlFor="pro">
                        <Field orientation="horizontal" data-invalid={isInvalid}>
                          <FieldContent>
                            <FieldTitle>Pro</FieldTitle>
                            <FieldDescription>For businesses with higher demands</FieldDescription>
                          </FieldContent>
                          <RadioGroupItem value="pro" id="pro" />
                        </Field>
                      </FieldLabel>
                    </RadioGroup>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldSet>
                )
              }}
            />
            <FieldSeparator />
            <form.Field
              name="billingPeriod"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Billing Period</FieldLabel>
                    <Select
                      name={field.name}
                      placeholder="Select"
                      selectedKey={field.state.value || null}
                      onSelectionChange={(key) => field.handleChange(key ? String(key) : "")}
                      isInvalid={isInvalid}
                      className="w-full"
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem id="monthly">Monthly</SelectItem>
                        <SelectItem id="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>Choose how often you want to be billed.</FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
            <FieldSeparator />
            <form.Field
              name="addons"
              mode="array"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <FieldSet>
                    <FieldLegend>Add-ons</FieldLegend>
                    <FieldDescription>
                      Select additional features you&apos;d like to include.
                    </FieldDescription>
                    <FieldGroup data-slot="checkbox-group">
                      {addons.map((addon) => (
                        <Field key={addon.id} orientation="horizontal" data-invalid={isInvalid}>
                          <Checkbox
                            id={addon.id}
                            name={field.name}
                            isInvalid={isInvalid}
                            isSelected={field.state.value.includes(addon.id)}
                            onChange={(checked) => {
                              if (checked) {
                                field.pushValue(addon.id)
                              } else {
                                const index = field.state.value.indexOf(addon.id)
                                if (index > -1) field.removeValue(index)
                              }
                            }}
                          />
                          <FieldContent>
                            <FieldLabel htmlFor={addon.id}>{addon.title}</FieldLabel>
                            <FieldDescription>{addon.description}</FieldDescription>
                          </FieldContent>
                        </Field>
                      ))}
                    </FieldGroup>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldSet>
                )
              }}
            />
            <FieldSeparator />
            <form.Field
              name="emailNotifications"
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field orientation="horizontal" data-invalid={isInvalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Email Notifications</FieldLabel>
                      <FieldDescription>
                        Receive email updates about your subscription
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id={field.name}
                      name={field.name}
                      isSelected={field.state.value}
                      onChange={field.handleChange}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal" className="justify-end">
          <Button type="submit" form="subscription-form">
            Save Preferences
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

## Resetting the Form

Use `form.reset()` to reset the form to its default values.

```tsx showLineNumbers
<Button type="button" variant="outline" onPress={() => form.reset()}>
  Reset
</Button>
```

## Array Fields

TanStack Form provides powerful array field management with `mode="array"`. This allows you to dynamically add, remove, and update array items with full validation support.

**Example — `form-tanstack-array`**

```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import { XIcon } from "lucide-react"
import * as z from "zod"

import { Button } from "@tecton/react/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@tecton/react/components/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@tecton/react/components/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@tecton/react/components/input-group"

import { showSubmitted } from "./form-tanstack-demo"

const formSchema = z.object({
  emails: z
    .array(
      z.object({
        address: z.string().email("Enter a valid email address."),
      })
    )
    .min(1, "Add at least one email address.")
    .max(5, "You can add up to 5 email addresses."),
})

export default function FormTanstackArray() {
  const form = useForm({
    defaultValues: {
      emails: [{ address: "" }],
    },
    validators: {
      onBlur: formSchema,
    },
    onSubmit: async ({ value }) => {
      showSubmitted(value)
    },
  })

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader className="border-b">
        <CardTitle>Contact Emails</CardTitle>
        <CardDescription>Manage your contact email addresses.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-tanstack-array"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.Field name="emails" mode="array">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <FieldSet className="gap-4">
                  <FieldLegend variant="label">Email Addresses</FieldLegend>
                  <FieldDescription>
                    Add up to 5 email addresses where we can contact you.
                  </FieldDescription>
                  <FieldGroup className="gap-4">
                    {field.state.value.map((_, index) => (
                      <form.Field
                        key={index}
                        name={`emails[${index}].address`}
                        children={(subField) => {
                          const isSubFieldInvalid =
                            subField.state.meta.isTouched && !subField.state.meta.isValid
                          return (
                            <Field orientation="horizontal" data-invalid={isSubFieldInvalid}>
                              <FieldContent>
                                <InputGroup>
                                  <InputGroupInput
                                    id={`form-tanstack-array-email-${index}`}
                                    name={subField.name}
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) => subField.handleChange(e.target.value)}
                                    aria-invalid={isSubFieldInvalid}
                                    placeholder="name@example.com"
                                    type="email"
                                    autoComplete="email"
                                  />
                                  {field.state.value.length > 1 && (
                                    <InputGroupAddon align="inline-end">
                                      <InputGroupButton
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        onPress={() => field.removeValue(index)}
                                        aria-label={`Remove email ${index + 1}`}
                                      >
                                        <XIcon />
                                      </InputGroupButton>
                                    </InputGroupAddon>
                                  )}
                                </InputGroup>
                                {isSubFieldInvalid && (
                                  <FieldError errors={subField.state.meta.errors} />
                                )}
                              </FieldContent>
                            </Field>
                          )
                        }}
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onPress={() => field.pushValue({ address: "" })}
                      isDisabled={field.state.value.length >= 5}
                    >
                      Add Email Address
                    </Button>
                  </FieldGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </FieldSet>
              )
            }}
          </form.Field>
        </form>
      </CardContent>
      <CardFooter className="border-t">
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onPress={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form="form-tanstack-array">
            Save
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
```

This example demonstrates managing multiple email addresses with array fields. Users can add up to 5 email addresses, remove individual addresses, and each address is validated independently.

### Array Field Structure

Use `mode="array"` on the parent field to enable array field management.

```tsx showLineNumbers title="form.tsx" {3,12-14}
<form.Field
  name="emails"
  mode="array"
  children={(field) => {
    return (
      <FieldSet>
        <FieldLegend variant="label">Email Addresses</FieldLegend>
        <FieldDescription>
          Add up to 5 email addresses where we can contact you.
        </FieldDescription>
        <FieldGroup>
          {field.state.value.map((_, index) => (
            // Nested field for each array item
          ))}
        </FieldGroup>
      </FieldSet>
    )
  }}
/>
```

### Nested Fields

Access individual array items using bracket notation: `fieldName[index].propertyName`. This example uses `InputGroup` to display the remove button inline with the input.

```tsx showLineNumbers title="form.tsx"
<form.Field
  name={`emails[${index}].address`}
  children={(subField) => {
    const isSubFieldInvalid =
      subField.state.meta.isTouched && !subField.state.meta.isValid
    return (
      <Field orientation="horizontal" data-invalid={isSubFieldInvalid}>
        <FieldContent>
          <InputGroup>
            <InputGroupInput
              id={`form-tanstack-array-email-${index}`}
              name={subField.name}
              value={subField.state.value}
              onBlur={subField.handleBlur}
              onChange={(e) => subField.handleChange(e.target.value)}
              aria-invalid={isSubFieldInvalid}
              placeholder="name@example.com"
              type="email"
            />
            {field.state.value.length > 1 && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onPress={() => field.removeValue(index)}
                  aria-label={`Remove email ${index + 1}`}
                >
                  <XIcon />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          {isSubFieldInvalid && (
            <FieldError errors={subField.state.meta.errors} />
          )}
        </FieldContent>
      </Field>
    )
  }}
/>
```

### Adding Items

Use `field.pushValue(item)` to add items to an array field. You can disable the button when the array reaches its maximum length.

```tsx showLineNumbers title="form.tsx"
<Button
  type="button"
  variant="outline"
  size="sm"
  onPress={() => field.pushValue({ address: "" })}
  isDisabled={field.state.value.length >= 5}
>
  Add Email Address
</Button>
```

### Removing Items

Use `field.removeValue(index)` to remove items from an array field. You can conditionally show the remove button only when there's more than one item.

```tsx showLineNumbers title="form.tsx"
{
  field.state.value.length > 1 && (
    <InputGroupButton
      onPress={() => field.removeValue(index)}
      aria-label={`Remove email ${index + 1}`}
    >
      <XIcon />
    </InputGroupButton>
  )
}
```

### Array Validation

Validate array fields using Zod's array methods.

```tsx showLineNumbers title="form.tsx"
const formSchema = z.object({
  emails: z
    .array(
      z.object({
        address: z.string().email("Enter a valid email address."),
      })
    )
    .min(1, "Add at least one email address.")
    .max(5, "You can add up to 5 email addresses."),
})
```
