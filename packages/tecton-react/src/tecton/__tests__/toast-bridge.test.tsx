import * as React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import * as ShellThemeRoot from "@tecton/react/theme-root"
import * as ShellToast from "@tecton/react/toast"
import {
  bridgeToast,
  TOAST_HOSTS_KEY,
  type ToastHostV1,
} from "@tecton/react/toast-bridge"

// The shell and each micro-frontend remote bring their own copy of the toast
// module. `vi.resetModules()` + a dynamic import gives the test a second copy
// (its own queue, its own bridge owner), as a remote's bundle would.

const { ThemeRoot } = ShellThemeRoot
const { createToastManager, toast: shellToast, Toaster } = ShellToast

let remote: typeof ShellToast
let remoteThemeRoot: typeof ShellThemeRoot

beforeAll(async () => {
  vi.resetModules()
  remote = await import("@tecton/react/toast")
  remoteThemeRoot = await import("@tecton/react/theme-root")
})

const store = globalThis as Record<symbol, unknown>
const publishedHosts = () => (store[TOAST_HOSTS_KEY] ?? []) as ToastHostV1[]

afterEach(() => {
  act(() => {
    shellToast.close()
    remote.toast.close()
  })
})

function viewportOf(text: string) {
  return screen.getByText(text).closest('[data-slot="toast-viewport"]')
}

function RemoteApp() {
  return (
    <remoteThemeRoot.ThemeRoot>
      <remote.Toaster />
    </remoteThemeRoot.ThemeRoot>
  )
}

function Page() {
  return (
    <>
      <Toaster />
      <RemoteApp />
    </>
  )
}

describe("toast bridge", () => {
  it("stacks a remote's toasts with the shell's in the shell's viewport", async () => {
    render(<Page />)

    act(() => {
      shellToast.add({ title: "From the shell" })
      remote.toast.add({ title: "From the remote" })
    })

    await screen.findByText("From the remote")
    const shellViewport = viewportOf("From the shell")
    expect(viewportOf("From the remote")).toBe(shellViewport)
    for (const viewport of document.querySelectorAll(
      '[data-slot="toast-viewport"]'
    )) {
      if (viewport !== shellViewport) {
        expect(viewport.querySelector('[data-slot="toast"]')).toBeNull()
      }
    }
  })

  it("routes update and close of a forwarded toast to the shell", async () => {
    render(<Page />)

    let id = ""
    act(() => {
      id = remote.toast.add({ title: "Saving" })
    })
    await screen.findByText("Saving")

    act(() => remote.toast.update(id, { title: "Saved" }))
    await screen.findByText("Saved")

    act(() => remote.toast.close(id))
    await waitFor(() => expect(screen.queryByText("Saved")).toBeNull())
  })

  it("forwards promise toasts", async () => {
    render(<Page />)

    let resolve: (value: string) => void = () => {}
    const work = new Promise<string>((done) => (resolve = done))
    act(() => {
      shellToast.add({ title: "Shell toast" })
      void remote.toast.promise(work, {
        loading: "Uploading",
        success: (name: string) => ({ title: `Uploaded ${name}` }),
        error: "Failed",
      })
    })

    await screen.findByText("Uploading")
    expect(viewportOf("Uploading")).toBe(viewportOf("Shell toast"))

    await act(async () => {
      resolve("report.pdf")
      await work
    })
    await screen.findByText("Uploaded report.pdf")
  })

  it("keeps a bare close() to the caller's own toasts, promise toasts included", async () => {
    render(<Page />)

    act(() => {
      shellToast.add({ title: "Shell toast" })
      remote.toast.add({ title: "Remote toast" })
      void remote.toast.promise(new Promise(() => {}), {
        loading: "Remote pending",
        success: "Done",
        error: "Failed",
      })
    })
    await screen.findByText("Remote pending")

    act(() => remote.toast.close())
    await waitFor(() => {
      expect(screen.queryByText("Remote toast")).toBeNull()
      expect(screen.queryByText("Remote pending")).toBeNull()
    })
    expect(screen.getByText("Shell toast")).toBeTruthy()
  })

  it("stays local without a shell Toaster", async () => {
    render(<RemoteApp />)

    act(() => {
      remote.toast.add({ title: "Standalone" })
    })
    await screen.findByText("Standalone")
  })

  it("elects a shell Toaster that sits inside a ThemeRoot", async () => {
    render(
      <>
        <ThemeRoot>
          <Toaster />
        </ThemeRoot>
        <RemoteApp />
      </>
    )

    act(() => {
      shellToast.add({ title: "Shell toast" })
      remote.toast.add({ title: "Remote toast" })
    })
    await screen.findByText("Remote toast")
    expect(viewportOf("Remote toast")).toBe(viewportOf("Shell toast"))
  })

  it("elects the shell's Toaster over a remote's outside a ThemeRoot", async () => {
    render(
      <>
        <Toaster />
        <remote.Toaster />
      </>
    )

    act(() => {
      shellToast.add({ title: "Shell toast" })
      remote.toast.add({ title: "Remote toast" })
    })
    await screen.findByText("Remote toast")
    expect(viewportOf("Remote toast")).toBe(viewportOf("Shell toast"))
  })

  it("falls back to the remote's own Toaster once the shell's unmounts", async () => {
    const shell = render(<Toaster />)
    render(<RemoteApp />)

    let id = ""
    act(() => {
      id = remote.toast.add({ title: "Handed over" })
    })
    await screen.findByText("Handed over")

    shell.unmount()
    expect(() => {
      remote.toast.update(id, { title: "Lost" })
      remote.toast.close(id)
    }).not.toThrow()

    act(() => {
      remote.toast.add({ title: "Back home" })
    })
    await screen.findByText("Back home")
  })

  it("publishes only Toasters of the module's own queue, until they unmount", () => {
    const custom = render(<Toaster toastManager={createToastManager()} />)
    expect(publishedHosts()).toHaveLength(0)
    custom.unmount()

    const inside = render(
      <ThemeRoot>
        <Toaster />
      </ThemeRoot>
    )
    expect(publishedHosts().map((host) => host.root)).toEqual([false])
    inside.unmount()

    const outside = render(<Toaster />)
    expect(publishedHosts().map((host) => host.root)).toEqual([true])
    outside.unmount()
    expect(publishedHosts()).toHaveLength(0)
  })
})

describe("bridgeToast with a host of another React", () => {
  let accepts: ToastHostV1["accepts"]

  beforeAll(() => {
    // The real check a host of another React applies.
    const shell = render(<Toaster />)
    accepts = publishedHosts()[0].accepts
    shell.unmount()
  })

  function fakeManager() {
    return {
      add: vi.fn((_options: unknown) => "local"),
      update: vi.fn(),
      close: vi.fn(),
      promise: vi.fn(async () => undefined),
      " subscribe": vi.fn(),
    }
  }

  function publish(host: Omit<ToastHostV1, "protocol"> & { protocol: number }) {
    const list = (store[TOAST_HOSTS_KEY] ??= []) as unknown[]
    list.push(host)
    return () => list.splice(list.indexOf(host), 1)
  }

  function foreignHost() {
    return {
      protocol: 1 as const,
      owner: Symbol("other copy"),
      root: true,
      react: () => null,
      accepts,
      add: vi.fn((options: { id?: string }) => options.id ?? "hosted"),
      update: vi.fn(),
      close: vi.fn(),
      promise: vi.fn(async () => undefined),
    }
  }

  function Fancy() {
    return null
  }

  it("forwards text and DOM elements, keeps components local", () => {
    const host = foreignHost()
    const unpublish = publish(host)
    const toast = bridgeToast(fakeManager())

    expect(toast.add({ title: "Text" })).not.toBe("local")
    expect(toast.add({ title: <b>Bold</b> })).not.toBe("local")
    expect(toast.add({ title: <Fancy /> })).toBe("local")
    expect(
      toast.add({
        title: (
          <b>
            <Fancy />
          </b>
        ),
      })
    ).toBe("local")
    expect(host.add).toHaveBeenCalledTimes(2)
    unpublish()
  })

  it("keeps anchored toasts local", () => {
    const unpublish = publish(foreignHost())
    const toast = bridgeToast(fakeManager())

    expect(
      toast.add({ title: "Copied", positionerProps: { anchor: null } })
    ).toBe("local")
    unpublish()
  })

  it("clears content the host cannot render from updates", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const host = foreignHost()
    const unpublish = publish(host)
    const toast = bridgeToast(fakeManager())

    const id = toast.add({ title: "Text" })
    toast.update(id, { title: <Fancy />, description: "Done" })
    expect(host.update).toHaveBeenCalledWith(id, {
      title: undefined,
      description: "Done",
    })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    unpublish()
  })

  it("ignores hosts of an unknown protocol", () => {
    const host = { ...foreignHost(), protocol: 2 }
    const unpublish = publish(host)
    const toast = bridgeToast(fakeManager())

    expect(toast.add({ title: "Text" })).toBe("local")
    expect(host.add).not.toHaveBeenCalled()
    unpublish()
  })

  it("routes only the manager's own methods", () => {
    const local = fakeManager()
    const toast = bridgeToast(local)
    expect(toast[" subscribe"]).toBe(local[" subscribe"])
    expect(toast.toString).toBe(local.toString)
  })
})
