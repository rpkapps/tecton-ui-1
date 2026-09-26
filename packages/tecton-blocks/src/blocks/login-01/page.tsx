"use client"

import * as React from "react"
import { cn } from "cn"

import { LoginForm } from "./components/login-form"
import type { LoginValues } from "./components/login-form"
import { demoAccount, loginCopy } from "./data"

/**
 * Mock sign-in for the demo: waits like a request and accepts only the demo
 * account. Replace it with the application's own authentication call.
 */
async function demoSignIn({ email, password }: LoginValues) {
  await new Promise((resolve) => window.setTimeout(resolve, 800))
  if (email !== demoAccount.email || password !== demoAccount.password)
    throw new Error("The email or password is incorrect.")
}

/** Route-ready page: centred login card on the application background. */
export default function LoginPage() {
  const [signedIn, setSignedIn] = React.useState<string>()

  return (
    <div
      data-slot="login-page"
      className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-4 py-10 text-foreground"
    >
      <LoginForm
        onSubmit={async (values) => {
          await demoSignIn(values)
          setSignedIn(values.email)
        }}
      />
      <p
        role="status"
        className={cn("max-w-sm text-center text-sm", !signedIn && "sr-only")}
      >
        {signedIn && `Signed in as ${signedIn}.`}
      </p>
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        By signing in you agree to the {loginCopy.brand} acceptable-use policy.
        Access is logged for security auditing.
      </p>
      <p
        data-slot="login-demo-note"
        className="max-w-sm text-center text-xs text-muted-foreground"
      >
        Demo only: sign in with {demoAccount.email} and the password{" "}
        <span className="font-mono">{demoAccount.password}</span>.
      </p>
    </div>
  )
}

export { LoginForm, demoSignIn }
export { loginCopy, demoAccount, validateEmail, validatePassword } from "./data"
export type { LoginFormProps, LoginValues } from "./components/login-form"
