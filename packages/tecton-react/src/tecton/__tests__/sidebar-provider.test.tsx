import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"

import { SidebarProvider, useSidebar } from "@tecton/react/components/sidebar"

/**
 * `cookieName` and `keyboardShortcut` are Tecton additions to the generated
 * `SidebarProvider` (see docs/UPSTREAM.md): several micro frontends can render
 * a sidebar on one page, and upstream hard-codes one cookie name and one
 * shortcut for all of them.
 */
function SidebarProbe() {
  const { state, toggleSidebar } = useSidebar()
  return (
    <>
      <span data-testid="state">{state}</span>
      <button type="button" onClick={toggleSidebar}>
        Toggle
      </button>
    </>
  )
}

function state() {
  return screen.getByTestId("state").textContent
}

function cookies() {
  return document.cookie
}

beforeEach(() => {
  for (const entry of document.cookie.split(";")) {
    const name = entry.split("=")[0]?.trim()
    if (name) document.cookie = `${name}=; path=/; max-age=0`
  }
})

describe("SidebarProvider defaults", () => {
  it("writes the sidebar_state cookie when the sidebar is toggled", async () => {
    render(
      <SidebarProvider>
        <SidebarProbe />
      </SidebarProvider>
    )
    expect(state()).toBe("expanded")
    expect(cookies()).not.toContain("sidebar_state")

    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    expect(state()).toBe("collapsed")
    expect(cookies()).toContain("sidebar_state=false")
  })

  it("toggles on Ctrl+B and on Meta+B", async () => {
    render(
      <SidebarProvider>
        <SidebarProbe />
      </SidebarProvider>
    )
    await userEvent.keyboard("{Control>}b{/Control}")
    expect(state()).toBe("collapsed")

    await userEvent.keyboard("{Meta>}b{/Meta}")
    expect(state()).toBe("expanded")
  })

  it("ignores B without a modifier", async () => {
    render(
      <SidebarProvider>
        <SidebarProbe />
      </SidebarProvider>
    )
    await userEvent.keyboard("b")
    expect(state()).toBe("expanded")
  })
})

describe("SidebarProvider cookieName", () => {
  it("writes no cookie at all when false", async () => {
    render(
      <SidebarProvider cookieName={false}>
        <SidebarProbe />
      </SidebarProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    // The state still changes — only the persistence is opted out of.
    expect(state()).toBe("collapsed")
    expect(cookies()).toBe("")
  })

  it("writes the given name instead of the default one", async () => {
    render(
      <SidebarProvider cookieName="assets_sidebar">
        <SidebarProbe />
      </SidebarProvider>
    )
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    expect(cookies()).toContain("assets_sidebar=false")
    expect(cookies()).not.toContain("sidebar_state")
  })
})

describe("SidebarProvider keyboardShortcut", () => {
  it("registers no listener when false", async () => {
    render(
      <SidebarProvider keyboardShortcut={false}>
        <SidebarProbe />
      </SidebarProvider>
    )
    await userEvent.keyboard("{Control>}b{/Control}")
    expect(state()).toBe("expanded")

    // The sidebar is still togglable, just not by the shortcut.
    await userEvent.click(screen.getByRole("button", { name: "Toggle" }))
    expect(state()).toBe("collapsed")
  })

  it("listens for the given key instead of b", async () => {
    render(
      <SidebarProvider keyboardShortcut="k">
        <SidebarProbe />
      </SidebarProvider>
    )
    await userEvent.keyboard("{Control>}b{/Control}")
    expect(state()).toBe("expanded")

    await userEvent.keyboard("{Control>}k{/Control}")
    expect(state()).toBe("collapsed")
  })
})
