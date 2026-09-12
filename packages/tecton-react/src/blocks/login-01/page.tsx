"use client"

import * as React from "react"

import { LoginForm } from "./components/login-form"
import { loginCopy } from "./data"

/** Route-ready page: centred login card on the application background. */
export default function LoginPage() {
  return (
    <div
      data-slot="login-page"
      className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-4 py-10 text-foreground"
    >
      <LoginForm />
      <p className="max-w-sm text-center text-xs text-muted-foreground">
        By signing in you agree to the {loginCopy.brand} acceptable-use policy.
        Access is logged for security auditing.
      </p>
    </div>
  )
}

export { LoginForm }
export { loginCopy, demoAccount, validateEmail, validatePassword } from "./data"
export type { LoginFormProps } from "./components/login-form"
