import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentTitle,
} from "@tecton/react/components/attachment"
import { EmptyTitle } from "@tecton/react/components/empty"
import {
  Dropzone,
  DropzoneArea,
  DropzoneList,
  DropzoneRemove,
  DropzoneTrigger,
  formatFileSize,
  useDropzone,
  type DropzoneProps,
} from "@tecton/react/tecton/dropzone"

const file = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type, lastModified: 1 })

const pdf = file("report.pdf", "application/pdf")
const png = file("well.png", "image/png")
const exe = file("setup.exe", "application/x-msdownload")

function Files() {
  const { files } = useDropzone()
  return (
    <DropzoneList>
      {files.map((item) => (
        <Attachment key={item.name}>
          <AttachmentContent>
            <AttachmentTitle>{item.name}</AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <DropzoneRemove file={item} />
          </AttachmentActions>
        </Attachment>
      ))}
    </DropzoneList>
  )
}

function Example(props: Partial<DropzoneProps>) {
  return (
    <Dropzone {...props}>
      <DropzoneArea data-testid="area">
        <EmptyTitle>Drop files here</EmptyTitle>
        <DropzoneTrigger>Browse files</DropzoneTrigger>
      </DropzoneArea>
      <Files />
    </Dropzone>
  )
}

const transfer = (files: File[]) => ({
  dataTransfer: { files, types: ["Files"], dropEffect: "none" },
})

const input = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>("[data-slot=dropzone-input]")!

describe("Dropzone", () => {
  it("renders an Empty drop area with a browse button and no list", () => {
    const { container } = render(<Example />)
    const area = screen.getByTestId("area")
    expect(area).toHaveAttribute("data-slot", "dropzone-area")
    expect(area).toHaveClass("border", "border-dashed")
    expect(
      screen.getByRole("button", { name: "Browse files" })
    ).toHaveAttribute("data-slot", "dropzone-trigger")
    expect(container.querySelector("[data-slot=dropzone-list]")).toBeNull()
    expect(input(container)).toHaveAttribute("tabindex", "-1")
  })

  it("adds dropped files and announces them", () => {
    const onValueChange = vi.fn()
    render(<Example onValueChange={onValueChange} />)
    fireEvent.drop(screen.getByTestId("area"), transfer([pdf, png]))
    expect(onValueChange).toHaveBeenCalledWith([pdf, png])
    expect(screen.getByText("report.pdf")).toBeInTheDocument()
    expect(screen.getByText("well.png")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("2 files added.")
  })

  it("adds files picked through the input", async () => {
    const user = userEvent.setup()
    const { container } = render(<Example />)
    await user.upload(input(container), [pdf])
    expect(screen.getByText("report.pdf")).toBeInTheDocument()
  })

  it("opens the picker from the trigger and from the area, not from other controls", async () => {
    const user = userEvent.setup()
    const { container } = render(<Example />)
    const click = vi.spyOn(input(container), "click")
    await user.click(screen.getByRole("button", { name: "Browse files" }))
    expect(click).toHaveBeenCalledTimes(1)
    await user.click(screen.getByText("Drop files here"))
    expect(click).toHaveBeenCalledTimes(2)
  })

  it("marks the area while files are held over it, through nested children", () => {
    render(<Example />)
    const area = screen.getByTestId("area")
    const title = screen.getByText("Drop files here")
    fireEvent.dragEnter(area, transfer([]))
    fireEvent.dragEnter(title, transfer([]))
    fireEvent.dragLeave(area, transfer([]))
    expect(area).toHaveAttribute("data-dragging")
    expect(area.closest("[data-slot=dropzone]")).toHaveAttribute(
      "data-dragging"
    )
    fireEvent.dragLeave(title, transfer([]))
    expect(area).not.toHaveAttribute("data-dragging")
  })

  it("ignores drags that carry no files", () => {
    const onValueChange = vi.fn()
    render(<Example onValueChange={onValueChange} />)
    const area = screen.getByTestId("area")
    fireEvent.dragEnter(area, { dataTransfer: { types: ["text/plain"] } })
    expect(area).not.toHaveAttribute("data-dragging")
  })

  it("refuses files outside accept, maxSize, minSize and maxFiles", () => {
    const onFileReject = vi.fn()
    render(
      <Example
        accept="image/*,.pdf"
        maxSize={100}
        minSize={5}
        maxFiles={2}
        onFileReject={onFileReject}
      />
    )
    fireEvent.drop(
      screen.getByTestId("area"),
      transfer([
        exe,
        file("huge.pdf", "application/pdf", 500),
        file("empty.png", "image/png", 1),
        pdf,
        png,
        file("third.png", "image/png"),
      ])
    )
    expect(onFileReject).toHaveBeenCalledTimes(1)
    const rejections = onFileReject.mock.calls[0][0]
    expect(
      rejections.map((r: { file: File; reason: string }) => [
        r.file.name,
        r.reason,
      ])
    ).toEqual([
      ["setup.exe", "type"],
      ["huge.pdf", "too-large"],
      ["empty.png", "too-small"],
      ["third.png", "count"],
    ])
    expect(rejections[0].message).toBe(
      "setup.exe: this file type is not accepted."
    )
    expect(screen.getByRole("status")).toHaveTextContent(
      "2 files added. setup.exe: this file type is not accepted."
    )
    // Full: the browse button is disabled and the area refuses.
    expect(screen.getByRole("button", { name: "Browse files" })).toBeDisabled()
    expect(screen.getByTestId("area")).toHaveAttribute("data-disabled")
  })

  it("skips a file that is already in the list", () => {
    const onValueChange = vi.fn()
    render(<Example defaultValue={[pdf]} onValueChange={onValueChange} />)
    fireEvent.drop(screen.getByTestId("area"), transfer([pdf]))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getAllByText("report.pdf")).toHaveLength(1)
  })

  it("keeps one file with multiple={false}: a new one replaces it", () => {
    const onFileReject = vi.fn()
    const { container } = render(
      <Example
        multiple={false}
        defaultValue={[pdf]}
        onFileReject={onFileReject}
      />
    )
    expect(input(container)).not.toHaveAttribute("multiple")
    fireEvent.drop(screen.getByTestId("area"), transfer([png, exe]))
    expect(screen.queryByText("report.pdf")).toBeNull()
    expect(screen.getByText("well.png")).toBeInTheDocument()
    expect(onFileReject.mock.calls[0][0][0].reason).toBe("count")
  })

  it("is controlled by value", () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      <Example value={[pdf]} onValueChange={onValueChange} />
    )
    fireEvent.drop(screen.getByTestId("area"), transfer([png]))
    expect(onValueChange).toHaveBeenCalledWith([pdf, png])
    expect(screen.queryByText("well.png")).toBeNull()
    rerender(<Example value={[pdf, png]} onValueChange={onValueChange} />)
    expect(screen.getByText("well.png")).toBeInTheDocument()
  })

  it("removes a file, announces it and moves focus on", async () => {
    const user = userEvent.setup()
    render(<Example defaultValue={[pdf, png]} />)
    await user.click(screen.getByRole("button", { name: "Remove report.pdf" }))
    expect(screen.queryByText("report.pdf")).toBeNull()
    expect(screen.getByRole("status")).toHaveTextContent("report.pdf removed.")
    expect(
      screen.getByRole("button", { name: "Remove well.png" })
    ).toHaveFocus()
    await user.click(screen.getByRole("button", { name: "Remove well.png" }))
    expect(screen.getByRole("button", { name: "Browse files" })).toHaveFocus()
  })

  it("does nothing while disabled", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(
      <Example disabled onValueChange={onValueChange} />
    )
    const click = vi.spyOn(input(container), "click")
    const area = screen.getByTestId("area")
    expect(area).toHaveAttribute("data-disabled")
    expect(screen.getByRole("button", { name: "Browse files" })).toBeDisabled()
    await user.click(area)
    expect(click).not.toHaveBeenCalled()
    fireEvent.dragEnter(area, transfer([pdf]))
    expect(area).not.toHaveAttribute("data-dragging")
    fireEvent.drop(area, transfer([pdf]))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("takes overridden messages", () => {
    render(
      <Example
        defaultValue={[pdf]}
        messages={{
          added: (n) => `${n} ajouté`,
          remove: (n) => `Retirer ${n}`,
        }}
      />
    )
    expect(
      screen.getByRole("button", { name: "Retirer report.pdf" })
    ).toBeInTheDocument()
    act(() => {
      fireEvent.drop(screen.getByTestId("area"), transfer([png]))
    })
    expect(screen.getByRole("status")).toHaveTextContent("1 ajouté")
  })

  it("throws outside a Dropzone", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<DropzoneTrigger />)).toThrow(
      "DropzoneTrigger must be rendered inside <Dropzone>."
    )
    vi.restoreAllMocks()
  })
})

describe("formatFileSize", () => {
  it("counts in steps of 1024, with one decimal below ten", () => {
    expect(formatFileSize(0, "en-US")).toBe("0 bytes")
    expect(formatFileSize(1, "en-US")).toBe("1 byte")
    expect(formatFileSize(2.4 * 1024 * 1024, "en-US")).toBe("2.4 MB")
    expect(formatFileSize(10 * 1024 * 1024, "en-US")).toBe("10 MB")
    expect(formatFileSize(1536, "en-US")).toBe("1.5 kB")
  })
})
