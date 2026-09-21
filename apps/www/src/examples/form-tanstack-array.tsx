"use client"

import { useForm } from "@tanstack/react-form"
import { CloseIcon } from "@tecton/react/icons"
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
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
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
                            subField.state.meta.isTouched &&
                            !subField.state.meta.isValid
                          return (
                            <Field
                              orientation="horizontal"
                              data-invalid={isSubFieldInvalid}
                            >
                              <FieldContent>
                                <InputGroup>
                                  <InputGroupInput
                                    id={`form-tanstack-array-email-${index}`}
                                    name={subField.name}
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
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
                                        <CloseIcon />
                                      </InputGroupButton>
                                    </InputGroupAddon>
                                  )}
                                </InputGroup>
                                {isSubFieldInvalid && (
                                  <FieldError
                                    errors={subField.state.meta.errors}
                                  />
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
