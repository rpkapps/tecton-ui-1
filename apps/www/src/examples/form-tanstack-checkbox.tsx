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
    .refine(
      (value) => value.every((task) => tasks.some((t) => t.id === task)),
      {
        message: "Invalid notification type selected.",
      }
    ),
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
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <div>
                    <FieldSet>
                      <FieldLegend variant="label">Responses</FieldLegend>
                      <FieldDescription>
                        Get notified for requests that take time, like research
                        or image generation.
                      </FieldDescription>
                      <FieldGroup data-slot="checkbox-group">
                        <Field
                          orientation="horizontal"
                          data-invalid={isInvalid}
                        >
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </div>
                )
              }}
            />
            <FieldSeparator />
            <form.Field
              name="tasks"
              mode="array"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <FieldGroup>
                    <FieldSet data-invalid={isInvalid}>
                      <FieldLegend variant="label">Tasks</FieldLegend>
                      <FieldDescription>
                        Get notified when tasks you&apos;ve created have
                        updates.
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
                                  const index = field.state.value.indexOf(
                                    task.id
                                  )
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
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
