import * as React from "react"
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest"

import {
  createShortcutRegistry,
  formatShortcut,
  ShortcutKeys,
  ShortcutsProvider,
  useShortcut,
  useShortcutRegistry,
  useShortcuts,
  type Shortcut,
  type ShortcutRegistry,
} from "@tecton/react/tecton/shortcuts"

function key(
  init: Partial<KeyboardEventInit> & { key: string },
  target: EventTarget = document.body
) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  })
  Object.defineProperty(event, "target", { value: target })
  return event
}

function shortcut(
  overrides: Partial<Shortcut> & { id: string; keys: string }
): Shortcut {
  return { label: overrides.id, onAction: vi.fn(), ...overrides }
}

describe("createShortcutRegistry", () => {
  let registry: ShortcutRegistry

  beforeEach(() => {
    registry = createShortcutRegistry()
  })

  it("registers shortcuts in order and unregisters them", () => {
    const a = shortcut({ id: "a", keys: "a" })
    const b = shortcut({ id: "b", keys: "b" })
    const remove = registry.register([a, b])
    expect(registry.getAll()).toEqual([a, b])
    remove()
    expect(registry.getAll()).toEqual([])
  })

  it("replaces a shortcut registered with the same id", () => {
    const first = shortcut({ id: "x", keys: "a" })
    const second = shortcut({ id: "x", keys: "b" })
    registry.register(first)
    const removeSecond = registry.register(second)
    expect(registry.getAll()).toEqual([second])
    // Removing the stale registration does not remove the newer one.
    registry.unregister("nope")
    removeSecond()
    expect(registry.getAll()).toEqual([])
  })

  it("does not remove a replacement when the earlier registration is removed", () => {
    const first = shortcut({ id: "x", keys: "a" })
    const removeFirst = registry.register(first)
    const second = shortcut({ id: "x", keys: "b" })
    registry.register(second)
    removeFirst()
    expect(registry.getAll()).toEqual([second])
  })

  it("notifies subscribers on changes", () => {
    const listener = vi.fn()
    const unsubscribe = registry.subscribe(listener)
    registry.register(shortcut({ id: "a", keys: "a" }))
    expect(listener).toHaveBeenCalledTimes(1)
    registry.unregister("a")
    expect(listener).toHaveBeenCalledTimes(2)
    registry.unregister("a")
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    registry.register(shortcut({ id: "b", keys: "b" }))
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("handles a single key and prevents its default", () => {
    const s = shortcut({ id: "help", keys: "?" })
    registry.register(s)
    const event = key({ key: "?", shiftKey: true })
    expect(registry.handleKeyDown(event)).toBe(true)
    expect(s.onAction).toHaveBeenCalledWith(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it("matches symbol keys with or without shift", () => {
    const s = shortcut({ id: "slash", keys: "/" })
    registry.register(s)
    expect(registry.handleKeyDown(key({ key: "/" }))).toBe(true)
    expect(registry.handleKeyDown(key({ key: "/", shiftKey: true }))).toBe(true)
    expect(s.onAction).toHaveBeenCalledTimes(2)
  })

  it("requires shift for letter chords", () => {
    const s = shortcut({ id: "s", keys: "shift+a" })
    registry.register(s)
    expect(registry.handleKeyDown(key({ key: "a" }))).toBe(false)
    expect(registry.handleKeyDown(key({ key: "A", shiftKey: true }))).toBe(true)
  })

  it("maps mod to ctrl on non-mac platforms", () => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Win32")
    const reg = createShortcutRegistry()
    const s = shortcut({ id: "k", keys: "mod+k" })
    reg.register(s)
    expect(reg.handleKeyDown(key({ key: "k", metaKey: true }))).toBe(false)
    expect(reg.handleKeyDown(key({ key: "k", ctrlKey: true }))).toBe(true)
  })

  it("maps mod to meta on mac", () => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("MacIntel")
    const reg = createShortcutRegistry()
    const s = shortcut({ id: "k", keys: "mod+k" })
    reg.register(s)
    expect(reg.handleKeyDown(key({ key: "k", ctrlKey: true }))).toBe(false)
    expect(reg.handleKeyDown(key({ key: "k", metaKey: true }))).toBe(true)
  })

  it("understands key aliases", () => {
    const esc = shortcut({ id: "esc", keys: "esc" })
    const enter = shortcut({ id: "enter", keys: "alt+return" })
    const up = shortcut({ id: "up", keys: "up" })
    const space = shortcut({ id: "space", keys: "space" })
    registry.register([esc, enter, up, space])
    expect(registry.handleKeyDown(key({ key: "Escape" }))).toBe(true)
    expect(registry.handleKeyDown(key({ key: "Enter", altKey: true }))).toBe(
      true
    )
    expect(registry.handleKeyDown(key({ key: "ArrowUp" }))).toBe(true)
    expect(registry.handleKeyDown(key({ key: " " }))).toBe(true)
  })

  it("ignores bare modifier presses and already handled events", () => {
    const s = shortcut({ id: "a", keys: "a" })
    registry.register(s)
    expect(registry.handleKeyDown(key({ key: "Shift" }))).toBe(false)
    const handled = key({ key: "a" })
    handled.preventDefault()
    expect(registry.handleKeyDown(handled)).toBe(false)
    expect(s.onAction).not.toHaveBeenCalled()
  })

  it("returns false for unregistered keys", () => {
    registry.register(shortcut({ id: "a", keys: "a" }))
    const event = key({ key: "z" })
    expect(registry.handleKeyDown(event)).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })

  it("gives the latest registration precedence on a conflict", () => {
    const first = shortcut({ id: "first", keys: "a" })
    const second = shortcut({ id: "second", keys: "a" })
    registry.register(first)
    registry.register(second)
    registry.handleKeyDown(key({ key: "a" }))
    expect(second.onAction).toHaveBeenCalled()
    expect(first.onAction).not.toHaveBeenCalled()
  })

  it("skips a disabled shortcut and falls through to an older one", () => {
    const first = shortcut({ id: "first", keys: "a" })
    const second = shortcut({ id: "second", keys: "a", isEnabled: () => false })
    registry.register(first)
    registry.register(second)
    expect(registry.handleKeyDown(key({ key: "a" }))).toBe(true)
    expect(first.onAction).toHaveBeenCalled()
    expect(second.onAction).not.toHaveBeenCalled()
  })

  it("ignores a keydown with no key, as Chrome's autofill sends", () => {
    registry.register(shortcut({ id: "a", keys: "a" }))
    expect(() =>
      registry.handleKeyDown(new Event("keydown") as KeyboardEvent)
    ).not.toThrow()
    expect(registry.handleKeyDown(new Event("keydown") as KeyboardEvent)).toBe(
      false
    )
    expect(registry.handleKeyDown(key({ key: "" }))).toBe(false)
  })

  it("matches an Option chord on a Mac by the physical key", () => {
    const s = shortcut({ id: "k", keys: "alt+k" })
    registry.register(s)
    // Option+K types "˚" on a Mac.
    expect(
      registry.handleKeyDown(key({ key: "˚", code: "KeyK", altKey: true }))
    ).toBe(true)
    expect(s.onAction).toHaveBeenCalledTimes(1)
    // Elsewhere Alt+K is still "k".
    expect(
      registry.handleKeyDown(key({ key: "k", code: "KeyK", altKey: true }))
    ).toBe(true)
    expect(s.onAction).toHaveBeenCalledTimes(2)
  })

  it("matches shift with a digit by the physical key", () => {
    const s = shortcut({ id: "one", keys: "shift+1" })
    const bang = shortcut({ id: "bang", keys: "!" })
    registry.register(s)
    expect(
      registry.handleKeyDown(key({ key: "!", code: "Digit1", shiftKey: true }))
    ).toBe(true)
    expect(s.onAction).toHaveBeenCalledTimes(1)
    // A symbol shortcut still matches by the character typed.
    registry.register(bang)
    registry.handleKeyDown(key({ key: "!", code: "Digit1", shiftKey: true }))
    expect(bang.onAction).toHaveBeenCalledTimes(1)
  })

  it("matches by the character typed on another Latin layout", () => {
    const z = shortcut({ id: "z", keys: "ctrl+z" })
    registry.register(z)
    // German QWERTZ: the key in QWERTY's Y place types "z".
    expect(
      registry.handleKeyDown(key({ key: "z", code: "KeyY", ctrlKey: true }))
    ).toBe(true)
    expect(
      registry.handleKeyDown(key({ key: "y", code: "KeyZ", ctrlKey: true }))
    ).toBe(false)
  })

  it("fires once for a held key and swallows the repeats, unless allowRepeat", () => {
    const toggle = shortcut({ id: "t", keys: "t" })
    const zoom = shortcut({ id: "z", keys: "z", allowRepeat: true })
    registry.register([toggle, zoom])
    expect(registry.handleKeyDown(key({ key: "t" }))).toBe(true)
    const repeat = key({ key: "t", repeat: true })
    expect(registry.handleKeyDown(repeat)).toBe(true)
    expect(repeat.defaultPrevented).toBe(true)
    expect(toggle.onAction).toHaveBeenCalledTimes(1)

    registry.handleKeyDown(key({ key: "z" }))
    registry.handleKeyDown(key({ key: "z", repeat: true }))
    expect(zoom.onAction).toHaveBeenCalledTimes(2)
  })

  it("parses the keys once, when the shortcut is registered", () => {
    let reads = 0
    const s = shortcut({ id: "a", keys: "a" })
    Object.defineProperty(s, "keys", {
      get: () => {
        reads += 1
        return "a"
      },
    })
    registry.register(s)
    const afterRegister = reads
    registry.handleKeyDown(key({ key: "a" }))
    registry.handleKeyDown(key({ key: "b" }))
    expect(reads).toBe(afterRegister)
    expect(s.onAction).toHaveBeenCalledTimes(1)
  })

  describe("in editable targets", () => {
    const input = document.createElement("input")
    const textarea = document.createElement("textarea")
    const select = document.createElement("select")
    const editable = document.createElement("div")
    Object.defineProperty(editable, "isContentEditable", { value: true })

    it.each([input, textarea, select, editable])(
      "does not fire plain keys (%o)",
      (target) => {
        const s = shortcut({ id: "a", keys: "a" })
        registry.register(s)
        expect(registry.handleKeyDown(key({ key: "a" }, target))).toBe(false)
        expect(s.onAction).not.toHaveBeenCalled()
      }
    )

    it("fires modified chords by default", () => {
      const s = shortcut({ id: "k", keys: "ctrl+k" })
      registry.register(s)
      expect(
        registry.handleKeyDown(key({ key: "k", ctrlKey: true }, input))
      ).toBe(true)
    })

    it("does not fire shift-only chords by default", () => {
      const s = shortcut({ id: "k", keys: "shift+k" })
      registry.register(s)
      expect(
        registry.handleKeyDown(key({ key: "K", shiftKey: true }, input))
      ).toBe(false)
    })

    it("sees an input inside a shadow root through the event's path", () => {
      const host = document.createElement("div")
      document.body.append(host)
      const field = host
        .attachShadow({ mode: "open" })
        .appendChild(document.createElement("input"))
      const s = shortcut({ id: "a", keys: "a" })
      registry.register(s)
      document.addEventListener(
        "keydown",
        (event) => registry.handleKeyDown(event),
        { once: true }
      )
      field.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "a",
          bubbles: true,
          composed: true,
        })
      )
      expect(s.onAction).not.toHaveBeenCalled()
      host.remove()
    })

    it("honours allowInInput either way", () => {
      const plain = shortcut({ id: "a", keys: "a", allowInInput: true })
      const chord = shortcut({ id: "k", keys: "ctrl+k", allowInInput: false })
      registry.register([plain, chord])
      expect(registry.handleKeyDown(key({ key: "a" }, input))).toBe(true)
      expect(
        registry.handleKeyDown(key({ key: "k", ctrlKey: true }, input))
      ).toBe(false)
    })
  })

  describe("sequences", () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it("fires after the full sequence and swallows the prefix", () => {
      const s = shortcut({ id: "gw", keys: "g w" })
      registry.register(s)
      const g = key({ key: "g" })
      expect(registry.handleKeyDown(g)).toBe(true)
      expect(g.defaultPrevented).toBe(true)
      expect(s.onAction).not.toHaveBeenCalled()
      expect(registry.handleKeyDown(key({ key: "w" }))).toBe(true)
      expect(s.onAction).toHaveBeenCalledTimes(1)
    })

    it("abandons the sequence on a wrong key", () => {
      const s = shortcut({ id: "gw", keys: "g w" })
      registry.register(s)
      registry.handleKeyDown(key({ key: "g" }))
      expect(registry.handleKeyDown(key({ key: "x" }))).toBe(false)
      expect(registry.handleKeyDown(key({ key: "w" }))).toBe(false)
      expect(s.onAction).not.toHaveBeenCalled()
    })

    it("restarts from the last key when it begins another sequence", () => {
      const gw = shortcut({ id: "gw", keys: "g w" })
      registry.register(gw)
      registry.handleKeyDown(key({ key: "g" }))
      // "g g" is not a sequence, but the second "g" starts a new one.
      expect(registry.handleKeyDown(key({ key: "g" }))).toBe(true)
      expect(registry.handleKeyDown(key({ key: "w" }))).toBe(true)
      expect(gw.onAction).toHaveBeenCalledTimes(1)
    })

    it("times out a pending sequence", () => {
      vi.useFakeTimers()
      const s = shortcut({ id: "gw", keys: "g w" })
      registry.register(s)
      registry.handleKeyDown(key({ key: "g" }))
      vi.advanceTimersByTime(1001)
      expect(registry.handleKeyDown(key({ key: "w" }))).toBe(false)
      expect(s.onAction).not.toHaveBeenCalled()
    })

    it("a single key shortcut still fires while a longer sequence is pending", () => {
      const gw = shortcut({ id: "gw", keys: "g w" })
      const g = shortcut({ id: "g", keys: "g" })
      registry.register([gw, g])
      // The newest registration wins: "g" alone is a complete match.
      expect(registry.handleKeyDown(key({ key: "g" }))).toBe(true)
      expect(g.onAction).toHaveBeenCalledTimes(1)
    })
  })
})

// The registry is the contract between the shell and the applications it
// mounts, which may ship a different @tecton/react version: renaming a method
// or changing a signature breaks them silently, so both are pinned here.
describe("registry contract", () => {
  it("pins the public shape of ShortcutRegistry", () => {
    expectTypeOf<keyof ShortcutRegistry>().toEqualTypeOf<
      "register" | "unregister" | "getAll" | "subscribe" | "handleKeyDown"
    >()
    expectTypeOf<ShortcutRegistry["register"]>().toEqualTypeOf<
      (shortcut: Shortcut | Shortcut[]) => () => void
    >()
    expectTypeOf<ShortcutRegistry["unregister"]>().toEqualTypeOf<
      (id: string) => void
    >()
    expectTypeOf<ShortcutRegistry["getAll"]>().toEqualTypeOf<() => Shortcut[]>()
    expectTypeOf<ShortcutRegistry["subscribe"]>().toEqualTypeOf<
      (listener: () => void) => () => void
    >()
    expectTypeOf<ShortcutRegistry["handleKeyDown"]>().toEqualTypeOf<
      (event: KeyboardEvent) => boolean
    >()
    expectTypeOf(createShortcutRegistry).toEqualTypeOf<() => ShortcutRegistry>()
    // `register` is only as stable as the shortcut it takes. A field is
    // only ever added, optional: an older registry ignores it.
    expectTypeOf<keyof Shortcut>().toEqualTypeOf<
      | "id"
      | "keys"
      | "label"
      | "group"
      | "onAction"
      | "allowInInput"
      | "isEnabled"
      | "hidden"
      | "allowRepeat"
    >()
  })

  it("registers, lists, dispatches and unregisters without React", () => {
    const registry = createShortcutRegistry()
    const listener = vi.fn()
    const unsubscribe = registry.subscribe(listener)

    const save = shortcut({ id: "save", keys: "ctrl+s" })
    const remove = registry.register(save)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(registry.getAll()).toEqual([save])

    const event = key({ key: "s", ctrlKey: true })
    expect(registry.handleKeyDown(event)).toBe(true)
    expect(save.onAction).toHaveBeenCalledWith(event)

    registry.unregister("save")
    expect(registry.getAll()).toEqual([])
    expect(registry.handleKeyDown(key({ key: "s", ctrlKey: true }))).toBe(false)
    expect(save.onAction).toHaveBeenCalledTimes(1)

    // The disposer stays safe once the shortcut is already gone.
    remove()
    expect(registry.getAll()).toEqual([])
    unsubscribe()
  })
})

describe("formatShortcut", () => {
  it("formats chords for Windows", () => {
    expect(formatShortcut("mod+k", false)).toEqual([["Ctrl", "K"]])
    expect(formatShortcut("ctrl+alt+shift+meta+p", false)).toEqual([
      ["Ctrl", "Alt", "Shift", "Win", "P"],
    ])
  })

  it("formats chords for macOS", () => {
    expect(formatShortcut("mod+k", true)).toEqual([["⌘", "K"]])
    expect(formatShortcut("ctrl+alt+shift+p", true)).toEqual([
      ["⌃", "⌥", "⇧", "P"],
    ])
  })

  it("formats sequences as one array per chord", () => {
    expect(formatShortcut("g w", false)).toEqual([["G"], ["W"]])
  })

  it("uses readable labels for special keys", () => {
    expect(formatShortcut("esc", false)).toEqual([["Esc"]])
    expect(formatShortcut("enter", false)).toEqual([["↵"]])
    expect(formatShortcut("space", false)).toEqual([["Space"]])
    expect(formatShortcut("up down left right", false)).toEqual([
      ["↑"],
      ["↓"],
      ["←"],
      ["→"],
    ])
    expect(formatShortcut("backspace", false)).toEqual([["⌫"]])
    expect(formatShortcut("tab", false)).toEqual([["⇥"]])
    expect(formatShortcut("?", false)).toEqual([["?"]])
  })

  it("treats a trailing plus as the plus key", () => {
    expect(formatShortcut("ctrl++", false)).toEqual([["Ctrl", "+"]])
    expect(formatShortcut("ctrl+plus", false)).toEqual([["Ctrl", "+"]])
  })
})

describe("ShortcutKeys", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Win32")
  })

  it("renders key caps joined with plus, and the keys as text for screen readers", () => {
    const { container } = render(<ShortcutKeys keys="mod+k" className="x" />)
    const root = container.querySelector('[data-slot="shortcut-keys"]')
    expect(root).toHaveClass("x", "inline-flex")
    const kbds = root!.querySelectorAll("kbd[data-slot='kbd']")
    expect(Array.from(kbds).map((k) => k.textContent)).toEqual(["Ctrl", "K"])
    const group = root!.querySelector('[data-slot="kbd-group"]')
    expect(group).toHaveAttribute("aria-hidden", "true")
    expect(group).toHaveTextContent("Ctrl+K")
    // Browse mode reads text, not the aria-label of a generic span.
    expect(root).not.toHaveAttribute("aria-label")
    expect(root!.querySelector(".sr-only")).toHaveTextContent("Ctrl + K")
    expect(screen.getByText("Ctrl + K")).toBeInTheDocument()
  })

  it("spells a sequence out, and shows its steps apart from a chord", () => {
    const { container } = render(<ShortcutKeys keys="g w" />)
    const root = container.querySelector('[data-slot="shortcut-keys"]')
    expect(root!.querySelector(".sr-only")).toHaveTextContent("G, then W")
    // "then" between steps, where a chord has "+".
    expect(root!.querySelector('[data-slot="kbd-group"]')).toHaveTextContent(
      "GthenW"
    )
    expect(
      root!.querySelectorAll('[data-slot="shortcut-keys-then"]')
    ).toHaveLength(1)
  })

  it("joins the keys of each chord in a sequence with plus", () => {
    const { container } = render(<ShortcutKeys keys="mod+k mod+s" />)
    const root = container.querySelector('[data-slot="shortcut-keys"]')
    expect(root!.querySelector('[data-slot="kbd-group"]')).toHaveTextContent(
      "Ctrl+KthenCtrl+S"
    )
    expect(root!.querySelector(".sr-only")).toHaveTextContent(
      "Ctrl + K, then Ctrl + S"
    )
  })
})

describe("ShortcutsProvider and hooks", () => {
  it("throws when the registry is used outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useShortcutRegistry())).toThrow(
      /useShortcutRegistry must be used within a ShortcutsProvider/
    )
    spy.mockRestore()
  })

  it("listens on the document and dispatches to the registry", () => {
    const onAction = vi.fn()
    function App() {
      useShortcut({ id: "save", keys: "ctrl+s", label: "Save", onAction })
      return <input aria-label="name" />
    }
    render(
      <ShortcutsProvider>
        <App />
      </ShortcutsProvider>
    )
    fireEvent.keyDown(document.body, { key: "s", ctrlKey: true })
    expect(onAction).toHaveBeenCalledTimes(1)
    // Modified chords fire inside inputs too.
    fireEvent.keyDown(screen.getByLabelText("name"), {
      key: "s",
      ctrlKey: true,
    })
    expect(onAction).toHaveBeenCalledTimes(2)
  })

  it("uses the registry it is given and stops listening on unmount", () => {
    const registry = createShortcutRegistry()
    const onAction = vi.fn()
    registry.register({ id: "a", keys: "a", label: "A", onAction })
    const { unmount } = render(
      <ShortcutsProvider registry={registry}>x</ShortcutsProvider>
    )
    fireEvent.keyDown(document.body, { key: "a" })
    expect(onAction).toHaveBeenCalledTimes(1)
    unmount()
    fireEvent.keyDown(document.body, { key: "a" })
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("listens on a custom target and on nothing when the target is null", () => {
    const registry = createShortcutRegistry()
    const onAction = vi.fn()
    registry.register({ id: "a", keys: "a", label: "A", onAction })
    const target = document.createElement("div")
    document.body.append(target)
    const { rerender } = render(
      <ShortcutsProvider registry={registry} target={target}>
        x
      </ShortcutsProvider>
    )
    fireEvent.keyDown(document.body, { key: "a" })
    expect(onAction).not.toHaveBeenCalled()
    fireEvent.keyDown(target, { key: "a" })
    expect(onAction).toHaveBeenCalledTimes(1)

    rerender(
      <ShortcutsProvider registry={registry} target={null}>
        x
      </ShortcutsProvider>
    )
    fireEvent.keyDown(target, { key: "a" })
    expect(onAction).toHaveBeenCalledTimes(1)
    target.remove()
  })

  it("a nested provider shares the parent's registry and does not double-dispatch", () => {
    const registry = createShortcutRegistry()
    const onAction = vi.fn()
    registry.register({ id: "a", keys: "a", label: "A", onAction })
    let inner: ShortcutRegistry | null = null
    function Probe() {
      inner = useShortcutRegistry()
      return null
    }
    render(
      <ShortcutsProvider registry={registry}>
        <ShortcutsProvider>
          <Probe />
        </ShortcutsProvider>
      </ShortcutsProvider>
    )
    expect(inner).toBe(registry)
    fireEvent.keyDown(document.body, { key: "a" })
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("a nested provider with a target of its own listens there, with a registry of its own", () => {
    const outer = createShortcutRegistry()
    const onAction = vi.fn()
    const target = document.createElement("div")
    document.body.append(target)
    let inner: ShortcutRegistry | null = null
    function Scoped() {
      inner = useShortcutRegistry()
      useShortcut({ id: "a", keys: "a", label: "A", onAction })
      return null
    }
    render(
      <ShortcutsProvider registry={outer}>
        <ShortcutsProvider target={target}>
          <Scoped />
        </ShortcutsProvider>
      </ShortcutsProvider>
    )
    expect(inner).not.toBe(outer)
    expect(outer.getAll()).toEqual([])
    fireEvent.keyDown(document.body, { key: "a" })
    expect(onAction).not.toHaveBeenCalled()
    fireEvent.keyDown(target, { key: "a" })
    expect(onAction).toHaveBeenCalledTimes(1)
    target.remove()
  })

  it("useShortcuts re-renders as shortcuts register and unregister", () => {
    const registry = createShortcutRegistry()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ShortcutsProvider registry={registry}>{children}</ShortcutsProvider>
    )
    const { result } = renderHook(() => useShortcuts(), { wrapper })
    expect(result.current).toEqual([])
    let remove!: () => void
    act(() => {
      remove = registry.register({
        id: "a",
        keys: "a",
        label: "A",
        onAction: () => {},
      })
    })
    expect(result.current.map((s) => s.id)).toEqual(["a"])
    act(() => remove())
    expect(result.current).toEqual([])
  })

  it("useShortcut keeps the committed handler when a render is thrown away", () => {
    const registry = createShortcutRegistry()
    const committed = vi.fn()
    const discarded = vi.fn()
    const never = new Promise<void>(() => {})
    function Suspend({ when }: { when: boolean }) {
      if (when) React.use(never)
      return null
    }
    function App({
      onAction,
      suspend,
    }: {
      onAction: () => void
      suspend: boolean
    }) {
      useShortcut({ id: "go", keys: "g", label: "Go", onAction })
      return <Suspend when={suspend} />
    }
    const tree = (onAction: () => void, suspend: boolean) => (
      <ShortcutsProvider registry={registry}>
        <React.Suspense fallback={null}>
          <App onAction={onAction} suspend={suspend} />
        </React.Suspense>
      </ShortcutsProvider>
    )
    const { rerender } = render(tree(committed, false))
    // A transition that suspends is never committed: the old UI stays.
    act(() => {
      React.startTransition(() => rerender(tree(discarded, true)))
    })
    registry.handleKeyDown(key({ key: "g" }))
    expect(committed).toHaveBeenCalledTimes(1)
    expect(discarded).not.toHaveBeenCalled()
  })

  it("useShortcut registers for the component's lifetime with the latest handler", () => {
    const registry = createShortcutRegistry()
    const first = vi.fn()
    const second = vi.fn()
    function App({
      onAction,
      enabled,
    }: {
      onAction: () => void
      enabled: boolean
    }) {
      useShortcut({
        id: "go",
        keys: "g",
        label: "Go",
        group: "Nav",
        hidden: true,
        onAction,
        isEnabled: () => enabled,
      })
      return null
    }
    const { rerender, unmount } = render(
      <ShortcutsProvider registry={registry}>
        <App onAction={first} enabled />
      </ShortcutsProvider>
    )
    const [registered] = registry.getAll()
    expect(registered).toMatchObject({
      id: "go",
      keys: "g",
      label: "Go",
      group: "Nav",
      hidden: true,
    })

    registry.handleKeyDown(key({ key: "g" }))
    expect(first).toHaveBeenCalledTimes(1)

    // A new handler is picked up without re-registering.
    rerender(
      <ShortcutsProvider registry={registry}>
        <App onAction={second} enabled />
      </ShortcutsProvider>
    )
    expect(registry.getAll()[0]).toBe(registered)
    registry.handleKeyDown(key({ key: "g" }))
    expect(second).toHaveBeenCalledTimes(1)
    expect(first).toHaveBeenCalledTimes(1)

    // isEnabled is read live as well.
    rerender(
      <ShortcutsProvider registry={registry}>
        <App onAction={second} enabled={false} />
      </ShortcutsProvider>
    )
    expect(registry.handleKeyDown(key({ key: "g" }))).toBe(false)
    expect(second).toHaveBeenCalledTimes(1)

    unmount()
    expect(registry.getAll()).toEqual([])
  })
})
