import { CopyButton } from "@tecton/react/tecton/copy-button"

export default function CopyButtonDemo() {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-card py-1 ps-3 pe-1 font-mono text-sm">
      <span>34/10-A-12</span>
      <CopyButton value="34/10-A-12" />
    </div>
  )
}
