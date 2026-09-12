import { CopyButton } from "@tecton/react/tecton/copy-button"

export default function CopyButtonLabelled() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CopyButton value="wellbore://34/10-A-12" variant="outline">
        Copy link
      </CopyButton>
      <CopyButton
        value='{"well":"34/10-A-12","td":3250}'
        variant="secondary"
        timeout={4000}
      >
        Copy JSON
      </CopyButton>
    </div>
  )
}
