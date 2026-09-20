export const loginCopy = {
  brand: "Tecton",
  title: "Sign in to your workspace",
  description: "Use your company account to access projects and models.",
  ssoProvider: "Equinor SSO",
  helpUrl: "#request-access",
}

/** Demo credentials accepted by the mock sign-in. */
export const demoAccount = {
  email: "lena.haugen@example.com",
  password: "tecton-demo",
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Email is required."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Enter a valid email address."
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Password is required."
  if (value.length < 8) return "Password must be at least 8 characters."
  return undefined
}
