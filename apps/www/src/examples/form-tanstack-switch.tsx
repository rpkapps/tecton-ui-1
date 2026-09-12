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
