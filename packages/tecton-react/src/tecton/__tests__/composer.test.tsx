import * as React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Composer,
  ComposerAttachments,
  ComposerCommands,
  ComposerField,
  ComposerHint,
  ComposerInput,
  ComposerStatusMessage,
  ComposerSubmit,
  ComposerSuggestion,
  ComposerSuggestions,
  ComposerToolbar,
  type ComposerAttachmentItem,
  type ComposerCommandItem,
  type ComposerProps,
} from "@tecton/react/tecton/composer"

function Chat(
  props: Partial<ComposerProps> & { attachments?: ComposerAttachmentItem[] }
) {
  const { attachments, ...rest } = props
  const [items, setItems] = React.useState(attachments ?? [])
  return (
    <Composer onSubmit={() => {}} {...rest}>
      <ComposerSuggestions>
        <ComposerSuggestion value="Summarise the shift" />
        <ComposerSuggestion value="Open alerts" submit />
      </ComposerSuggestions>
      <ComposerField>
        <ComposerAttachments
          items={items}
          onRemove={(id) =>
            setItems((current) => current.filter((item) => item.id !== id))
          }
        />
        <ComposerInput placeholder="Ask anything" />
        <ComposerToolbar>
          <ComposerSubmit />
        </ComposerToolbar>
      </ComposerField>
      <ComposerHint />
      <ComposerStatusMessage />
    </Composer>
  )
}

const textbox = () =>
  screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Message" })

describe("Composer", () => {
  it("sends the trimmed text on Enter, clears the box and keeps focus in it", async () => {
    const onSubmit = vi.fn()
    render(<Chat onSubmit={onSubmit} />)

    await userEvent.type(textbox(), "  Hello there  {Enter}")

    expect(onSubmit).toHaveBeenCalledWith({ text: "Hello there" })
    expect(textbox()).toHaveValue("")
    expect(textbox()).toHaveFocus()
  })

  it("makes Shift+Enter a new line, and ⌘/Ctrl+Enter always sends", async () => {
    const onSubmit = vi.fn()
    render(<Chat onSubmit={onSubmit} submitMode="mod-enter" />)

    await userEvent.type(textbox(), "one{Shift>}{Enter}{/Shift}two{Enter}three")
    expect(onSubmit).not.toHaveBeenCalled()
    expect(textbox()).toHaveValue("one\ntwo\nthree")

    await userEvent.keyboard("{Control>}{Enter}{/Control}")
    expect(onSubmit).toHaveBeenCalledWith({ text: "one\ntwo\nthree" })
  })

  it("never sends the Enter that confirms an IME composition", () => {
    const onSubmit = vi.fn()
    render(<Chat onSubmit={onSubmit} defaultValue="日本" />)

    fireEvent.keyDown(textbox(), { key: "Enter", keyCode: 229 })
    fireEvent.keyDown(textbox(), { key: "Enter", isComposing: true })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("keeps Send in the tab order, aria-disabled, while the box is empty", async () => {
    const onSubmit = vi.fn()
    render(<Chat onSubmit={onSubmit} />)
    const send = screen.getByRole("button", { name: "Send message" })

    expect(send).toHaveAttribute("aria-disabled", "true")
    expect(send).not.toBeDisabled()
    await userEvent.click(send)
    expect(onSubmit).not.toHaveBeenCalled()

    await userEvent.type(textbox(), "Go")
    expect(send).not.toHaveAttribute("aria-disabled")
  })

  it("keeps the textarea usable while a reply streams, but does not send", async () => {
    const onSubmit = vi.fn()
    render(<Chat onSubmit={onSubmit} status="streaming" onStop={() => {}} />)

    await userEvent.type(textbox(), "Next question{Enter}")

    expect(textbox()).not.toBeDisabled()
    expect(textbox()).toHaveValue("Next question")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("swaps Send for Stop while busy, and Escape stops too", async () => {
    const onStop = vi.fn()
    const { rerender } = render(<Chat status="ready" onStop={onStop} />)
    expect(screen.queryByRole("button", { name: "Stop generating" })).toBeNull()

    rerender(<Chat status="streaming" onStop={onStop} />)
    await userEvent.click(
      screen.getByRole("button", { name: "Stop generating" })
    )
    expect(onStop).toHaveBeenCalledTimes(1)

    textbox().focus()
    await userEvent.keyboard("{Escape}")
    expect(onStop).toHaveBeenCalledTimes(2)
    expect(screen.getByRole("status")).toHaveTextContent("Stopped.")
  })

  it("moves focus to Stop, a button of its own, when the Send it was on is replaced", () => {
    const { rerender } = render(<Chat defaultValue="Hi" onStop={() => {}} />)
    const send = screen.getByRole("button", { name: "Send message" })
    send.focus()

    rerender(<Chat defaultValue="Hi" status="submitted" onStop={() => {}} />)

    const stop = screen.getByRole("button", { name: "Stop generating" })
    expect(stop).not.toBe(send)
    expect(stop).toHaveFocus()
  })

  it("returns focus to the textarea when the Stop it was on goes", () => {
    const { rerender } = render(<Chat status="streaming" onStop={() => {}} />)
    screen.getByRole("button", { name: "Stop generating" }).focus()

    rerender(<Chat status="ready" onStop={() => {}} />)

    expect(textbox()).toHaveFocus()
  })

  it("forgets the Stop it handed focus from, so a later reply leaves focus alone", () => {
    const { rerender } = render(<Chat status="streaming" onStop={() => {}} />)
    screen.getByRole("button", { name: "Stop generating" }).focus()
    rerender(<Chat status="ready" onStop={() => {}} />)
    expect(textbox()).toHaveFocus()

    rerender(<Chat status="streaming" onStop={() => {}} />)
    textbox().blur()
    rerender(<Chat status="ready" onStop={() => {}} />)

    expect(document.body).toHaveFocus()
  })

  it("focuses the textarea on a press of the toolbar's empty space", async () => {
    render(<Chat />)

    await userEvent.click(
      screen.getByRole("toolbar", { name: "Message actions" })
    )

    expect(textbox()).toHaveFocus()
  })

  it("lets Escape through when no reply is arriving", () => {
    const onStop = vi.fn()
    const onKeyDown = vi.fn()
    render(
      <div onKeyDown={onKeyDown}>
        <Chat onStop={onStop} />
      </div>
    )

    fireEvent.keyDown(textbox(), { key: "Escape" })

    expect(onStop).not.toHaveBeenCalled()
    expect(onKeyDown).toHaveBeenCalled()
  })

  it("steps back through the history with ArrowUp and forward to the draft with ArrowDown", async () => {
    render(<Chat history={["First question", "Second question"]} />)

    await userEvent.type(textbox(), "draft")
    // A browser puts the caret at the start with the first ArrowUp on the
    // first line; jsdom does not move it.
    textbox().setSelectionRange(0, 0)
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("Second question")
    expect(textbox()).toHaveProperty("selectionStart", 15)
    expect(textbox()).toHaveProperty("selectionEnd", 15)

    // A prompt just loaded keeps stepping, the caret at its end.
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("First question")

    // At the oldest the key is let through, to move the caret to the start.
    expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(true)
    expect(textbox()).toHaveValue("First question")

    await userEvent.keyboard("{ArrowDown}")
    expect(textbox()).toHaveValue("Second question")
    await userEvent.keyboard("{ArrowDown}")
    expect(textbox()).toHaveValue("draft")
    expect(textbox()).toHaveProperty("selectionStart", 5)

    expect(fireEvent.keyDown(textbox(), { key: "ArrowDown" })).toBe(true)
    expect(textbox()).toHaveValue("draft")
  })

  it("leaves the arrows to the caret inside a message of several lines", async () => {
    render(<Chat history={["Earlier question"]} />)

    await userEvent.type(textbox(), "line one{Shift>}{Enter}{/Shift}line two")
    expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(true)
    expect(textbox()).toHaveValue("line one\nline two")

    textbox().setSelectionRange(3, 3)
    expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(false)
    expect(textbox()).toHaveValue("Earlier question")

    await userEvent.keyboard("{ArrowDown}")
    expect(textbox()).toHaveValue("line one\nline two")
    textbox().setSelectionRange(3, 3)
    expect(fireEvent.keyDown(textbox(), { key: "ArrowDown" })).toBe(true)
  })

  it("leaves the arrows to the caret inside a line that wraps", () => {
    // jsdom lays nothing out: put the character after the caret on the
    // second line, as a wrapped line would.
    const offsetTop = vi
      .spyOn(HTMLElement.prototype, "offsetTop", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.tagName === "SPAN" && this.textContent !== "" ? 20 : 0
      })
    try {
      render(
        <Chat
          history={["Earlier question"]}
          defaultValue="a long line that wraps"
        />
      )
      textbox().focus()
      textbox().setSelectionRange(12, 12)

      expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(true)
      expect(textbox()).toHaveValue("a long line that wraps")

      // A selection is left alone, even one from the start.
      textbox().setSelectionRange(0, 5)
      expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(true)
      expect(textbox()).toHaveValue("a long line that wraps")

      // At the very start there is nothing left to wrap.
      textbox().setSelectionRange(0, 0)
      expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(false)
      expect(textbox()).toHaveValue("Earlier question")
    } finally {
      offsetTop.mockRestore()
    }
  })

  it("keeps the draft when the user edits a loaded prompt", async () => {
    render(<Chat history={["old"]} />)

    await userEvent.type(textbox(), "long draft")
    textbox().setSelectionRange(0, 0)
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("old")

    await userEvent.keyboard("x")
    expect(textbox()).toHaveValue("oldx")
    // Edited, the prompt no longer steps up from the end: the caret moves.
    expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(true)
    expect(textbox()).toHaveValue("oldx")

    await userEvent.keyboard("{ArrowDown}")
    expect(textbox()).toHaveValue("long draft")
  })

  it("starts over when the box is changed from outside while browsing", async () => {
    render(<Chat history={["One", "Two"]} />)
    textbox().focus()

    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("Two")
    await userEvent.click(
      screen.getByRole("button", { name: "Summarise the shift" })
    )
    expect(textbox()).toHaveValue("Summarise the shift")

    expect(fireEvent.keyDown(textbox(), { key: "ArrowDown" })).toBe(true)
    expect(textbox()).toHaveValue("Summarise the shift")
  })

  it("reaches only the newest historyLimit entries", async () => {
    render(<Chat history={["first", "second", "third"]} historyLimit={2} />)

    await userEvent.click(textbox())
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("third")
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("second")
    // "first" is past the limit: the box stays on the oldest it reaches.
    expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(true)
    expect(textbox()).toHaveValue("second")
  })

  it("has no history to step through with a historyLimit of 0", () => {
    render(<Chat history={["first"]} historyLimit={0} />)
    expect(screen.queryByText(/earlier messages/)).not.toBeInTheDocument()
    expect(fireEvent.keyDown(textbox(), { key: "ArrowUp" })).toBe(true)
    expect(textbox()).toHaveValue("")
  })

  it("shows a run of the same prompt once, and skips blank entries", async () => {
    render(<Chat history={["Alpha", "", "Beta", "Beta", "Beta"]} />)
    textbox().focus()

    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("Beta")
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("Alpha")
    await userEvent.keyboard("{ArrowDown}")
    expect(textbox()).toHaveValue("Beta")
    await userEvent.keyboard("{ArrowDown}")
    expect(textbox()).toHaveValue("")
  })

  it("ends browsing on send, and starts again from the newest", async () => {
    const onSubmit = vi.fn()
    render(<Chat onSubmit={onSubmit} history={["One", "Two"]} />)
    textbox().focus()

    await userEvent.keyboard("{ArrowUp}{ArrowUp}{Enter}")
    expect(onSubmit).toHaveBeenCalledWith({ text: "One" })
    expect(textbox()).toHaveValue("")

    expect(fireEvent.keyDown(textbox(), { key: "ArrowDown" })).toBe(true)
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("Two")
  })

  it("leaves ArrowUp to an IME that is composing, and to modified arrows", () => {
    render(<Chat history={["Earlier question"]} />)

    fireEvent.keyDown(textbox(), { key: "ArrowUp", keyCode: 229 })
    fireEvent.keyDown(textbox(), { key: "ArrowUp", isComposing: true })
    fireEvent.keyDown(textbox(), { key: "ArrowUp", shiftKey: true })
    fireEvent.keyDown(textbox(), { key: "ArrowUp", altKey: true })

    expect(textbox()).toHaveValue("")
  })

  it("mentions the history in the hint only when there is one", () => {
    const { rerender } = render(<Chat history={[]} />)
    expect(textbox()).toHaveAccessibleDescription(
      "Enter to send, Shift+Enter for a new line"
    )

    rerender(<Chat history={["Earlier question"]} />)
    expect(textbox()).toHaveAccessibleDescription(
      "Enter to send, Shift+Enter for a new line, ↑ for earlier messages"
    )
  })

  it("names Ctrl in the mod-enter hint, and ⌘ on an Apple keyboard", () => {
    const { unmount } = render(<Chat submitMode="mod-enter" />)
    expect(textbox()).toHaveAccessibleDescription(
      "Ctrl+Enter to send, Enter for a new line"
    )
    unmount()

    const platform = vi
      .spyOn(navigator, "platform", "get")
      .mockReturnValue("MacIntel")
    render(<Chat submitMode="mod-enter" />)
    expect(textbox()).toHaveAccessibleDescription(
      "⌘+Enter to send, Enter for a new line"
    )
    platform.mockRestore()
  })

  it("sets the height from the text where CSS has no field-sizing", async () => {
    vi.stubGlobal("CSS", { supports: () => false })
    const scrollHeight = vi
      .spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get")
      .mockReturnValue(72)
    render(<Chat />)

    await userEvent.type(textbox(), "one{Shift>}{Enter}{/Shift}two")
    expect(textbox().style.height).toBe("72px")

    scrollHeight.mockRestore()
    vi.unstubAllGlobals()
  })

  it("leaves the height to field-sizing where CSS has it", async () => {
    vi.stubGlobal("CSS", { supports: () => true })
    render(<Chat />)

    await userEvent.type(textbox(), "one")
    expect(textbox().style.height).toBe("")

    vi.unstubAllGlobals()
  })

  it("hands the textarea to a ref of the caller's without losing its own", async () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    const onSubmit = vi.fn()
    render(
      <Composer onSubmit={onSubmit}>
        <ComposerField>
          <ComposerInput ref={ref} />
        </ComposerField>
        <ComposerSuggestions>
          <ComposerSuggestion value="Hello" />
        </ComposerSuggestions>
      </Composer>
    )

    expect(ref.current).toBe(textbox())
    await userEvent.click(screen.getByRole("button", { name: "Hello" }))
    expect(textbox()).toHaveFocus()
  })

  it("hands a function ref the textarea once, not on every keystroke", async () => {
    const ref = vi.fn()
    render(
      <Composer onSubmit={() => {}}>
        <ComposerField>
          <ComposerInput ref={ref} />
        </ComposerField>
      </Composer>
    )

    await userEvent.type(textbox(), "abc")
    expect(ref).toHaveBeenCalledTimes(1)
    expect(ref).toHaveBeenCalledWith(textbox())
  })

  it("keeps the textarea in the field's control slot, which draws the focus ring", () => {
    render(<Chat />)
    expect(textbox()).toHaveAttribute("data-slot", "input-group-control")
  })

  it("describes the textarea with the keyboard hint", () => {
    render(<Chat />)
    expect(textbox()).toHaveAccessibleDescription(
      "Enter to send, Shift+Enter for a new line"
    )
  })

  it("points aria-describedby at nothing when there is no hint", () => {
    render(
      <Composer onSubmit={() => {}}>
        <ComposerField>
          <ComposerInput aria-describedby="own" />
        </ComposerField>
      </Composer>
    )
    expect(textbox()).toHaveAttribute("aria-describedby", "own")
  })

  it("announces a sent message and a failure in its status region", () => {
    const { rerender } = render(<Chat />)
    rerender(<Chat status="submitted" />)
    expect(screen.getByRole("status")).toHaveTextContent("Message sent.")
    rerender(<Chat status="error" />)
    expect(screen.getByRole("status")).toHaveTextContent("The reply failed.")
  })

  it("announces the send when the chat goes straight to streaming", () => {
    const { rerender } = render(<Chat />)
    rerender(<Chat status="streaming" />)
    expect(screen.getByRole("status")).toHaveTextContent("Message sent.")
  })

  it("announces every send and stop, not only the first, with a new node each time", async () => {
    const onStop = vi.fn()
    const { rerender } = render(<Chat onStop={onStop} />)
    const region = screen.getByRole("status")

    rerender(<Chat status="submitted" onStop={onStop} />)
    const firstSend = region.firstChild
    rerender(<Chat status="ready" onStop={onStop} />)
    rerender(<Chat status="submitted" onStop={onStop} />)
    expect(region).toHaveTextContent("Message sent.")
    expect(region.firstChild).not.toBe(firstSend)

    textbox().focus()
    await userEvent.keyboard("{Escape}")
    const firstStop = region.firstChild
    expect(region).toHaveTextContent("Stopped.")
    await userEvent.keyboard("{Escape}")
    expect(onStop).toHaveBeenCalledTimes(2)
    expect(region.firstChild).not.toBe(firstStop)
  })

  it("keeps the Stop spinner out of the accessibility tree: one status region", () => {
    render(<Chat status="submitted" onStop={() => {}} />)
    expect(screen.getAllByRole("status")).toHaveLength(1)
  })

  it("fills the box from a suggestion, or sends it straight away", async () => {
    const onSubmit = vi.fn()
    render(<Chat onSubmit={onSubmit} />)

    await userEvent.click(
      screen.getByRole("button", { name: "Summarise the shift" })
    )
    expect(textbox()).toHaveValue("Summarise the shift")
    expect(textbox()).toHaveFocus()

    await userEvent.click(screen.getByRole("button", { name: "Open alerts" }))
    expect(onSubmit).toHaveBeenCalledWith({ text: "Open alerts" })
  })

  it("hands a suggestion to onSelect instead, leaving the box alone", async () => {
    const onSubmit = vi.fn()
    const onSelect = vi.fn()
    render(
      <Composer onSubmit={onSubmit}>
        <ComposerSuggestions>
          <ComposerSuggestion value="Open alerts" submit onSelect={onSelect} />
        </ComposerSuggestions>
        <ComposerField>
          <ComposerInput />
        </ComposerField>
      </Composer>
    )

    await userEvent.click(screen.getByRole("button", { name: "Open alerts" }))

    expect(onSelect).toHaveBeenCalledWith("Open alerts")
    expect(onSubmit).not.toHaveBeenCalled()
    expect(textbox()).toHaveValue("")
  })

  it("puts the suggestions in one toolbar, moved through with the arrow keys", async () => {
    render(<Chat />)
    const first = screen.getByRole("button", { name: "Summarise the shift" })
    expect(
      screen.getByRole("toolbar", { name: "Suggestions" })
    ).toContainElement(first)

    first.focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(screen.getByRole("button", { name: "Open alerts" })).toHaveFocus()
  })

  it("removes a focused attachment with Delete, and returns focus to the box after the last", async () => {
    render(
      <Chat
        attachments={[
          {
            id: "selection",
            label: "Selected text",
            description: "“A-7 is flaring”",
          },
        ]}
      />
    )
    const chip = screen.getByRole("row", { name: "Selected text" })
    expect(
      screen.getByRole("button", { name: "Remove Selected text" })
    ).toBeInTheDocument()

    chip.focus()
    await userEvent.keyboard("{Delete}")

    expect(screen.queryByRole("row", { name: "Selected text" })).toBeNull()
    expect(textbox()).toHaveFocus()
  })
})

const COMMANDS: ComposerCommandItem[] = [
  {
    id: "new",
    command: "new",
    label: "Start a new conversation",
    group: "Chat",
  },
  {
    id: "ack",
    command: "acknowledge",
    label: "Acknowledge alert",
    group: "Actions",
  },
  {
    id: "note",
    command: "add-note",
    label: "Add a note to the well",
    group: "Actions",
  },
]

function WithCommands({
  onCommand = () => {},
  items = COMMANDS,
  countMessage,
  ...props
}: Partial<ComposerProps> &
  Partial<
    Pick<
      React.ComponentProps<typeof ComposerCommands>,
      "onCommand" | "items" | "countMessage"
    >
  >) {
  return (
    <Composer onSubmit={() => {}} {...props}>
      <ComposerField>
        <ComposerCommands
          items={items}
          onCommand={onCommand}
          countMessage={countMessage}
        />
        <ComposerInput />
        <ComposerToolbar>
          <ComposerSubmit />
        </ComposerToolbar>
      </ComposerField>
      <ComposerHint />
    </Composer>
  )
}

describe("ComposerCommands", () => {
  it("lists the commands for a slash at the start, the textarea pointing at the active one", async () => {
    render(<WithCommands />)

    expect(screen.queryByRole("listbox")).toBeNull()
    await userEvent.type(textbox(), "/")

    const list = screen.getByRole("listbox", { name: "Commands" })
    expect(screen.getAllByRole("option")).toHaveLength(3)
    expect(textbox()).toHaveAttribute("aria-controls", list.id)
    expect(textbox()).toHaveAttribute(
      "aria-activedescendant",
      screen.getAllByRole("option")[0]?.id
    )
    expect(screen.getByRole("group", { name: "Actions" })).toBeInTheDocument()
    expect(textbox()).toHaveFocus()
  })

  it("narrows by the command, then by a word of the label", async () => {
    render(<WithCommands />)

    await userEvent.type(textbox(), "/add")
    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["/add-noteAdd a note to the well"])

    await userEvent.clear(textbox())
    await userEvent.type(textbox(), "/alert")
    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["/acknowledgeAcknowledge alert"])
  })

  it("moves with the arrow keys and picks with Enter, emptying the box instead of sending", async () => {
    const onCommand = vi.fn()
    const onSubmit = vi.fn()
    render(<WithCommands onCommand={onCommand} onSubmit={onSubmit} />)

    await userEvent.type(textbox(), "/")
    await userEvent.keyboard(
      "{ArrowDown}{ArrowDown}{ArrowDown}{ArrowUp}{Enter}"
    )

    expect(onCommand).toHaveBeenCalledWith(
      COMMANDS[2],
      expect.objectContaining({ setValue: expect.any(Function) })
    )
    expect(onSubmit).not.toHaveBeenCalled()
    expect(textbox()).toHaveValue("")
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(textbox()).toHaveFocus()
  })

  it("picks with Tab and with a click, and lets the command fill the box", async () => {
    render(
      <WithCommands
        onCommand={(item, composer) => composer.setValue(`${item.label}: `)}
      />
    )

    await userEvent.type(textbox(), "/ack{Tab}")
    expect(textbox()).toHaveValue("Acknowledge alert: ")

    await userEvent.clear(textbox())
    await userEvent.type(textbox(), "/")
    await userEvent.click(screen.getByRole("option", { name: /new/ }))
    expect(textbox()).toHaveValue("Start a new conversation: ")
    expect(textbox()).toHaveFocus()
  })

  it("picks the command tapped, which a touch has not made the active one", async () => {
    const onCommand = vi.fn()
    render(<WithCommands onCommand={onCommand} />)

    await userEvent.type(textbox(), "/")
    const note = screen.getByRole("option", { name: /add-note/ })
    expect(note).toHaveAttribute("aria-selected", "false")
    await userEvent.pointer({ keys: "[TouchA]", target: note })

    expect(onCommand).toHaveBeenCalledWith(COMMANDS[2], expect.anything())
  })

  it("closes with Escape until the text changes, and then Enter sends as usual", async () => {
    const onSubmit = vi.fn()
    const onKeyDown = vi.fn()
    render(
      <div onKeyDown={onKeyDown}>
        <WithCommands onSubmit={onSubmit} />
      </div>
    )

    await userEvent.type(textbox(), "/new")
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(onKeyDown).not.toHaveBeenCalledWith(
      expect.objectContaining({ key: "Escape" })
    )

    await userEvent.keyboard("{Enter}")
    expect(onSubmit).toHaveBeenCalledWith({ text: "/new" })
  })

  it("opens again once the text has changed and come back", async () => {
    render(<WithCommands />)

    await userEvent.type(textbox(), "/")
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).toBeNull()

    await userEvent.keyboard("{Backspace}/")
    expect(
      screen.getByRole("listbox", { name: "Commands" })
    ).toBeInTheDocument()
  })

  it("stays closed with no match, or once the slash is not at the start", async () => {
    const onSubmit = vi.fn()
    render(<WithCommands onSubmit={onSubmit} />)

    await userEvent.type(textbox(), "/zzz")
    expect(screen.queryByRole("listbox")).toBeNull()

    await userEvent.clear(textbox())
    await userEvent.type(textbox(), "see /new")
    expect(screen.queryByRole("listbox")).toBeNull()

    await userEvent.clear(textbox())
    await userEvent.type(textbox(), "/new now")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("keeps the arrows for the open list, before the history", async () => {
    render(<WithCommands history={["Earlier question"]} />)

    await userEvent.type(textbox(), "/")
    await userEvent.keyboard("{ArrowUp}")

    expect(textbox()).toHaveValue("/")
    expect(textbox()).toHaveAttribute(
      "aria-activedescendant",
      screen.getAllByRole("option")[2]?.id
    )

    await userEvent.keyboard("{Escape}")
    textbox().setSelectionRange(0, 0)
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("Earlier question")
  })

  it("keeps the list shut on a command recalled from the history", async () => {
    render(<WithCommands history={["Earlier question", "/new"]} />)
    textbox().focus()

    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("/new")
    expect(screen.queryByRole("listbox")).toBeNull()

    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("Earlier question")
    await userEvent.keyboard("{ArrowDown}{ArrowDown}")
    expect(textbox()).toHaveValue("")
  })

  it("lists each group once, where its best match ranks, and moves in that order", async () => {
    const items: ComposerCommandItem[] = [
      { id: "apple", command: "apple", label: "Pick", group: "On this page" },
      { id: "bar", command: "bar", label: "A drink", group: "Chat" },
      { id: "cat", command: "cat", label: "Pet", group: "On this page" },
    ]
    render(
      <Composer onSubmit={() => {}}>
        <ComposerField>
          <ComposerCommands items={items} onCommand={() => {}} />
          <ComposerInput />
        </ComposerField>
      </Composer>
    )

    await userEvent.type(textbox(), "/a")
    const groups = within(screen.getByRole("listbox")).getAllByRole("group")
    expect(groups).toHaveLength(2)
    expect(screen.getByRole("group", { name: "On this page" })).toBe(groups[0])
    expect(screen.getByRole("group", { name: "Chat" })).toBe(groups[1])
    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["/applePick", "/catPet", "/barA drink"])

    await userEvent.keyboard("{ArrowDown}")
    expect(textbox()).toHaveAttribute(
      "aria-activedescendant",
      screen.getAllByRole("option")[1]?.id
    )
    expect(screen.getAllByRole("option")[1]).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("mentions the slash in the hint, and announces how many commands match", async () => {
    render(<WithCommands />)
    expect(screen.getByText(/for commands/)).toBeInTheDocument()

    await userEvent.type(textbox(), "/a")
    expect(
      screen.getByText("3 commands, arrow keys to choose.")
    ).toBeInTheDocument()
  })

  it("keeps each group in one piece, where its best match ranks, and names groups with spaces", async () => {
    // A better match from another group sits between two of "On this page".
    const items: ComposerCommandItem[] = [
      {
        id: "new",
        command: "new",
        label: "Start a new conversation",
        group: "Chat",
      },
      {
        id: "ack",
        command: "acknowledge",
        label: "Acknowledge alert A-7",
        group: "On this page",
      },
      {
        id: "note",
        command: "note",
        label: "Add a note to the well",
        group: "On this page",
      },
      { id: "help", command: "about", label: "About the assistant" },
      { id: "archive", command: "archive", label: "Archive this chat" },
    ]
    render(<WithCommands items={items} />)

    await userEvent.type(textbox(), "/a")

    const listbox = screen.getByRole("listbox", { name: "Commands" })
    const groups = within(listbox).getAllByRole("group")
    expect(groups).toHaveLength(2)
    // A name with spaces still names its group.
    expect(screen.getByRole("group", { name: "On this page" })).toBe(groups[0])
    expect(screen.getByRole("group", { name: "Chat" })).toBe(groups[1])
    const options = screen.getAllByRole("option")
    expect(
      options.map((option) => option.textContent.split(/(?=[A-Z])/)[0])
    ).toEqual(["/acknowledge", "/note", "/about", "/archive", "/new"])
    expect(new Set(options.map((option) => option.id)).size).toBe(5)

    // The textarea names React Aria's own option ids, which the composer
    // builds from the list's id and the key: a React Aria that changes the
    // scheme fails here.
    const active = () =>
      document.getElementById(
        textbox().getAttribute("aria-activedescendant") ?? ""
      )
    expect(active()).toBe(options[0])

    // The arrows follow the listed order across the groups.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}")
    expect(active()).toBe(options[3])
    expect(options[3]).toHaveAttribute("aria-selected", "true")
  })

  it("opens again for the same text typed after Escape and a send", async () => {
    const onSubmit = vi.fn()
    render(<WithCommands onSubmit={onSubmit} />)

    await userEvent.type(textbox(), "/n")
    await userEvent.keyboard("{Escape}{Enter}")
    expect(onSubmit).toHaveBeenCalledWith({ text: "/n" })
    expect(textbox()).toHaveValue("")

    await userEvent.type(textbox(), "/n")
    expect(
      screen.getByRole("listbox", { name: "Commands" })
    ).toBeInTheDocument()
  })

  it("opens again once the text changes after Escape", async () => {
    render(<WithCommands />)

    await userEvent.type(textbox(), "/ne")
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).toBeNull()

    await userEvent.keyboard("{Backspace}")
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })

  it("announces the count in the app's own words", async () => {
    render(
      <WithCommands
        countMessage={(count) => `${count} Befehle, Pfeiltasten zum Wählen.`}
      />
    )

    await userEvent.type(textbox(), "/a")
    expect(
      screen.getByText("3 Befehle, Pfeiltasten zum Wählen.")
    ).toBeInTheDocument()
  })
})
