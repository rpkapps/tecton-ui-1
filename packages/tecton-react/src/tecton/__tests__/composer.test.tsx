import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Composer,
  ComposerAttachments,
  ComposerField,
  ComposerHint,
  ComposerInput,
  ComposerStatusMessage,
  ComposerSubmit,
  ComposerSuggestion,
  ComposerSuggestions,
  ComposerToolbar,
  type ComposerAttachmentItem,
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

const textbox = () => screen.getByRole("textbox", { name: "Message" })

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

  it("recalls the last message with ArrowUp only when the box is empty", async () => {
    render(<Chat onRecallLast={() => "Earlier question"} />)

    await userEvent.type(textbox(), "draft{ArrowUp}")
    expect(textbox()).toHaveValue("draft")

    await userEvent.clear(textbox())
    await userEvent.keyboard("{ArrowUp}")
    expect(textbox()).toHaveValue("Earlier question")
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
