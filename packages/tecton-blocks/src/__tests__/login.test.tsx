import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import LoginPage, { demoAccount, LoginForm } from "../blocks/login-01/page"

async function fillIn(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText("Email"), email)
  await user.type(screen.getByLabelText("Password"), password)
  await user.click(screen.getByRole("button", { name: "Sign in" }))
  return user
}

describe("login-01", () => {
  it("calls onSubmit with any valid credentials", async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    await fillIn("ola.nordmann@company.no", "correct horse")
    expect(onSubmit).toHaveBeenCalledWith({
      email: "ola.nordmann@company.no",
      password: "correct horse",
      remember: true,
    })
  })

  it("does not submit invalid input and links the errors to the fields", async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    await fillIn("not-an-email", "short")
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address."
    )
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Password must be at least 8 characters."
    )
  })

  it("shows a rejected submit as the error and re-enables the button", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Account locked."))
    render(<LoginForm onSubmit={onSubmit} />)
    await fillIn("ola.nordmann@company.no", "correct horse")
    expect(await screen.findByText("Account locked.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled()
  })

  it("shows an error passed by the caller", () => {
    render(<LoginForm error="Your session has ended." />)
    expect(screen.getByText("Your session has ended.")).toBeInTheDocument()
  })

  it("posts the form, so a pre-hydration submit keeps the password out of the URL", () => {
    const { container } = render(<LoginForm />)
    expect(container.querySelector("form")).toHaveAttribute("method", "post")
  })

  it("titles the page with a level-1 heading", () => {
    render(<LoginForm />)
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Sign in to your workspace",
      })
    ).toBeInTheDocument()
  })

  it("never puts the demo password in the error", async () => {
    render(<LoginPage />)
    await fillIn("someone@company.no", "wrong password")
    const alert = await screen.findByText(
      "The email or password is incorrect.",
      {},
      { timeout: 2000 }
    )
    expect(alert.closest("[data-slot=alert]")).not.toHaveTextContent(
      demoAccount.password
    )
  })

  it("signs the demo account in on the demo page", async () => {
    render(<LoginPage />)
    await fillIn(demoAccount.email, demoAccount.password)
    expect(
      await screen.findByText(
        `Signed in as ${demoAccount.email}.`,
        {},
        { timeout: 2000 }
      )
    ).toBeInTheDocument()
  })
})
