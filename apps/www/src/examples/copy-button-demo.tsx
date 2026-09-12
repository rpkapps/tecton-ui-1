import { CopyButton } from "@tecton/react/tecton/copy-button"

export default function CopyButtonDemo() {
  return (
    <div className="flex items-center gap-1 rounded-md border bg-card py-1 pr-1 pl-3 font-mono text-sm">
      <span>34/10-A-12</span>
      <CopyButton value="34/10-A-12" />
    </div>
  )
}
