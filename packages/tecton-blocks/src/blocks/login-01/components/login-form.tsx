"use client"

import * as React from "react"
import { cn } from "cn"
import { BuildingIcon, CircleAlertIcon, LayersIcon, XIcon } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@tecton/react/components/alert"
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
import { Field, FieldError, FieldLabel } from "@tecton/react/components/field"
import { Input } from "@tecton/react/components/input"
import { Separator } from "@tecton/react/components/separator"
import { Spinner } from "@tecton/react/components/spinner"
import { Link } from "@tecton/react/tecton/link"

import { loginCopy, validateEmail, validatePassword } from "../data"

type LoginValues = {
  email: string
  password: string
  remember: boolean
}

type LoginFormProps = Omit<
  React.ComponentProps<typeof Card>,
  "children" | "onSubmit"
> & {
  /**
   * Called with the credentials once they pass validation. Return a promise
   * to show the pending state while it runs; a rejection is shown as the
   * sign-in error (its `message`, or a generic one).
   */
  onSubmit?: (values: LoginValues) => Promise<void> | void
  onSso?: () => void
  /** A sign-in error from the caller (e.g. rejected credentials). */
  error?: string | undefined
  /** Shows the pending state, for a caller that tracks the request itself. */
  pending?: boolean
  /** Where the form posts when it is submitted before hydration. */
  action?: string
}

const genericError = "Check your email and password and try again."

function LoginForm({
  className,
  onSubmit,
  onSso,
  error,
  pending = false,
  action,
  ...props
}: LoginFormProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [remember, setRemember] = React.useState(true)
  const [submitted, setSubmitted] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string>()
  const [dismissed, setDismissed] = React.useState<string>()
  const mounted = React.useRef(true)
  const emailId = React.useId()
  const passwordId = React.useId()
  const rememberId = React.useId()

  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const emailError = submitted ? validateEmail(email) : undefined
  const passwordError = submitted ? validatePassword(password) : undefined
  const loading = pending || submitting
  const shownError = error ?? submitError
  const visibleError = shownError === dismissed ? undefined : shownError

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    setSubmitError(undefined)
    setDismissed(undefined)
    if (validateEmail(email) || validatePassword(password)) return
    if (!onSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({ email, password, remember })
    } catch (reason) {
      if (mounted.current)
        setSubmitError(
          reason instanceof Error && reason.message
            ? reason.message
            : genericError
        )
    } finally {
      if (mounted.current) setSubmitting(false)
    }
  }

  return (
    <Card
      data-slot="login-form"
      className={cn("w-full max-w-sm", className)}
      {...props}
    >
      <CardHeader className="justify-items-center text-center">
        <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LayersIcon className="size-5" aria-hidden />
        </span>
        <CardTitle role="heading" aria-level={1}>
          {loginCopy.title}
        </CardTitle>
        <CardDescription>{loginCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          method="post"
          {...(action === undefined ? {} : { action })}
          onSubmit={submit}
          noValidate
        >
          {visibleError && (
            <Alert variant="destructive" appearance="outline">
              <CircleAlertIcon />
              <AlertTitle>Couldn’t sign you in</AlertTitle>
              <AlertDescription>{visibleError}</AlertDescription>
              <AlertAction>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Dismiss"
                  onClick={() => setDismissed(visibleError)}
                >
                  <XIcon />
                </Button>
              </AlertAction>
            </Alert>
          )}
          <Field data-invalid={!!emailError}>
            <FieldLabel htmlFor={emailId}>Email</FieldLabel>
            <Input
              id={emailId}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? `${emailId}-error` : undefined}
              required
            />
            <FieldError id={`${emailId}-error`}>{emailError}</FieldError>
          </Field>
          <Field data-invalid={!!passwordError}>
            <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
            <Input
              id={passwordId}
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={!!passwordError}
              aria-describedby={
                passwordError ? `${passwordId}-error` : undefined
              }
              required
            />
            <FieldError id={`${passwordId}-error`}>{passwordError}</FieldError>
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Field orientation="horizontal" className="w-auto">
              <Checkbox
                id={rememberId}
                name="remember"
                checked={remember}
                onCheckedChange={setRemember}
              />
              <FieldLabel htmlFor={rememberId} className="text-sm font-normal">
                Keep me signed in
              </FieldLabel>
            </Field>
            <Link href="#forgot" variant="muted" size="sm">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Spinner />}
            Sign in
          </Button>
          <div
            role="separator"
            className="flex items-center gap-3 text-xs text-muted-foreground"
          >
            <Separator emphasis="subtle" className="flex-1" />
            or
            <Separator emphasis="subtle" className="flex-1" />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={onSso}
          >
            <BuildingIcon /> Continue with {loginCopy.ssoProvider}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-xs text-muted-foreground">
        No account yet?&nbsp;
        <Link href={loginCopy.helpUrl} variant="subtle" size="sm">
          Request access
        </Link>
      </CardFooter>
    </Card>
  )
}

export { LoginForm }
export type { LoginFormProps, LoginValues }
