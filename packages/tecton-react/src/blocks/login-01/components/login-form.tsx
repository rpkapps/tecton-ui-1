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

import { demoAccount, loginCopy, validateEmail, validatePassword } from "../data"

type LoginFormProps = Omit<React.ComponentProps<typeof Card>, "children" | "onSubmit"> & {
  onSubmit?: (values: { email: string; password: string; remember: boolean }) => void
  onSso?: () => void
}

function LoginForm({ className, onSubmit, onSso, ...props }: LoginFormProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [remember, setRemember] = React.useState(true)
  const [submitted, setSubmitted] = React.useState(false)
  const [status, setStatus] = React.useState<"idle" | "loading" | "error">("idle")
  const emailId = React.useId()
  const passwordId = React.useId()
  const rememberId = React.useId()

  const emailError = submitted ? validateEmail(email) : undefined
  const passwordError = submitted ? validatePassword(password) : undefined

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (validateEmail(email) || validatePassword(password)) return
    setStatus("loading")
    window.setTimeout(() => {
      const ok = email === demoAccount.email && password === demoAccount.password
      setStatus(ok ? "idle" : "error")
      if (ok) onSubmit?.({ email, password, remember })
    }, 800)
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
        <CardTitle>{loginCopy.title}</CardTitle>
        <CardDescription>{loginCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
          {status === "error" && (
            <Alert variant="destructive" appearance="outline">
              <CircleAlertIcon />
              <AlertTitle>Incorrect email or password</AlertTitle>
              <AlertDescription>
                Try {demoAccount.email} / {demoAccount.password}.
              </AlertDescription>
              <AlertAction>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Dismiss"
                  onPress={() => setStatus("idle")}
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
              required
            />
            <FieldError>{emailError}</FieldError>
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
              required
            />
            <FieldError>{passwordError}</FieldError>
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Field orientation="horizontal" className="w-auto">
              <Checkbox id={rememberId} isSelected={remember} onChange={setRemember} />
              <FieldLabel htmlFor={rememberId} className="text-sm font-normal">
                Keep me signed in
              </FieldLabel>
            </Field>
            <Link href="#forgot" variant="muted" size="sm">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" isDisabled={status === "loading"}>
            {status === "loading" && <Spinner />}
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
          <Button type="button" variant="secondary" className="w-full" onPress={onSso}>
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
export type { LoginFormProps }
